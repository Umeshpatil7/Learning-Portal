import React from 'react';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * HomePage displaying the section cards grid and aggregate progress metrics.
 * @param {Object} props
 * @param {Function} props.onNavigate - Callback to navigate, e.g. onNavigate('#/section/id')
 */
export function HomePage({ onNavigate }) {
  const { user } = useAuth();
  const { sections, modules, userProgress, loading, error, offlineMode } = useProgress();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Loading training database...</p>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 bg-slate-950 text-center px-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Failed to load content</h3>
        <p className="text-slate-400 text-sm max-w-md mt-2">{error}</p>
      </div>
    );
  }

  // Calculate global completed count
  const totalModules = modules.filter(m => m.published).length;
  const completedModules = Object.values(userProgress).filter(p => p.completed).length;
  const overallPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
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
      
      {/* Welcome Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>
        <div className="space-y-4 md:max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Hi, {user?.name?.split(' ')[0] || 'Learner'} 👋
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Welcome to your training dashboard. Complete the modules sequentially, pass the assessment quizzes, and acquire certified knowledge in the Account Aggregator fintech framework.
          </p>

          {/* Quick Progress Bar */}
          <div className="pt-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Overall Training Completion</span>
              <span className="text-indigo-400 font-bold">{overallPercent}% ({completedModules}/{totalModules} passed)</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                style={{ width: `${overallPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections Lists Grid */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight pl-1 border-l-4 border-indigo-500">
          Learning Paths
        </h3>
        
        {sections.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            No published training sections found in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map(section => {
              // Filter published modules in this section
              const sectionModules = modules.filter(m => m.sectionId === section.id && m.published);
              const totalSectionMods = sectionModules.length;
              
              const completedSectionMods = sectionModules.filter(m => {
                const prog = userProgress[m.id];
                return !!prog?.completed;
              }).length;

              const sectionPercent = totalSectionMods > 0 
                ? Math.round((completedSectionMods / totalSectionMods) * 100) 
                : 0;

              return (
                <div
                  key={section.id}
                  onClick={() => onNavigate(`#/section/${section.id}`)}
                  className="group bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 shadow-lg hover:shadow-indigo-500/5 transition duration-200 cursor-pointer flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400">
                        {totalSectionMods} {totalSectionMods === 1 ? 'Module' : 'Modules'}
                      </span>
                      {sectionPercent === 100 && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {section.title}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                      {section.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-800/80">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase">
                      <span>Path Progress</span>
                      <span className="text-indigo-400 font-bold">{sectionPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 rounded-full"
                        style={{ width: `${sectionPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
