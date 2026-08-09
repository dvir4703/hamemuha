import { useEffect, useRef, useState } from 'react';

export const QUESTION_REVEAL_DURATION_MS = 8000;

interface QuestionRevealState {
  revealSequence: number;
  remainingMs: number;
  completed: boolean;
}

interface QuestionRevealResult {
  progress: number;
  hasCompleted: boolean;
}

function createRevealState(revealSequence: number): QuestionRevealState {
  return {
    revealSequence,
    remainingMs: QUESTION_REVEAL_DURATION_MS,
    completed: false,
  };
}

export function useQuestionReveal(
  revealSequence: number,
  active: boolean,
): QuestionRevealResult {
  const remainingRef = useRef(QUESTION_REVEAL_DURATION_MS);
  const [revealState, setRevealState] = useState(() =>
    createRevealState(revealSequence),
  );
  const isCurrentReveal = revealState.revealSequence === revealSequence;
  const currentCompleted = isCurrentReveal && revealState.completed;

  useEffect(() => {
    if (!active || currentCompleted) return;

    const startingRemainingMs = isCurrentReveal
      ? remainingRef.current
      : QUESTION_REVEAL_DURATION_MS;
    remainingRef.current = startingRemainingMs;
    const deadline = performance.now() + startingRemainingMs;
    let animationFrameId = 0;

    const updateRevealProgress = () => {
      const remainingMs = Math.max(0, deadline - performance.now());
      remainingRef.current = remainingMs;
      setRevealState({
        revealSequence,
        remainingMs,
        completed: remainingMs === 0,
      });
      if (remainingMs > 0) {
        animationFrameId = window.requestAnimationFrame(updateRevealProgress);
      }
    };

    animationFrameId = window.requestAnimationFrame(updateRevealProgress);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      remainingRef.current = Math.max(0, deadline - performance.now());
    };
  }, [active, currentCompleted, isCurrentReveal, revealSequence]);

  const remainingMs = isCurrentReveal
    ? revealState.remainingMs
    : QUESTION_REVEAL_DURATION_MS;

  return {
    progress: Math.min(
      1,
      Math.max(0, 1 - remainingMs / QUESTION_REVEAL_DURATION_MS),
    ),
    hasCompleted: isCurrentReveal && revealState.completed,
  };
}
