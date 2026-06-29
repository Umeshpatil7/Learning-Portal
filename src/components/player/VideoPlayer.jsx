import React, { useState, useEffect, useRef } from 'react';
import useYouTubePlayer from '../../hooks/useYouTubePlayer';
import useWatchTracker from '../../hooks/useWatchTracker';

/**
 * Helper to format duration in seconds into MM:SS format.
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Premium VideoPlayer component housing the YouTube iframe and playback gates.
 * 
 * @param {Object} props
 * @param {string} props.youtubeUrl - Full YouTube URL
 * @param {string} props.moduleId - Active module ID
 * @param {Array} props.questions - All questions for this module
 * @param {Object} props.savedProgress - User progress object from context
 * @param {Function} props.saveWatchProgress - Progress update function from context
 * @param {Function} props.onOpenQuiz - Triggered when user opens final quiz
 * @param {Function} props.onTriggerMidQuestion - Callback when mid-video question is reached
 */
export function VideoPlayer({ 
  youtubeUrl, 
  moduleId, 
  questions = [],
  savedProgress, 
  saveWatchProgress, 
  onOpenQuiz,
  onTriggerMidQuestion 
}) {
  const getVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const videoId = getVideoId(youtubeUrl);
  const initialPosition = savedProgress?.lastPosition || 0;

  // Initialize player hooks
  const {
    containerRef,
    isReady,
    playerState,
    currentTime,
    duration,
    maxWatchedTime,
    seekTo,
    pause
  } = useYouTubePlayer(videoId, initialPosition);

  // Sync background progress
  useWatchTracker(moduleId, maxWatchedTime, duration, playerState, saveWatchProgress);

  // Local state for the Resume Playback modal prompt
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasUserChosenResume, setHasUserChosenResume] = useState(false);
  
  // Track already triggered mid-video question IDs in this viewing session
  const triggeredMidIds = useRef(new Set());

  // Trigger Resume Prompt if there is a saved position > 2 seconds
  useEffect(() => {
    if (isReady && initialPosition > 2 && !hasUserChosenResume) {
      pause();
      setShowResumePrompt(true);
    }
  }, [isReady, initialPosition, hasUserChosenResume, pause]);

  // Trigger quiz automatically when video ends (state === 0 is ended)
  useEffect(() => {
    if (playerState === 0) {
      onOpenQuiz();
    }
  }, [playerState, onOpenQuiz]);

  // Listen to currentTime updates to trigger mid-video questions
  useEffect(() => {
    if (playerState !== 1) return; // Only trigger while playing

    const midQuestions = questions.filter(q => q.triggerType === 'mid');
    
    for (const q of midQuestions) {
      const triggerSec = Number(q.triggerTimestamp);
      
      // If we hit the timestamp window (within 1 second) and haven't triggered it yet
      if (
        Math.abs(currentTime - triggerSec) <= 1.0 && 
        !triggeredMidIds.current.has(q.id)
      ) {
        pause();
        triggeredMidIds.current.add(q.id);
        onTriggerMidQuestion(q);
        break; // Trigger one at a time
      }
    }
  }, [currentTime, playerState, questions, pause, onTriggerMidQuestion]);

  const handleResumeChoice = (resume) => {
    setShowResumePrompt(false);
    setHasUserChosenResume(true);
    if (resume) {
      seekTo(initialPosition, true); // Force seek past locks
    } else {
      seekTo(0, true);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Video Container Shell */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <div className="w-full h-full" ref={containerRef}></div>

        {!isReady && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/80 z-20">
            <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
            <p className="mt-3 text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">
              Buffering video stream...
            </p>
          </div>
        )}

        {showResumePrompt && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-5 animate-scale-in">
              <div className="inline-flex p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Resume watching?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You previously watched this lesson up to <span className="font-mono text-indigo-300 font-semibold">{formatTime(initialPosition)}</span>.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleResumeChoice(false)}
                  className="flex-1 py-2 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition font-semibold text-xs"
                >
                  Start Over
                </button>
                <button
                  onClick={() => handleResumeChoice(true)}
                  className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition font-semibold text-xs shadow-lg shadow-indigo-600/25"
                >
                  Yes, Resume
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Utility Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="font-mono text-slate-200">{formatTime(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>

        <button
          onClick={() => {
            pause();
            onOpenQuiz();
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Attempt Quiz Directly</span>
        </button>
      </div>
    </div>
  );
}

export default VideoPlayer;
