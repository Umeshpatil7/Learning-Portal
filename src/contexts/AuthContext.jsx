import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGoogleAuthUrl, parseTokenFromHash, fetchGoogleUserProfile } from '../services/authService';
import { isAdminEmail } from '../config/adminEmails';
import * as sheetsService from '../services/sheetsService';

// Initialize context
const AuthContext = createContext(null);

/**
 * Custom hook to consume the AuthContext.
 * @returns {Object} Auth state and helpers
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * AuthProvider component that wraps the application.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. Check for incoming OAuth token redirect
        const hashToken = parseTokenFromHash();
        if (hashToken) {
          setLoading(true);
          const profile = await fetchGoogleUserProfile(hashToken);
          
          const authenticatedUser = {
            ...profile,
            role: isAdminEmail(profile.email) ? 'admin' : 'learner',
            token: hashToken
          };

          // Save/Register user details to Google Sheets database
          try {
            await sheetsService.upsertUser({
              googleId: authenticatedUser.googleId,
              email: authenticatedUser.email,
              name: authenticatedUser.name,
              picture: authenticatedUser.picture
            });
          } catch (sheetsErr) {
            console.error('Failed to sync user profile to Google Sheets:', sheetsErr);
            // Non-blocking: allow login even if Sheet sync fails (offline/loading buffer)
          }

          localStorage.setItem('digitap_user', JSON.stringify(authenticatedUser));
          setUser(authenticatedUser);
          setLoading(false);
          return;
        }

        // 2. Fall back to localStorage session
        const stored = localStorage.getItem('digitap_user');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          // Re-evaluate role on load in case whitelist changed
          parsedUser.role = isAdminEmail(parsedUser.email) ? 'admin' : 'learner';
          setUser(parsedUser);

          // Sync profile details in the background
          sheetsService.upsertUser({
            googleId: parsedUser.googleId,
            email: parsedUser.email,
            name: parsedUser.name,
            picture: parsedUser.picture
          }).catch(err => console.warn('Background session profile sync failed:', err));
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setError(err.message || 'Authentication failed');
        // Clear broken session
        localStorage.removeItem('digitap_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  /**
   * Triggers redirection to Google's sign-in portal.
   */
  const login = () => {
    setError(null);
    window.location.href = getGoogleAuthUrl();
  };

  /**
   * Logs out the user by clearing storage and resetting state.
   */
  const logout = () => {
    localStorage.removeItem('digitap_user');
    setUser(null);
    setError(null);
  };

  const val = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={val}>
      {children}
    </AuthContext.Provider>
  );
}
