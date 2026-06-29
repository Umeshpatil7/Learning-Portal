import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgressProvider, useProgress } from '../../contexts/ProgressContext';
import { useAuth } from '../../contexts/AuthContext';
import * as sheetsService from '../../services/sheetsService';

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Sheets Service
vi.mock('../../services/sheetsService', () => ({
  getSections: vi.fn(),
  getModules: vi.fn(),
  getProgress: vi.fn(),
  upsertProgress: vi.fn(),
}));

// Test helper component to invoke hooks
function LockTester({ moduleId, onCheck }) {
  const { isModuleUnlocked, loading } = useProgress();
  if (loading) return <div>Loading...</div>;
  return (
    <button onClick={() => onCheck(isModuleUnlocked(moduleId))}>
      Check {moduleId}
    </button>
  );
}

describe('Prerequisite Locking System', () => {
  const mockUser = { googleId: 'learner_123', email: 'learner@digitap.ai', name: 'Learner', role: 'learner' };
  
  const mockSections = [
    { id: 'sec_1', title: 'Intro', description: 'Intro sec', order: 1 }
  ];
  
  const mockModules = [
    { id: 'mod_1', sectionId: 'sec_1', title: 'Mod 1', order: 1, published: true },
    { id: 'mod_2', sectionId: 'sec_1', title: 'Mod 2', order: 2, published: true },
    { id: 'mod_3', sectionId: 'sec_1', title: 'Mod 3', order: 3, published: true }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(sheetsService.getSections).mockResolvedValue(mockSections);
    vi.mocked(sheetsService.getModules).mockResolvedValue(mockModules);
  });

  test('first module is always unlocked by default', async () => {
    vi.mocked(sheetsService.getProgress).mockResolvedValue([]);
    const checkFn = vi.fn();

    render(
      <ProgressProvider>
        <LockTester moduleId="mod_1" onCheck={checkFn} />
      </ProgressProvider>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    screen.getByText('Check mod_1').click();
    expect(checkFn).toHaveBeenCalledWith(true);
  });

  test('subsequent module is locked if predecessor is not completed', async () => {
    vi.mocked(sheetsService.getProgress).mockResolvedValue([]);
    const checkFn = vi.fn();

    render(
      <ProgressProvider>
        <LockTester moduleId="mod_2" onCheck={checkFn} />
      </ProgressProvider>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    screen.getByText('Check mod_2').click();
    expect(checkFn).toHaveBeenCalledWith(false);
  });

  test('subsequent module is unlocked if predecessor progress is marked completed', async () => {
    // Mock user progress: mod_1 is completed
    const mockProgress = [
      { id: 'learner_123_mod_1', googleId: 'learner_123', moduleId: 'mod_1', watchPercent: 100, lastPosition: 120, completed: 'true' }
    ];
    vi.mocked(sheetsService.getProgress).mockResolvedValue(mockProgress);
    const checkFn = vi.fn();

    render(
      <ProgressProvider>
        <LockTester moduleId="mod_2" onCheck={checkFn} />
      </ProgressProvider>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    screen.getByText('Check mod_2').click();
    expect(checkFn).toHaveBeenCalledWith(true);
  });

  test('administrators bypass all locking constraints', async () => {
    // Configure user as admin
    vi.mocked(useAuth).mockReturnValue({ user: { ...mockUser, role: 'admin' } });
    vi.mocked(sheetsService.getProgress).mockResolvedValue([]);
    const checkFn = vi.fn();

    render(
      <ProgressProvider>
        <LockTester moduleId="mod_3" onCheck={checkFn} />
      </ProgressProvider>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    screen.getByText('Check mod_3').click();
    expect(checkFn).toHaveBeenCalledWith(true);
  });
});
