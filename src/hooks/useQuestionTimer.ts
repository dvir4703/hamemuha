import { useEffect, useRef, useState } from 'react';

interface QuestionTimerState {
  questionId: number | null;
  questionEntrySequence: number;
  timeLimitMs: number | null;
  remainingMs: number;
  expired: boolean;
}

interface QuestionTimerResult {
  remainingSeconds: number | null;
  progress: number;
  hasExpired: boolean;
}

function toTimeLimitMs(timeLimitSeconds: number | null): number | null {
  if (timeLimitSeconds === null) return null;
  return Math.max(0, Math.trunc(timeLimitSeconds * 1000));
}

function createTimerState(
  questionId: number | null,
  questionEntrySequence: number,
  timeLimitMs: number | null,
): QuestionTimerState {
  return {
    questionId,
    questionEntrySequence,
    timeLimitMs,
    remainingMs: timeLimitMs ?? 0,
    expired: false,
  };
}

export function useQuestionTimer(
  questionId: number | null,
  timeLimitSeconds: number | null,
  active: boolean,
  questionEntrySequence: number,
): QuestionTimerResult {
  const timeLimitMs = toTimeLimitMs(timeLimitSeconds);
  const remainingRef = useRef(timeLimitMs ?? 0);
  const [timerState, setTimerState] = useState(() =>
    createTimerState(questionId, questionEntrySequence, timeLimitMs),
  );
  const isCurrentTimer =
    timerState.questionId === questionId &&
    timerState.questionEntrySequence === questionEntrySequence &&
    timerState.timeLimitMs === timeLimitMs;
  const currentExpired = isCurrentTimer ? timerState.expired : false;

  useEffect(() => {
    if (!active || timeLimitMs === null || currentExpired) {
      return;
    }

    const startingRemainingMs = isCurrentTimer
      ? remainingRef.current
      : timeLimitMs;
    remainingRef.current = startingRemainingMs;
    const deadline = Date.now() + startingRemainingMs;
    let intervalId: number | undefined;
    const updateRemainingTime = () => {
      const remainingMs = Math.max(0, deadline - Date.now());
      remainingRef.current = remainingMs;
      setTimerState((current) => {
        if (
          current.questionId !== questionId ||
          current.questionEntrySequence !== questionEntrySequence ||
          current.timeLimitMs !== timeLimitMs
        ) {
          return {
            questionId,
            questionEntrySequence,
            timeLimitMs,
            remainingMs,
            expired: remainingMs === 0,
          };
        }
        return {
          ...current,
          remainingMs,
          expired: remainingMs === 0,
        };
      });
      if (remainingMs === 0 && intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      return remainingMs;
    };

    const initialTickId = window.setTimeout(updateRemainingTime, 0);
    if (startingRemainingMs > 0) {
      intervalId = window.setInterval(updateRemainingTime, 100);
    }

    return () => {
      window.clearTimeout(initialTickId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
      remainingRef.current = Math.max(0, deadline - Date.now());
    };
  }, [
    active,
    currentExpired,
    isCurrentTimer,
    questionEntrySequence,
    questionId,
    timeLimitMs,
  ]);

  const remainingMs = isCurrentTimer
    ? timerState.remainingMs
    : (timeLimitMs ?? 0);

  return {
    remainingSeconds:
      timeLimitMs === null ? null : Math.ceil(remainingMs / 1000),
    progress:
      timeLimitMs && timeLimitMs > 0
        ? Math.min(1, Math.max(0, remainingMs / timeLimitMs))
        : 0,
    hasExpired: isCurrentTimer && timerState.expired,
  };
}
