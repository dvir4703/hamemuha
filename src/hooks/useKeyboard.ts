import { useEffect } from 'react';

import { selectCurrentQuestion, useLiveStore } from '../store/liveStore';
import { isSelectionQuestion } from '../utils/liveQuestion';
import { playHintSound } from '../utils/liveSounds';

interface UseKeyboardOptions {
  enabled: boolean;
  gameActionsEnabled?: boolean;
  onExitRequest: () => void;
}

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
  onExitRequest,
}: UseKeyboardOptions): void {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      )
        return;
      const key = ['F1', 'F2', 'F4'].includes(event.code)
        ? event.code
        : event.key;
      const handled =
        [
          'Enter',
          'F1',
          'F2',
          'F4',
          'Escape',
          'ArrowRight',
          'ArrowLeft',
          ' ',
          'Spacebar',
        ].includes(key) || /^[1-9]$/.test(key);
      if (!handled) return;
      // Capture before native button activation, including repeats and inactive contexts.
      event.preventDefault();
      if (event.repeat) return;
      if (key === 'Escape') {
        onExitRequest();
        return;
      }
      if (!gameActionsEnabled) return;
      // Read at the event boundary so one Enter cannot both submit and advance.
      const state = useLiveStore.getState();
      const question = selectCurrentQuestion(state);
      if (/^[1-9]$/.test(key)) {
        state.jumpToContestant(Number(key));
        return;
      }
      switch (key) {
        case 'ArrowRight':
          state.nextQuestion();
          return;
        case 'ArrowLeft':
          state.previousQuestion();
          return;
        case ' ':
        case 'Spacebar':
          state.togglePause();
          return;
        case 'Enter':
          if (state.gamePhase === 'showing_answer') state.nextQuestion();
          else if (
            state.gamePhase === 'playing' &&
            question &&
            isSelectionQuestion(question.question_type)
          )
            state.submitSelectedAnswer();
          return;
      }
      if (state.gamePhase !== 'playing' || !question) return;
      const isOral =
        question.question_type === 'complete_sentence' ||
        question.question_type === 'open_answer';
      if (key === 'F1' && isOral)
        state.submitAnswer(true, state.potentialPointsForCurrentQuestion);
      if (key === 'F2' && isOral) state.submitAnswer(false, 0);
      if (
        key === 'F4' &&
        ['multiple_choice', 'complete_sentence'].includes(
          question.question_type,
        )
      ) {
        state.revealNextHint();
        if (
          useLiveStore.getState().revealedHintsForCurrentQuestion >
          state.revealedHintsForCurrentQuestion
        )
          playHintSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, gameActionsEnabled, onExitRequest]);
}
