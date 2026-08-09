import { useEffect } from 'react';

import { useLiveStore } from '../store/liveStore';
import { playHintSound } from '../utils/liveSounds';

interface UseKeyboardOptions {
  enabled: boolean;
  gameActionsEnabled?: boolean;
  hintEnabled?: boolean;
  optionRevealEnabled?: boolean;
  judgementEnabled?: boolean;
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
  gameActionsEnabled = true,
  hintEnabled = true,
  optionRevealEnabled = false,
  judgementEnabled = true,
  onExitRequest,
  onMarkCorrect,
  onMarkWrong,
}: UseKeyboardOptions): void {
  const jumpToContestant = useLiveStore((state) => state.jumpToContestant);
  const nextQuestion = useLiveStore((state) => state.nextQuestion);
  const previousQuestion = useLiveStore((state) => state.previousQuestion);
  const togglePause = useLiveStore((state) => state.togglePause);
  const revealNextHint = useLiveStore((state) => state.revealNextHint);
  const revealNextOption = useLiveStore((state) => state.revealNextOption);

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

      if (event.key === 'Escape') {
        event.preventDefault();
        onExitRequest();
        return;
      }

      if (!gameActionsEnabled) {
        event.preventDefault();
        return;
      }

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
      }

      if (
        (hintEnabled || optionRevealEnabled) &&
        (normalizedKey === 'h' || event.key === 'י')
      ) {
        event.preventDefault();
        if (optionRevealEnabled) {
          revealNextOption();
          return;
        }
        const previousHintCount =
          useLiveStore.getState().revealedHintsForCurrentQuestion;
        revealNextHint();
        const nextHintCount =
          useLiveStore.getState().revealedHintsForCurrentQuestion;
        if (nextHintCount > previousHintCount) playHintSound();
        return;
      }
      if (
        judgementEnabled &&
        (CORRECT_KEYS.has(normalizedKey) || CORRECT_KEYS.has(event.key))
      ) {
        event.preventDefault();
        onMarkCorrect();
        return;
      }
      if (
        judgementEnabled &&
        (WRONG_KEYS.has(normalizedKey) || WRONG_KEYS.has(event.key))
      ) {
        event.preventDefault();
        onMarkWrong();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    gameActionsEnabled,
    hintEnabled,
    optionRevealEnabled,
    judgementEnabled,
    jumpToContestant,
    nextQuestion,
    onExitRequest,
    onMarkCorrect,
    onMarkWrong,
    previousQuestion,
    revealNextHint,
    revealNextOption,
    togglePause,
  ]);
}
