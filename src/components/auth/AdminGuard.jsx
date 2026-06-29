import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Guard component that blocks non-admin users.
 * Displays a premium "Access Denied" page if the user is not an administrator.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements to protect.
 */
export function AdminGuard({ children, fallbackRoute = '#' }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100">
        <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Access Denied</h1>
          <p className="text-slate-400 text-sm">
            You do not have administrative privileges to access this area. Please return to the homepage.
          </p>
          <div className="pt-4 border-t border-slate-800">
            <a
              href={fallbackRoute}
              className="inline-block w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium transition duration-200 shadow-lg shadow-indigo-600/20 text-sm"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminGuard;
