import React, { useState } from 'react';
import useQuizEngine from '../../hooks/useQuizEngine';
import QuestionCard from './QuestionCard';
import ResultScreen from './ResultScreen';

/**
 * QuizModal component hosting mid-video single MCQ checks or final randomized tests.
 * 
 * @param {Object} props
 * @param {Array} props.questions - All questions for this module
 * @param {number} props.questionsPerAttempt - Random selection size
 * @param {number} props.passThreshold - Minimum passing percentage (default 70)
 * @param {Object} props.midVideoQuestion - The mid-video question (if this is a mid-video trigger)
 * @param {Function} props.onClose - Callback triggered on close/submit.
 *                     Params: (passed, scorePercent, answersMap)
 */
export function QuizModal({ questions = [], questionsPerAttempt = 5, passThreshold = 70, midVideoQuestion = null, onClose }) {
  const isMidVideo = !!midVideoQuestion;

  // Mid-video state machine in-line (only 1 question)
  const [midSelected, setMidSelected] = useState('');
  const [midSubmitted, setMidSubmitted] = useState(false);

  // End-of-video quiz engine hooks
  const {
    activeQuestions,
    currentQuestionIndex,
    selectedAnswers,
    isSubmitted,
    score,
    passed,
    setCurrentQuestionIndex,
    selectAnswer,
    submitQuiz,
    resetQuiz
  } = useQuizEngine(questions, questionsPerAttempt, passThreshold);

  // ==========================================
  // MID-VIDEO SUBMISSION HANDLER
  // ==========================================
  const handleMidSubmit = () => {
    if (!midSelected) return;
    setMidSubmitted(true);
  };

  const handleMidClose = () => {
    const isCorrect = midSelected === midVideoQuestion.correctOption;
    // Log mid-video attempt locally, close modal and resume
    onClose(isCorrect, isCorrect ? 100 : 0, { [midVideoQuestion.id]: midSelected });
  };

  // ==========================================
  // END-OF-VIDEO CLOSE/COMPLETE HANDLER
  // ==========================================
  const handleEndClose = () => {
    onClose(passed, score, selectedAnswers);
  };

  // Render content based on quiz mode
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Background mesh decoration */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>

        {isMidVideo ? (
          // ==========================================
          // MID-VIDEO RENDER
          // ==========================================
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3.5 1.732 3z"></path>
              </svg>
              <span>Mid-Video Checkpoint</span>
            </div>

            <QuestionCard
              question={midVideoQuestion}
              selectedOption={midSelected}
              onSelectOption={(qId, opt) => setMidSelected(opt)}
              isSubmitted={midSubmitted}
            />

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              {!midSubmitted ? (
                <button
                  disabled={!midSelected}
                  onClick={handleMidSubmit}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs transition"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleMidClose}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Continue Video
                </button>
              )}
            </div>
          </div>
        ) : (
          // ==========================================
          // END-OF-VIDEO / DIRECT QUIZ RENDER
          // ==========================================
          <div>
            {!isSubmitted ? (
              // Quiz Question Stepper View
              <div className="space-y-6">
                {/* Stepper Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="space-y-1 text-left">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Module Assessment
                    </span>
                    <h4 className="text-sm font-extrabold text-white">
                      Question {currentQuestionIndex + 1} of {activeQuestions.length}
                    </h4>
                  </div>
                  {/* Progress Bubble */}
                  <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                    {Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}%
                  </span>
                </div>

                {/* Card rendering active question */}
                <div className="py-2">
                  <QuestionCard
                    question={activeQuestions[currentQuestionIndex]}
                    selectedOption={selectedAnswers[activeQuestions[currentQuestionIndex]?.id]}
                    onSelectOption={selectAnswer}
                    isSubmitted={false}
                  />
                </div>

                {/* Navigation Steppers */}
                <div className="flex space-x-3 pt-4 border-t border-slate-800">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed text-slate-400 hover:text-white transition font-semibold text-xs"
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < activeQuestions.length - 1 ? (
                    <button
                      disabled={!selectedAnswers[activeQuestions[currentQuestionIndex]?.id]}
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs transition"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      disabled={!selectedAnswers[activeQuestions[currentQuestionIndex]?.id]}
                      onClick={submitQuiz}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-lg shadow-indigo-600/25"
                    >
                      Submit Assessment
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Quiz Scoring & Results Review Screen
              <ResultScreen
                score={score}
                passed={passed}
                threshold={passThreshold}
                questions={activeQuestions}
                selectedAnswers={selectedAnswers}
                onRetry={resetQuiz}
                onClose={handleEndClose}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizModal;
