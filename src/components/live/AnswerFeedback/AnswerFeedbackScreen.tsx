import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

import correctSoundUrl from '../../../assets/sounds/correct.mp3?url';
import wrongSoundUrl from '../../../assets/sounds/wrong.mp3?url';
import { useLiveStore, type LastAnswerResult } from '../../../store/liveStore';
import type { QuestionWithRelations } from '../../../types';
import { CorrectAnswerScreen } from './CorrectAnswerScreen';
import { WrongAnswerScreen } from './WrongAnswerScreen';

// TODO: replace correct.mp3 and wrong.mp3 with real sound files.
export const CORRECT_FEEDBACK_AUTO_ADVANCE_MS = 3600;

const handledSubmissions = new Set<number>();
const fireConfetti = confetti.create(undefined, {
  resize: true,
  useWorker: false,
  disableForReducedMotion: true,
});

interface AnswerFeedbackScreenProps {
  question: QuestionWithRelations;
  result: LastAnswerResult;
  paused?: boolean;
}

export function AnswerFeedbackScreen({
  question,
  result,
  paused = false,
}: AnswerFeedbackScreenProps) {
  const nextQuestion = useLiveStore((state) => state.nextQuestion);

  useEffect(() => {
    let sound: Howl | null = null;
    let secondConfettiTimer: number | undefined;

    const activationTimer = window.setTimeout(() => {
      if (handledSubmissions.has(result.submissionId)) return;
      handledSubmissions.add(result.submissionId);

      sound = new Howl({
        src: [result.isCorrect ? correctSoundUrl : wrongSoundUrl],
        volume: result.isCorrect ? 0.42 : 0.28,
        html5: true,
        onloaderror: () => undefined,
        onplayerror: () => undefined,
      });
      sound.play();

      if (
        result.isCorrect &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const colors = ['#9fe1d4', '#f2b84b', '#7771c7', '#287d78'];
        fireConfetti({
          particleCount: 46,
          spread: 62,
          startVelocity: 28,
          gravity: 0.85,
          scalar: 0.86,
          origin: { x: 0.5, y: 0.38 },
          colors,
          disableForReducedMotion: true,
        });
        secondConfettiTimer = window.setTimeout(() => {
          fireConfetti({
            particleCount: 28,
            spread: 78,
            startVelocity: 22,
            gravity: 0.9,
            scalar: 0.78,
            origin: { x: 0.5, y: 0.34 },
            colors,
            disableForReducedMotion: true,
          });
        }, 420);
      }
    }, 0);

    const autoAdvanceTimer =
      result.isCorrect && !paused
        ? window.setTimeout(nextQuestion, CORRECT_FEEDBACK_AUTO_ADVANCE_MS)
        : undefined;

    return () => {
      window.clearTimeout(activationTimer);
      if (secondConfettiTimer !== undefined) {
        window.clearTimeout(secondConfettiTimer);
      }
      if (autoAdvanceTimer !== undefined) {
        window.clearTimeout(autoAdvanceTimer);
      }
      sound?.stop();
      sound?.unload();
    };
  }, [nextQuestion, paused, result.isCorrect, result.submissionId]);

  return result.isCorrect ? (
    <CorrectAnswerScreen
      question={question}
      pointsAwarded={result.pointsAwarded}
      autoAdvanceMs={CORRECT_FEEDBACK_AUTO_ADVANCE_MS}
      paused={paused}
    />
  ) : (
    <WrongAnswerScreen question={question} />
  );
}
