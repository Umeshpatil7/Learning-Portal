import React from 'react';
import { useProgress } from '../contexts/ProgressContext';

/**
 * SectionPage displaying modules list within a section.
 * Supports locked/unlocked rendering based on sequence progress.
 * 
 * @param {Object} props
 * @param {string} props.sectionId - Active section identifier
 * @param {Function} props.onNavigate - Navigation callback
 */
export function SectionPage({ sectionId, onNavigate }) {
  const { sections, modules, userProgress, isModuleUnlocked, loading, error, offlineMode } = useProgress();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  const section = sections.find(s => s.id === sectionId);
  if (!section) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 bg-slate-950 text-center">
        <h3 className="text-xl font-bold text-white">Section Not Found</h3>
        <button
          onClick={() => onNavigate('#/')}
          className="mt-4 py-2 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Filter modules for this section
  const sectionModules = modules.filter(m => m.sectionId === sectionId && m.published);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Offline Warning Alert Banner */}
      {offlineMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center space-x-3 text-amber-400 text-xs font-semibold animate-pulse">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <div className="text-left leading-relaxed">
            <span className="font-bold">Offline Cache Active:</span> Viewing cached lesson paths. Your watch progress will sync to Sheets automatically once your network reconnects.
          </div>
        </div>
      )}

      {/* Back Button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => onNavigate('#/')}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition space-x-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span>Back to Learning Paths</span>
        </button>
        
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{section.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">{section.description}</p>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {sectionModules.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            No published modules available in this section.
          </div>
        ) : (
          sectionModules.map((mod, index) => {
            const unlocked = isModuleUnlocked(mod.id);
            const progress = userProgress[mod.id] || {};
            const watchPercent = progress.watchPercent || 0;
            const completed = progress.completed;

            return (
              <div
                key={mod.id}
                onClick={() => unlocked && onNavigate(`#/module/${mod.id}`)}
                className={`relative group border rounded-2xl p-5 md:p-6 transition duration-200 ${
                  unlocked
                    ? 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700/80 cursor-pointer shadow-lg hover:shadow-indigo-500/5'
                    : 'bg-slate-900/40 border-slate-800/50 opacity-60 cursor-not-allowed select-none'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  {/* Left content: Title & Info */}
                  <div className="flex items-start space-x-4">
                    {/* Index Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      completed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : unlocked
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-slate-950 text-slate-500 border border-slate-900'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="space-y-1">
                      <h4 className={`font-bold text-base transition-colors ${
                        unlocked ? 'text-white group-hover:text-indigo-400' : 'text-slate-500'
                      }`}>
                        {mod.title}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-xl line-clamp-1">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Right content: Status indicators */}
                  <div className="flex items-center space-x-4 md:pl-6">
                    {completed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Completed
                      </span>
                    ) : unlocked ? (
                      watchPercent > 0 ? (
                        <div className="text-right space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            In Progress
                          </span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{Math.round(watchPercent)}% watched</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Start Lesson
                        </span>
                      )
                    ) : (
                      <div className="flex items-center text-slate-500 space-x-1.5 text-xs font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <span className="hidden sm:inline">Locked</span>
                      </div>
                    )}

                    {/* Navigation arrow for unlocked modules */}
                    {unlocked && (
                      <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition duration-200 hidden sm:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Progress highlight line */}
                {unlocked && watchPercent > 0 && !completed && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950 overflow-hidden rounded-b-2xl">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${watchPercent}%` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SectionPage;
