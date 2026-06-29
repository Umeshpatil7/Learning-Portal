import { useState, useEffect, useCallback } from 'react';

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array - Target array
 * @returns {Array} Shuffled array
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Custom hook managing MCQ quiz mechanics.
 * Handles question randomisation from bank, scoring, and pass/fail states.
 * 
 * @param {Array} questionBank - Complete pool of questions for the module
 * @param {number} questionsPerAttempt - Number of questions to serve (default 5)
 * @param {number} passThreshold - Passing score threshold percentage (default 70)
 * @returns {Object} Quiz state variables and handlers
 */
export function useQuizEngine(questionBank = [], questionsPerAttempt = 5, passThreshold = 70) {
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // map of questionId -> option letter ('A', 'B', etc)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  // Initialize and randomize questions on load or reset
  const initializeQuiz = useCallback(() => {
    // Filter questions appropriate for end-of-video quiz (exclude mid-video triggers)
    const endQuestions = questionBank.filter(q => q.triggerType !== 'mid');
    
    // Shuffle the bank and slice N questions
    const shuffled = shuffle(endQuestions);
    const selected = shuffled.slice(0, Math.min(shuffled.length, questionsPerAttempt));
    
    setActiveQuestions(selected);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setPassed(false);
  }, [questionBank, questionsPerAttempt]);

  // Load quiz on mount
  useEffect(() => {
    if (questionBank && questionBank.length > 0) {
      initializeQuiz();
    }
  }, [questionBank, initializeQuiz]);

  /**
   * Records a user's answer selection.
   */
  const selectAnswer = (questionId, option) => {
    if (isSubmitted) return; // Block changes after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  /**
   * Submits the answers and calculates score percentage.
   */
  const submitQuiz = () => {
    if (activeQuestions.length === 0 || isSubmitted) return;

    let correctCount = 0;
    activeQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOption) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / activeQuestions.length) * 100);
    const isPass = finalScore >= passThreshold;

    setScore(finalScore);
    setPassed(isPass);
    setIsSubmitted(true);

    return {
      score: finalScore,
      passed: isPass,
      answers: selectedAnswers
    };
  };

  return {
    activeQuestions,
    currentQuestionIndex,
    selectedAnswers,
    isSubmitted,
    score,
    passed,
    setCurrentQuestionIndex,
    selectAnswer,
    submitQuiz,
    resetQuiz: initializeQuiz
  };
}

export default useQuizEngine;
