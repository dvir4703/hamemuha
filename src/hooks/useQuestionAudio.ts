import { useEffect } from 'react';

import {
  playQuestionLoopSound,
  stopQuestionLoopSound,
} from '../utils/liveSounds';

export function useQuestionAudio(
  questionId: number | null,
  timeLimitSeconds: number | null,
  active: boolean,
  questionEntrySequence: number,
): void {
  useEffect(() => {
    stopQuestionLoopSound();
    if (!active || questionId === null) return;

    playQuestionLoopSound(
      timeLimitSeconds === null ? 'background' : 'countdown',
    );
    return stopQuestionLoopSound;
  }, [active, questionId, questionEntrySequence, timeLimitSeconds]);
}
