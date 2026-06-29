import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

/**
 * ResultScreen component displayed upon end-of-video quiz completion.
 * Displays score details, confetti animations on pass, and question reviews.
 * 
 * @param {Object} props
 * @param {number} props.score - Percentage score achieved (0 - 100)
 * @param {boolean} props.passed - True if score matches or exceeds threshold
 * @param {number} props.threshold - Passing score threshold percentage
 * @param {Array} props.questions - Randomized list of questions presented
 * @param {Object} props.selectedAnswers - Answers submitted by user
 * @param {Function} props.onRetry - Triggers a quiz reset
 * @param {Function} props.onClose - Triggers modal close and completes module
 */
export function ResultScreen({ score, passed, threshold, questions = [], selectedAnswers = {}, onRetry, onClose }) {
  
  // Trigger success confetti when quiz is passed
  useEffect(() => {
    if (passed) {
      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#3b82f6']
      });
    }
  }, [passed]);

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Visual Header Result */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-950 border border-slate-800 mb-2">
          {passed ? (
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            {passed ? 'Assessment Passed!' : 'Assessment Failed'}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            {passed 
              ? 'Congratulations! You met the passing requirements for this training lesson.'
              : `You scored ${score}%. A passing score of ${threshold}% or higher is required.`}
          </p>
        </div>

        {/* Big Score Display */}
        <div className="inline-block py-3 px-6 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-3xl font-bold">
          <span className={passed ? 'text-emerald-400' : 'text-red-400'}>{score}%</span>
          <span className="text-slate-600 text-lg ml-1">/ {threshold}%</span>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
          Review Quiz Answers
        </h4>
        
        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {questions.map((q, idx) => {
            const chosen = selectedAnswers[q.id];
            const isCorrect = chosen === q.correctOption;

            return (
              <div key={q.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col space-y-2 text-left">
                <div className="flex items-start justify-between space-x-2">
                  <div className="text-xs font-semibold text-white leading-normal">
                    <span className="text-slate-500 mr-1.5 font-bold">{idx + 1}.</span>
                    {q.stem}
                  </div>
                  {isCorrect ? (
                    <span className="flex-shrink-0 text-emerald-500 font-bold text-xs uppercase tracking-wide">Correct</span>
                  ) : (
                    <span className="flex-shrink-0 text-red-500 font-bold text-xs uppercase tracking-wide">Incorrect</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  <div className="flex space-x-2">
                    <span className="text-slate-500">Your Answer:</span>
                    <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                      Option {chosen || 'None'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="flex space-x-2 mt-0.5">
                      <span className="text-slate-500">Correct Answer:</span>
                      <span className="text-emerald-400">Option {q.correctOption}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions buttons */}
      <div className="flex space-x-3 pt-4 border-t border-slate-800">
        {!passed && (
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition font-bold text-xs"
          >
            Retry Quiz
          </button>
        )}
        <button
          onClick={onClose}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition shadow-lg ${
            passed 
              ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/20' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {passed ? 'Continue' : 'Close'}
        </button>
      </div>
    </div>
  );
}

export default ResultScreen;
