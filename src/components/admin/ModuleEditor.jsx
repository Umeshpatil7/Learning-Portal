import React, { useState, useEffect } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import * as sheetsService from '../../services/sheetsService';
import useSheetsAPI from '../../hooks/useSheetsAPI';

/**
 * ModuleEditor component enabling admins to add, update, delete, and reorder video modules.
 */
export function ModuleEditor() {
  const { sections, modules, refreshProgress } = useProgress();
  const { loading, error, execute } = useSheetsAPI();

  // Active filter state
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Active form state (null means not editing or creating)
  const [editingModule, setEditingModule] = useState(null); 
  const [isNew, setIsNew] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [passThreshold, setPassThreshold] = useState(70);
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(5);
  const [order, setOrder] = useState(1);
  const [published, setPublished] = useState(true);

  // Auto-select first section on load
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  // Filter modules for selected section
  const filteredModules = modules.filter(m => m.sectionId === selectedSectionId);

  const startEdit = (mod) => {
    setIsNew(false);
    setEditingModule(mod);
    setTitle(mod.title);
    setDescription(mod.description);
    setYoutubeUrl(mod.youtubeUrl);
    setPassThreshold(Number(mod.passThreshold || 70));
    setQuestionsPerAttempt(Number(mod.questionsPerAttempt || 5));
    setOrder(Number(mod.order || 1));
    setPublished(String(mod.published) === 'true');
  };

  const startCreate = () => {
    if (!selectedSectionId) {
      alert('Please select a section first.');
      return;
    }
    setIsNew(true);
    setEditingModule({});
    setTitle('');
    setDescription('');
    setYoutubeUrl('');
    setPassThreshold(70);
    setQuestionsPerAttempt(5);
    // Auto-compute next order value
    const maxOrder = filteredModules.reduce((max, m) => Math.max(max, Number(m.order || 0)), 0);
    setOrder(maxOrder + 1);
    setPublished(true);
  };

  // Basic validation of YouTube links
  const isValidYouTubeUrl = (url) => {
    const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return regExp.test(url);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !youtubeUrl) return;

    if (!isValidYouTubeUrl(youtubeUrl)) {
      alert('Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)');
      return;
    }

    const payload = {
      id: isNew ? `mod_${Date.now()}` : editingModule.id,
      sectionId: selectedSectionId,
      title,
      description,
      youtubeUrl,
      passThreshold: Number(passThreshold),
      questionsPerAttempt: Number(questionsPerAttempt),
      order: Number(order),
      published: !!published
    };

    try {
      await execute(sheetsService.upsertModule, payload);
      setEditingModule(null);
      refreshProgress();
    } catch (err) {
      alert('Failed to save module changes: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting this module will delete all associated user progress records and question banks. Proceed?')) {
      return;
    }
    try {
      await execute(sheetsService.deleteModule, id);
      refreshProgress();
    } catch (err) {
      alert('Failed to delete module: ' + err.message);
    }
  };

  const handleReorder = async (mod, direction) => {
    const currentIndex = filteredModules.findIndex(m => m.id === mod.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= filteredModules.length) return;

    const targetMod = filteredModules[targetIndex];
    
    // Swap order values
    const currentOrder = Number(mod.order);
    const targetOrder = Number(targetMod.order);

    try {
      await Promise.all([
        sheetsService.upsertModule({ ...mod, order: targetOrder, published: String(mod.published) === 'true' }),
        sheetsService.upsertModule({ ...targetMod, order: currentOrder, published: String(targetMod.published) === 'true' })
      ]);
      refreshProgress();
    } catch (err) {
      alert('Failed to swap module order: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Section:</span>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={startCreate}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25"
        >
          Create Module
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4">
          Error: {error}
        </div>
      )}

      {/* Editor Modal Overlay */}
      {editingModule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4 animate-scale-in text-left">
            <h4 className="text-xl font-bold text-white">
              {isNew ? 'Create New Module' : 'Edit Module Details'}
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intro to Consent Managers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YouTube URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  rows="2"
                  placeholder="Module details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pass Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions size</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={questionsPerAttempt}
                    onChange={(e) => setQuestionsPerAttempt(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Index</label>
                  <input
                    type="number"
                    required
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end pb-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs font-semibold text-slate-300">Published</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition"
              >
                {loading ? 'Saving...' : 'Save Module'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredModules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No modules found in this section.</div>
        ) : (
          <div className="divide-y divide-slate-850">
            {filteredModules.map((mod, idx) => (
              <div key={mod.id} className="p-5 flex items-center justify-between hover:bg-slate-850/30 transition">
                <div className="text-left space-y-1.5 max-w-lg">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-slate-500">#{mod.order}</span>
                    <h4 className="font-bold text-sm text-white">{mod.title}</h4>
                    {String(mod.published) === 'false' && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-950 border border-slate-850 text-slate-500 uppercase">Unpublished</span>
                    )}
                  </div>
                  <p className="text-slate-450 text-[10px] truncate max-w-xs">{mod.youtubeUrl}</p>
                  <p className="text-slate-400 text-xs leading-normal line-clamp-1">{mod.description}</p>
                </div>

                <div className="flex items-center space-x-2 pl-4">
                  {/* Reorder Buttons */}
                  <button
                    disabled={idx === 0}
                    onClick={() => handleReorder(mod, 'up')}
                    className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </button>
                  <button
                    disabled={idx === filteredModules.length - 1}
                    onClick={() => handleReorder(mod, 'down')}
                    className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  <button
                    onClick={() => startEdit(mod)}
                    className="py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-semibold text-[10px] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(mod.id)}
                    className="py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-semibold text-[10px] transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModuleEditor;
