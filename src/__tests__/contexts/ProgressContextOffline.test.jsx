import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../../contexts/ProgressContext';
import * as sheetsService from '../../services/sheetsService';

// Mock auth context dependency
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { googleId: 'user_offline_123', email: 'test@digitap.ai', role: 'student' }
  })
}));

// Mock sheets service calls
vi.mock('../../services/sheetsService', () => ({
  getSections: vi.fn(() => Promise.resolve([{ id: 'sec1', title: 'Sec 1', order: 1 }])),
  getModules: vi.fn(() => Promise.resolve([{ id: 'mod1', sectionId: 'sec1', title: 'Mod 1', order: 1 }])),
  getProgress: vi.fn(() => Promise.resolve([])),
  upsertProgress: vi.fn(() => Promise.resolve({ success: true }))
}));

describe('ProgressContext Offline Sync Engine', () => {
  let localStorageStore = {};

  beforeEach(() => {
    localStorageStore = {};
    vi.clearAllMocks();

    // Stub localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => localStorageStore[key] || null),
      setItem: vi.fn((key, value) => { localStorageStore[key] = String(value); }),
      removeItem: vi.fn((key) => { delete localStorageStore[key]; }),
      clear: vi.fn(() => { localStorageStore = {}; })
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('queues progress updates in localStorage when browser is offline', async () => {
    // Force browser offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });

    const wrapper = ({ children }) => <ProgressProvider>{children}</ProgressProvider>;
    const { result } = renderHook(() => useProgress(), { wrapper });

    // Wait for context load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Save watch progress while offline
    await act(async () => {
      await result.current.saveWatchProgress('mod1', 50, 120);
    });

    // Verify progress didn't write to sheetsService
    expect(sheetsService.upsertProgress).not.toHaveBeenCalled();

    // Verify it is queued in localStorage
    const queue = JSON.parse(localStorageStore['pending_progress_syncs'] || '[]');
    expect(queue.length).toBe(1);
    expect(queue[0].moduleId).toBe('mod1');
    expect(queue[0].watchPercent).toBe(50);
    expect(queue[0].lastPosition).toBe(120);
  });

  test('automatically flushes queue to Sheets when browser reconnects online', async () => {
    // Start offline with pre-populated queue
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
    
    const preQueue = [
      { googleId: 'user_offline_123', moduleId: 'mod1', watchPercent: 75, lastPosition: 200, completed: false }
    ];
    localStorageStore['pending_progress_syncs'] = JSON.stringify(preQueue);

    const wrapper = ({ children }) => <ProgressProvider>{children}</ProgressProvider>;
    const { result } = renderHook(() => useProgress(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Verify queue count matches
    expect(result.current.pendingCount).toBe(1);

    // Simulate browser reconnection
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Verify it was sent to Sheets
    expect(sheetsService.upsertProgress).toHaveBeenCalledWith(expect.objectContaining({
      moduleId: 'mod1',
      watchPercent: 75
    }));

    // Verify queue is cleared in localStorage
    expect(localStorageStore['pending_progress_syncs']).toBeUndefined();
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.syncStatus).toBe('success');
  });
});
