import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useQuizEngine from '../../hooks/useQuizEngine';

describe('useQuizEngine Assessment Hook', () => {
  const mockQuestionBank = [
    { id: 'q1', stem: 'Stem 1', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'A', triggerType: 'end' },
    { id: 'q2', stem: 'Stem 2', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'B', triggerType: 'end' },
    { id: 'q3', stem: 'Stem 3', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'C', triggerType: 'end' },
    { id: 'q4', stem: 'Stem 4', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'D', triggerType: 'end' },
    { id: 'q5', stem: 'Stem 5', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'A', triggerType: 'end' },
    { id: 'q_mid', stem: 'Mid Stem', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctOption: 'A', triggerType: 'mid' }
  ];

  test('filters out mid-video questions from the end-of-video quiz pool', () => {
    const { result } = renderHook(() => useQuizEngine(mockQuestionBank, 5, 70));
    
    // Verifies the mid-video question is not drawn
    const hasMid = result.current.activeQuestions.some(q => q.id === 'q_mid');
    expect(hasMid).toBe(false);
  });

  test('shuffles and slices question bank up to the limit', () => {
    const { result } = renderHook(() => useQuizEngine(mockQuestionBank, 3, 70));
    
    expect(result.current.activeQuestions.length).toBe(3);
  });

  test('calculates correct scoring and passes if above threshold', () => {
    const { result } = renderHook(() => useQuizEngine(mockQuestionBank, 5, 60));

    const questions = result.current.activeQuestions;

    act(() => {
      // Answer 4 out of 5 correctly (80% score)
      result.current.selectAnswer(questions[0].id, questions[0].correctOption);
      result.current.selectAnswer(questions[1].id, questions[1].correctOption);
      result.current.selectAnswer(questions[2].id, questions[2].correctOption);
      result.current.selectAnswer(questions[3].id, questions[3].correctOption);
      result.current.selectAnswer(questions[4].id, 'wrong-answer'); // Incorrect
    });

    act(() => {
      result.current.submitQuiz();
    });

    expect(result.current.isSubmitted).toBe(true);
    expect(result.current.score).toBe(80);
    expect(result.current.passed).toBe(true);
  });

  test('fails if score is below threshold', () => {
    const { result } = renderHook(() => useQuizEngine(mockQuestionBank, 5, 70));

    const questions = result.current.activeQuestions;

    act(() => {
      // Answer 2 out of 5 correctly (40% score)
      result.current.selectAnswer(questions[0].id, questions[0].correctOption);
      result.current.selectAnswer(questions[1].id, questions[1].correctOption);
      result.current.selectAnswer(questions[2].id, 'wrong-1');
      result.current.selectAnswer(questions[3].id, 'wrong-2');
      result.current.selectAnswer(questions[4].id, 'wrong-3');
    });

    act(() => {
      result.current.submitQuiz();
    });

    expect(result.current.isSubmitted).toBe(true);
    expect(result.current.score).toBe(40);
    expect(result.current.passed).toBe(false);
  });
});
