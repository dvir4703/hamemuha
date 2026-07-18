import { useEffect } from 'react';

import { useLiveStore } from '../store/liveStore';

interface UseKeyboardOptions {
  enabled: boolean;
  onExitRequest: () => void;
  onMarkCorrect: () => void;
  onMarkWrong: () => void;
}

const CORRECT_KEYS = new Set(['כ', 'f', 'v']);
const WRONG_KEYS = new Set(['ל', 'k', 'l']);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function useKeyboard({
  enabled,
  onExitRequest,
  onMarkCorrect,
  onMarkWrong,
}: UseKeyboardOptions): void {
  const jumpToContestant = useLiveStore((state) => state.jumpToContestant);
  const nextQuestion = useLiveStore((state) => state.nextQuestion);
  const previousQuestion = useLiveStore((state) => state.previousQuestion);
  const togglePause = useLiveStore((state) => state.togglePause);
  const revealNextHint = useLiveStore((state) => state.revealNextHint);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const normalizedKey = event.key.toLowerCase();

      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        jumpToContestant(Number(event.key));
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          nextQuestion();
          return;
        case 'ArrowLeft':
          event.preventDefault();
          previousQuestion();
          return;
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          togglePause();
          return;
        case 'Escape':
          event.preventDefault();
          onExitRequest();
          return;
      }

      if (normalizedKey === 'h' || event.key === 'י') {
        event.preventDefault();
        revealNextHint();
        return;
      }
      if (CORRECT_KEYS.has(normalizedKey) || CORRECT_KEYS.has(event.key)) {
        event.preventDefault();
        onMarkCorrect();
        return;
      }
      if (WRONG_KEYS.has(normalizedKey) || WRONG_KEYS.has(event.key)) {
        event.preventDefault();
        onMarkWrong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    jumpToContestant,
    nextQuestion,
    onExitRequest,
    onMarkCorrect,
    onMarkWrong,
    previousQuestion,
    revealNextHint,
    togglePause,
  ]);
}
