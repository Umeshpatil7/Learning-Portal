import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Login Screen featuring the "Sign in with Google" button.
 */
export function GoogleLogin() {
  const { login, error } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-2">
            <svg className="w-7 h-7 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Digitap Learning</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Access internal guides, video modules, and certifications for the Account Aggregator ecosystem.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4 flex items-start space-x-2">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <span className="font-semibold">Sign-in error:</span> {error}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={login}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-semibold transition duration-200 shadow-xl text-sm"
          >
            {/* Google Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38C16.88,16.3,14.8,17.4,12,17.4c-2.9,0-5.4-1.8-6.3-4.4c-0.2-0.7-0.4-1.4-0.4-2c0-0.7,0.2-1.4,0.4-2C6.6,6.4,9.1,4.6,12,4.6c1.9,0,3.5,0.7,4.8,1.9l2-2C16.9,2.8,14.6,2,12,2C8.3,2,5.2,4.1,3.7,7.2C3.3,8.1,3,9,3,10c0,1,0.3,1.9,0.7,2.8c1.5,3.1,4.6,5.2,8.3,5.2c5.1,0,8.7-3.6,8.7-8.7C20.7,11.8,20.6,11.4,21.35,11.1Z" fill="#EA4335" />
                <path d="M12,22c2.6,0,4.9-0.8,6.6-2.3l-3.2-2.5c-0.9,0.6-2.1,1-3.4,1c-2.9,0-5.4-1.8-6.3-4.4l-3.2,2.5C3.7,17.9,8.3,22,12,22Z" fill="#34A853" />
                <path d="M5.7,13.8C5.5,13.1,5.4,12.4,5.4,11.7c0-0.7,0.1-1.4,0.3-2.1L2.5,7.1C1.7,8.7,1.2,10.5,1.2,12.3c0,1.8,0.5,3.6,1.3,5.2L5.7,13.8Z" fill="#FBBC05" />
                <path d="M12,5.4c1.6,0,3,0.6,4.1,1.6l3.1-3.1C17.3,2.3,14.8,1.2,12,1.2C8.3,1.2,3.7,5.3,3.7,9l3.2,2.5C7.8,7.2,10.3,5.4,12,5.4Z" fill="#4285F4" />
              </g>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 max-w-xs mx-auto">
          Please use your authorized corporate @digitap.ai email to register or log in.
        </p>
      </div>
    </div>
  );
}

export default GoogleLogin;
