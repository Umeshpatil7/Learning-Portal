import React, { useState } from 'react';
import AdminGuard from '../components/auth/AdminGuard';
import SectionEditor from '../components/admin/SectionEditor';
import ModuleEditor from '../components/admin/ModuleEditor';
import QuestionEditor from '../components/admin/QuestionEditor';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import { useProgress } from '../contexts/ProgressContext';

/**
 * AdminPage layout housing course content management sub-editors.
 * Restricts access to administrator whitelist accounts.
 */
export function AdminPage() {
  const { refreshProgress, loading } = useProgress();
  const [activeTab, setActiveTab] = useState('sections');

  const tabs = [
    { id: 'sections', name: 'Sections List' },
    { id: 'modules', name: 'Modules Manager' },
    { id: 'questions', name: 'MCQ Banks' },
    { id: 'analytics', name: 'Analytics Board' }
  ];

  return (
    <AdminGuard>
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Console</h2>
            <p className="text-slate-400 text-sm">Configure learning paths, video modules, and MCQ assessment parameters.</p>
          </div>
          
          <button
            disabled={loading}
            onClick={refreshProgress}
            className="self-start sm:self-center inline-flex items-center space-x-2 py-2 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 active:bg-slate-950 transition text-xs font-semibold text-slate-300"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"></path>
              </svg>
            )}
            <span>Reload Sheets DB</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2 border-b border-slate-850">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition -mb-[2px] ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 font-extrabold'
                    : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Active Editor Panel */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-3xl p-6 md:p-8">
          {activeTab === 'sections' && <SectionEditor />}
          {activeTab === 'modules' && <ModuleEditor />}
          {activeTab === 'questions' && <QuestionEditor />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
        </div>
      </div>
    </AdminGuard>
  );
}

export default AdminPage;
