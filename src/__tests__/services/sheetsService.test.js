import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as sheetsService from '../../services/sheetsService';
import { CONFIG } from '../../config/sheetsConfig';

// Mock config variables
vi.mock('../../config/sheetsConfig', () => ({
  CONFIG: {
    googleClientId: 'mock-client-id',
    appsScriptUrl: 'https://script.google.com/macros/s/mock-deployment-id/exec'
  }
}));

describe('Sheets Service API Wrappers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('getUser formats action payload correctly', async () => {
    const mockUser = { googleId: 'user_123', email: 'test@digitap.ai', name: 'Test User', role: 'learner' };
    
    // Mock fetch resolution
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockUser, error: null })
    });

    const result = await sheetsService.getUser('user_123');
    
    expect(fetch).toHaveBeenCalledWith(
      CONFIG.appsScriptUrl,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getUser', data: { googleId: 'user_123' } })
      })
    );
    expect(result).toEqual(mockUser);
  });

  test('upsertProgress handles updates correctly', async () => {
    const progressData = { googleId: 'user_123', moduleId: 'mod_1', watchPercent: 85, lastPosition: 420, completed: true };
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: progressData, error: null })
    });

    const result = await sheetsService.upsertProgress(progressData);

    expect(fetch).toHaveBeenCalledWith(
      CONFIG.appsScriptUrl,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'upsertProgress', data: progressData })
      })
    );
    expect(result).toEqual(progressData);
  });

  test('throws error when Apps Script reports execution failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, data: null, error: 'Database Write Locked' })
    });

    await expect(sheetsService.getSections()).rejects.toThrow('Database Write Locked');
  });

  test('throws error on network connection failures', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network connection failed'));

    await expect(sheetsService.getModules()).rejects.toThrow('Network connection failed');
  });
});
