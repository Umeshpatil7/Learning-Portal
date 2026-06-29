import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import * as sheetsService from '../../services/sheetsService';

/**
 * AnalyticsDashboard component providing cross-cohort summaries,
 * user completion lists, module progress charts, and CSV report downloads.
 */
export function AnalyticsDashboard() {
  const { sections, modules } = useProgress();

  const [users, setUsers] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  
  // Expanded user row ID for detailing progress
  const [expandedUserId, setExpandedUserId] = useState(null);

  // Load all analytics data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedUsers, fetchedProgress, fetchedAttempts] = await Promise.all([
          sheetsService.getAllUsers(),
          sheetsService.getAllProgress(),
          sheetsService.getAllQuizAttempts()
        ]);
        setUsers(fetchedUsers || []);
        setAllProgress(fetchedProgress || []);
        setAllAttempts(fetchedAttempts || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3"></div>
        <span>Aggregating analytics parameters...</span>
      </div>
    );
  }

  // Get unique batches from users list for filter dropdown
  const batches = ['ALL', ...new Set(users.map(u => u.batch || 'N/A').filter(Boolean))];

  // Helper: Get user's completed modules count
  const getUserCompletionCount = (googleId) => {
    return allProgress.filter(p => p.googleId === googleId && String(p.completed) === 'true').length;
  };

  // Helper: Get user's watch progress percent
  const getUserProgressPercent = (googleId) => {
    if (modules.length === 0) return 0;
    const completedCount = getUserCompletionCount(googleId);
    return Math.round((completedCount / modules.length) * 100);
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchEmail.toLowerCase()) || 
                          (u.name && u.name.toLowerCase().includes(searchEmail.toLowerCase()));
    const userBatch = u.batch || 'N/A';
    const matchesBatch = selectedBatch === 'ALL' || userBatch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  // Calculate Drop-off Rate statistics per module (filtered by section if active)
  const activeSectionModules = selectedSectionId === 'ALL'
    ? modules
    : modules.filter(m => m.sectionId === selectedSectionId);

  const moduleStats = activeSectionModules.map(m => {
    // How many users started (watched > 5%)
    const startedCount = allProgress.filter(p => p.moduleId === m.id && Number(p.watchPercent || 0) >= 5).length;
    // How many completed
    const completedCount = allProgress.filter(p => p.moduleId === m.id && String(p.completed) === 'true').length;
    
    const completionRate = startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0;
    const dropOffRate = startedCount > 0 ? 100 - completionRate : 0;

    return {
      id: m.id,
      title: m.title,
      started: startedCount,
      completed: completedCount,
      completionRate,
      dropOffRate
    };
  });

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      alert('No user rows to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Batch', 'Progress (%)', 'Completed Lessons', 'Last Active'];
    const rows = filteredUsers.map(u => [
      u.name || 'N/A',
      u.email,
      u.batch || 'N/A',
      `${getUserProgressPercent(u.googleId)}%`,
      getUserCompletionCount(u.googleId),
      u.lastActive ? new Date(u.lastActive).toLocaleString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `digitap_learning_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Cohort Size</div>
          <div className="text-3xl font-extrabold text-white mt-1">{users.length}</div>
          <div className="text-slate-400 text-xs mt-1.5 font-semibold">Registered trainees logged</div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Ecosystem Course Pass Rate</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            {allAttempts.length > 0 
              ? `${Math.round((allAttempts.filter(a => String(a.passed) === 'true').length / allAttempts.length) * 100)}%`
              : '0%'}
          </div>
          <div className="text-slate-400 text-xs mt-1.5 font-semibold">Total MCQs: {allAttempts.length} attempts</div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Ecosystem Modules Completed</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-1">
            {allProgress.filter(p => String(p.completed) === 'true').length}
          </div>
          <div className="text-slate-400 text-xs mt-1.5 font-semibold">Synced watched positions</div>
        </div>
      </div>

      {/* Module Progression / Drop-off Charts */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h4 className="font-bold text-base text-white">Lesson Drop-off Rates</h4>
            <p className="text-xs text-slate-450">Analyzes percentage of users who started a lesson but did not pass its quiz.</p>
          </div>
          
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Sections</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-5">
          {moduleStats.map(stat => (
            <div key={stat.id} className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-350">
                <span className="truncate max-w-xs">{stat.title}</span>
                <span className="font-mono text-[11px]">
                  {stat.completed} / {stat.started} completed ({100 - stat.dropOffRate}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950/60 overflow-hidden flex">
                {stat.started > 0 ? (
                  <>
                    <div 
                      style={{ width: `${stat.completionRate}%` }} 
                      className="bg-indigo-500 h-full rounded-l transition-all duration-300"
                      title="Completed"
                    ></div>
                    <div 
                      style={{ width: `${stat.dropOffRate}%` }} 
                      className="bg-red-500/80 h-full rounded-r transition-all duration-300"
                      title="Dropped off"
                    ></div>
                  </>
                ) : (
                  <div className="w-full bg-slate-900/40 h-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Progression Table */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-base text-white">Learner Cohorts Directory</h4>
            <p className="text-xs text-slate-450">Review course completions, last active timestamps, and batch classifications.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search email or name..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
            />

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batches.filter(b => b !== 'ALL').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-750 transition"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-450 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Cohort</th>
                  <th className="p-4">Completion</th>
                  <th className="p-4">Last Sync</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No matching learners found.</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const isExpanded = expandedUserId === user.googleId;
                    const completionCount = getUserCompletionCount(user.googleId);
                    const progressPercent = getUserProgressPercent(user.googleId);

                    return (
                      <React.Fragment key={user.googleId}>
                        <tr className="hover:bg-slate-850/20 transition">
                          <td className="p-4 font-semibold text-white">{user.name || 'N/A'}</td>
                          <td className="p-4 text-slate-400 font-mono">{user.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400">
                              {user.batch || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white">{progressPercent}%</span>
                              <span className="text-slate-500">({completionCount}/{modules.length})</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-450 font-mono text-[11px]">
                            {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setExpandedUserId(isExpanded ? null : user.googleId)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              {isExpanded ? 'Hide Details' : 'View Progress'}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Module Breakdown Details Row */}
                        {isExpanded && (
                          <tr className="bg-slate-950/40">
                            <td colSpan="6" className="p-5 border-t border-b border-slate-850">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {modules.map(m => {
                                  const prog = allProgress.find(p => p.googleId === user.googleId && p.moduleId === m.id);
                                  const isComp = prog && String(prog.completed) === 'true';

                                  return (
                                    <div key={m.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-left">
                                      <div className="space-y-0.5 truncate pr-2">
                                        <div className="font-semibold text-white text-xs truncate">{m.title}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          Watch: {Math.round(Number(prog?.watchPercent || 0))}%
                                        </div>
                                      </div>
                                      
                                      {isComp ? (
                                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">Passed</span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-900 border border-slate-800 text-slate-500 uppercase">Pending</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
