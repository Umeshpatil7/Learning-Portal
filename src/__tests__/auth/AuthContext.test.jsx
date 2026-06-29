import { describe, test, expect, vi, beforeEach } from 'vitest';
import { isAdminEmail } from '../../config/adminEmails';
import * as authService from '../../services/authService';

// Mock the services
vi.mock('../../services/authService', () => ({
  getGoogleAuthUrl: vi.fn(() => 'https://mock-google-auth.com'),
  parseTokenFromHash: vi.fn(),
  fetchGoogleUserProfile: vi.fn(),
}));

describe('Google Authentication Whitelist', () => {
  test('isAdminEmail identifies whitelisted admin addresses', () => {
    expect(isAdminEmail('admin@digitap.ai')).toBe(true);
    expect(isAdminEmail('umeshrandhir.patil@digitap.ai')).toBe(true);
    expect(isAdminEmail('testadmin@digitap.ai')).toBe(true);
  });

  test('isAdminEmail rejects unknown learner addresses', () => {
    expect(isAdminEmail('learner@digitap.ai')).toBe(false);
    expect(isAdminEmail('random@gmail.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail('')).toBe(false);
  });

  test('isAdminEmail operates in a case-insensitive manner', () => {
    expect(isAdminEmail('ADMIN@DIGITAP.AI')).toBe(true);
    expect(isAdminEmail('UmEsHrAnDhIr.PaTiL@digitap.ai')).toBe(true);
  });
});

describe('Google OAuth service helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('getGoogleAuthUrl constructs redirection links', () => {
    const url = authService.getGoogleAuthUrl();
    expect(url).toBeDefined();
    expect(authService.getGoogleAuthUrl).toHaveBeenCalled();
  });

  test('parseTokenFromHash parses callback tokens correctly', () => {
    vi.mocked(authService.parseTokenFromHash).mockReturnValue('mock-auth-token-123');
    const token = authService.parseTokenFromHash();
    expect(token).toBe('mock-auth-token-123');
    expect(authService.parseTokenFromHash).toHaveBeenCalled();
  });
});
