import React, { useState, useEffect } from 'react';
import { useProgress } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/player/VideoPlayer';
import QuizModal from '../components/quiz/QuizModal';
import * as sheetsService from '../services/sheetsService';

/**
 * ModulePage rendering the lesson player and the assessment interface.
 * Locks routing for unauthorized students who manually bypass locked indexes.
 * 
 * @param {Object} props
 * @param {string} props.moduleId - The active module ID
 * @param {Function} props.onNavigate - Navigation trigger callback
 */
export function ModulePage({ moduleId, onNavigate }) {
  const { user } = useAuth();
  const {
    modules,
    userProgress,
    saveWatchProgress,
    completeModule,
    isModuleUnlocked,
    loading: progressLoading
  } = useProgress();

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  // Modal visibility states
  const [showEndQuiz, setShowEndQuiz] = useState(false);
  const [activeMidQuestion, setActiveMidQuestion] = useState(null);

  // Find module details
  const activeModule = modules.find(m => m.id === moduleId);

  // 1. Check prerequisite locks on mount/load
  useEffect(() => {
    if (!progressLoading && activeModule && !isModuleUnlocked(activeModule.id)) {
      alert('Access Denied: Please complete the preceding modules first.');
      onNavigate('#/');
    }
  }, [progressLoading, activeModule, isModuleUnlocked, onNavigate]);

  // 2. Fetch questions bank on mount/load
  useEffect(() => {
    async function loadQuestions() {
      if (!moduleId) return;
      setLoadingQuestions(true);
      try {
        const fetched = await sheetsService.getQuestions();
        // Filter questions belonging to this module
        const moduleQuestions = (fetched || []).filter(q => q.moduleId === moduleId);
        setQuestions(moduleQuestions);
      } catch (err) {
        console.error('Failed to retrieve question bank:', err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [moduleId]);

  if (progressLoading || loadingQuestions || !activeModule) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 bg-slate-950">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm font-medium">Loading lesson materials...</p>
      </div>
    );
  }

  // Get active progress record
  const progressRecord = userProgress[moduleId] || null;

  // ==========================================
  // MID-VIDEO CALLBACKS
  // ==========================================
  const handleTriggerMidQuestion = (question) => {
    setActiveMidQuestion(question);
  };

  const handleMidQuizClose = () => {
    setActiveMidQuestion(null);
  };

  // ==========================================
  // END-OF-VIDEO / DIRECT QUIZ CALLBACKS
  // ==========================================
  const handleOpenEndQuiz = () => {
    setShowEndQuiz(true);
  };

  const handleEndQuizClose = async (passed, scorePercent, answersMap) => {
    setShowEndQuiz(false);
    
    // Log attempt metrics to sheets
    try {
      // Find current attempt index or set first
      const storedProgress = userProgress[moduleId];
      const attemptNum = 1; // Simplify attempt numbers since GAS appends
      
      const payload = {
        googleId: user.googleId,
        moduleId: moduleId,
        attemptNumber: attemptNum,
        score: scorePercent,
        passed: passed,
        answers: JSON.stringify(answersMap)
      };

      await sheetsService.logQuizAttempt(payload);

      if (passed) {
        await completeModule(moduleId);
        onNavigate(`#/section/${activeModule.sectionId}`);
      }
    } catch (e) {
      console.error('Failed to log quiz attempt details:', e);
      alert('Error saving test results to Sheets. Progress might not have synced.');
    }
  };

  // Parse config properties
  const qLimit = Number(activeModule.questionsPerAttempt) || 5;
  const pThreshold = Number(activeModule.passThreshold) || 70;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header bar and navigation */}
      <div className="space-y-4">
        <button
          onClick={() => onNavigate(`#/section/${activeModule.sectionId}`)}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition space-x-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span>Back to Module List</span>
        </button>

        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{activeModule.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{activeModule.description}</p>
        </div>
      </div>

      {/* Embedded Player */}
      <div className="w-full">
        <VideoPlayer
          youtubeUrl={activeModule.youtubeUrl}
          moduleId={moduleId}
          questions={questions}
          savedProgress={progressRecord}
          saveWatchProgress={saveWatchProgress}
          onOpenQuiz={handleOpenEndQuiz}
          onTriggerMidQuestion={handleTriggerMidQuestion}
        />
      </div>

      {/* Mid-Video Modal popup */}
      {activeMidQuestion && (
        <QuizModal
          midVideoQuestion={activeMidQuestion}
          onClose={handleMidQuizClose}
        />
      )}

      {/* Main Assessment Modal overlay */}
      {showEndQuiz && (
        <QuizModal
          questions={questions}
          questionsPerAttempt={qLimit}
          passThreshold={pThreshold}
          onClose={handleEndQuizClose}
        />
      )}
    </div>
  );
}

export default ModulePage;
