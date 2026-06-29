import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProgressProvider, useProgress } from './contexts/ProgressContext';
import AuthGuard from './components/auth/AuthGuard';
import useHashRoute from './hooks/useHashRoute';
import HomePage from './pages/HomePage';
import SectionPage from './pages/SectionPage';
import ModulePage from './pages/ModulePage';
import AdminPage from './pages/AdminPage';

/**
 * Main application content after AuthGuard validation.
 * Manages active route rendering using custom hash routing.
 */
function MainDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const { route, params, navigate } = useHashRoute();
  const { syncStatus, pendingCount } = useProgress();

  // Sync status badge renderer
  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'offline':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] sm:text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Offline (Pending: {pendingCount})</span>
          </div>
        );
      case 'syncing':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] sm:text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Syncing...</span>
          </div>
        );
      case 'success':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-xs font-semibold animate-fade-out">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Cloud Synced</span>
          </div>
        );
      case 'error':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] sm:text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Sync Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper to render the active page view
  const renderPage = () => {
    switch (route) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'section':
        return <SectionPage sectionId={params.sectionId} onNavigate={navigate} />;
      case 'module':
        return <ModulePage moduleId={params.moduleId} onNavigate={navigate} />;
      case 'admin':
        return <AdminPage />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Premium Header Navigation */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div
          onClick={() => navigate('#/')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight group-hover:text-indigo-400 transition duration-200">
            Digitap Learning
          </span>
        </div>

        {/* User profile controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* Sync Status Badge */}
          {renderSyncBadge()}

          {/* Admin Navigation Indicator */}
          {isAdmin && (
            <button
              onClick={() => navigate('#/admin')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                route === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              <span className="hidden sm:inline">Admin Console</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-slate-700 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-white leading-tight">{user?.name}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 flex flex-col w-full bg-slate-950">
        {renderPage()}
      </main>
    </div>
  );
}

/**
 * Root App wrapping auth and progress states.
 */
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <ProgressProvider>
          <MainDashboard />
        </ProgressProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
