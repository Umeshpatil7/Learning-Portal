import React, { useState, useEffect, useCallback } from 'react';
import { useProgress } from '../../contexts/ProgressContext';
import * as sheetsService from '../../services/sheetsService';
import useSheetsAPI from '../../hooks/useSheetsAPI';

/**
 * QuestionEditor component enabling admins to manage question banks for each module.
 */
export function QuestionEditor() {
  const { sections, modules } = useProgress();
  const { loading, error, execute } = useSheetsAPI();

  // Active filter states
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Active form state (null means not editing or creating)
  const [editingQuestion, setEditingQuestion] = useState(null); 
  const [isNew, setIsNew] = useState(false);

  // Form fields
  const [stem, setStem] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [triggerType, setTriggerType] = useState('end');
  const [triggerTimestamp, setTriggerTimestamp] = useState(0);

  // Auto-select first section on load
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  // Filter modules matching section
  const sectionModules = modules.filter(m => m.sectionId === selectedSectionId);

  // Auto-select first module when section changes
  useEffect(() => {
    if (sectionModules.length > 0) {
      // Keep selected module if it is in the new list, else select first
      const hasMatch = sectionModules.some(m => m.id === selectedModuleId);
      if (!hasMatch) {
        setSelectedModuleId(sectionModules[0].id);
      }
    } else {
      setSelectedModuleId('');
    }
  }, [sectionModules, selectedModuleId]);

  // Fetch questions for the selected module
  const fetchQuestions = useCallback(async () => {
    if (!selectedModuleId) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    try {
      const fetched = await sheetsService.getQuestions();
      const moduleQuestions = (fetched || []).filter(q => q.moduleId === selectedModuleId);
      setQuestions(moduleQuestions);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedModuleId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const startEdit = (q) => {
    setIsNew(false);
    setEditingQuestion(q);
    setStem(q.stem);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectOption(q.correctOption || 'A');
    setExplanation(q.explanation);
    setTriggerType(q.triggerType || 'end');
    setTriggerTimestamp(Number(q.triggerTimestamp || 0));
  };

  const startCreate = () => {
    if (!selectedModuleId) {
      alert('Please select a module first.');
      return;
    }
    setIsNew(true);
    setEditingQuestion({});
    setStem('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectOption('A');
    setExplanation('');
    setTriggerType('end');
    setTriggerTimestamp(0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!stem || !optionA || !optionB || !optionC || !optionD) return;

    const payload = {
      id: isNew ? `q_${Date.now()}` : editingQuestion.id,
      moduleId: selectedModuleId,
      stem,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation,
      triggerType,
      triggerTimestamp: triggerType === 'mid' ? Number(triggerTimestamp) : 0
    };

    try {
      await execute(sheetsService.upsertQuestion, payload);
      setEditingQuestion(null);
      fetchQuestions(); // Reload list
    } catch (err) {
      alert('Failed to save question changes: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await execute(sheetsService.deleteQuestion, id);
      fetchQuestions();
    } catch (err) {
      alert('Failed to delete question: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropdown Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Section:</span>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module:</span>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              disabled={sectionModules.length === 0}
              className="bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none disabled:opacity-40"
            >
              {sectionModules.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={startCreate}
          disabled={!selectedModuleId}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Question
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4">
          Error: {error}
        </div>
      )}

      {/* Editor Modal Overlay */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4 animate-scale-in text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h4 className="text-xl font-bold text-white">
              {isNew ? 'Add MCQ Question' : 'Edit Question Details'}
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question text (Stem)</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Which entity initiates the consent request flow?"
                  value={stem}
                  onChange={(e) => setStem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Option A</label>
                  <input
                    type="text"
                    required
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Option B</label>
                  <input
                    type="text"
                    required
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Option C</label>
                  <input
                    type="text"
                    required
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Option D</label>
                  <input
                    type="text"
                    required
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correct Option</label>
                  <select
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trigger Type</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="end">End of Video</option>
                    <option value="mid">Mid-Video Check</option>
                  </select>
                </div>

                {triggerType === 'mid' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp (Sec)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={triggerTimestamp}
                      onChange={(e) => setTriggerTimestamp(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Answer Explanation</label>
                <textarea
                  rows="2"
                  placeholder="Explain why choice is correct..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition"
              >
                {loading ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-left">
        {loadingQuestions ? (
          <div className="p-12 text-center text-slate-450 text-xs">
            <div className="w-6 h-6 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No questions in module question bank.</div>
        ) : (
          <div className="divide-y divide-slate-850">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-5 flex items-start justify-between hover:bg-slate-850/30 transition">
                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-500">Q{idx + 1}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold ${
                      q.triggerType === 'mid' 
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    } uppercase`}>
                      {q.triggerType === 'mid' ? `Mid-Video @ ${q.triggerTimestamp}s` : 'End of Video'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white leading-relaxed">{q.stem}</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-400 pt-1">
                    <div><span className={`font-semibold mr-1 ${q.correctOption === 'A' ? 'text-emerald-400' : 'text-slate-600'}`}>A:</span> {q.optionA}</div>
                    <div><span className={`font-semibold mr-1 ${q.correctOption === 'B' ? 'text-emerald-400' : 'text-slate-600'}`}>B:</span> {q.optionB}</div>
                    <div><span className={`font-semibold mr-1 ${q.correctOption === 'C' ? 'text-emerald-400' : 'text-slate-600'}`}>C:</span> {q.optionC}</div>
                    <div><span className={`font-semibold mr-1 ${q.correctOption === 'D' ? 'text-emerald-400' : 'text-slate-600'}`}>D:</span> {q.optionD}</div>
                  </div>
                  {q.explanation && (
                    <p className="text-[10px] text-slate-500 italic bg-slate-950/20 border border-slate-900 rounded p-2 mt-2 leading-relaxed">
                      <span className="font-bold uppercase tracking-wider text-[8px] not-italic mr-1.5 text-slate-600">Explanation:</span>
                      {q.explanation}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pl-4 flex-shrink-0">
                  <button
                    onClick={() => startEdit(q)}
                    className="py-1.5 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-semibold text-[10px] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
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

export default QuestionEditor;
