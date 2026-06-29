import React, { useState } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import * as sheetsService from '../../services/sheetsService';
import useSheetsAPI from '../../hooks/useSheetsAPI';

/**
 * SectionEditor component enabling admins to add, update, delete, and reorder course sections.
 */
export function SectionEditor() {
  const { sections, refreshProgress } = useProgress();
  const { loading, error, execute } = useSheetsAPI();

  // Active form state (null means not editing or creating)
  const [editingSection, setEditingSection] = useState(null); 
  const [isNew, setIsNew] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);
  const [published, setPublished] = useState(true);

  const startEdit = (sec) => {
    setIsNew(false);
    setEditingSection(sec);
    setTitle(sec.title);
    setDescription(sec.description);
    setOrder(Number(sec.order || 1));
    setPublished(String(sec.published) === 'true');
  };

  const startCreate = () => {
    setIsNew(true);
    setEditingSection({});
    setTitle('');
    setDescription('');
    // Auto-compute next order value
    const maxOrder = sections.reduce((max, s) => Math.max(max, Number(s.order || 0)), 0);
    setOrder(maxOrder + 1);
    setPublished(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title) return;

    const payload = {
      id: isNew ? `sec_${Date.now()}` : editingSection.id,
      title,
      description,
      order: Number(order),
      published: !!published
    };

    try {
      await execute(sheetsService.upsertSection, payload);
      setEditingSection(null);
      refreshProgress(); // Pull updated content definition
    } catch (err) {
      alert('Failed to save section changes: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting this section will delete all associated modules and question banks. Proceed?')) {
      return;
    }
    try {
      await execute(sheetsService.deleteSection, id);
      refreshProgress();
    } catch (err) {
      alert('Failed to delete section: ' + err.message);
    }
  };

  const handleReorder = async (sec, direction) => {
    const currentIndex = sections.findIndex(s => s.id === sec.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const targetSec = sections[targetIndex];
    
    // Swap order values
    const currentOrder = Number(sec.order);
    const targetOrder = Number(targetSec.order);

    try {
      await Promise.all([
        sheetsService.upsertSection({ ...sec, order: targetOrder, published: String(sec.published) === 'true' }),
        sheetsService.upsertSection({ ...targetSec, order: currentOrder, published: String(targetSec.published) === 'true' })
      ]);
      refreshProgress();
    } catch (err) {
      alert('Failed to swap orders: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <div className="text-left space-y-1">
          <h3 className="text-lg font-bold text-white">Course Sections</h3>
          <p className="text-slate-400 text-xs">Manage paths, descriptors, and sequence order.</p>
        </div>
        <button
          onClick={startCreate}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25"
        >
          Create Section
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4">
          Error: {error}
        </div>
      )}

      {/* Editor Modal Overlay */}
      {editingSection && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 animate-scale-in text-left">
            <h4 className="text-xl font-bold text-white">
              {isNew ? 'Create New Section' : 'Edit Section Details'}
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA Ecosystem Training"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  rows="3"
                  placeholder="Summarize course scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Position</label>
                  <input
                    type="number"
                    required
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end pb-1.5">
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
                onClick={() => setEditingSection(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition"
              >
                {loading ? 'Saving...' : 'Save Section'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sections List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {sections.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No sections configured.</div>
        ) : (
          <div className="divide-y divide-slate-850">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="p-5 flex items-center justify-between hover:bg-slate-850/30 transition">
                <div className="text-left space-y-1.5 max-w-lg">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-slate-500">#{sec.order}</span>
                    <h4 className="font-bold text-sm text-white">{sec.title}</h4>
                    {String(sec.published) === 'false' && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-950 border border-slate-850 text-slate-500 uppercase">Unpublished</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-normal line-clamp-1">{sec.description}</p>
                </div>

                <div className="flex items-center space-x-2 pl-4">
                  {/* Reorder Buttons */}
                  <button
                    disabled={idx === 0}
                    onClick={() => handleReorder(sec, 'up')}
                    className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"></path>
                    </svg>
                  </button>
                  <button
                    disabled={idx === sections.length - 1}
                    onClick={() => handleReorder(sec, 'down')}
                    className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move Down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* Edit/Delete Actions */}
                  <button
                    onClick={() => startEdit(sec)}
                    className="py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-semibold text-[10px] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sec.id)}
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

export default SectionEditor;
