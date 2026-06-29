import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLogin from './GoogleLogin';

/**
 * Route guard that requires users to be authenticated.
 * If not authenticated, renders the Login Screen.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements to protect.
 */
export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100">
        <div className="relative flex flex-col items-center">
          {/* Animated Spinner Ring */}
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
          <span className="mt-4 text-sm font-semibold tracking-wider text-indigo-400 uppercase animate-pulse">
            Verifying Authentication...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <GoogleLogin />;
  }

  return <>{children}</>;
}

export default AuthGuard;
