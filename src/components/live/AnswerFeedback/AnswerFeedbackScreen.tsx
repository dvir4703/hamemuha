import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

import correctSoundUrl from '../../../assets/sounds/correct.mp3?url';
import wrongSoundUrl from '../../../assets/sounds/wrong.mp3?url';
import { useLiveStore, type LastAnswerResult } from '../../../store/liveStore';
import '../../../styles/live-results.css';
import type { QuestionWithRelations } from '../../../types';
import { CorrectAnswerScreen } from './CorrectAnswerScreen';
import { WrongAnswerScreen } from './WrongAnswerScreen';

export const CORRECT_FEEDBACK_AUTO_ADVANCE_MS = 5600;

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
    const confettiTimers: number[] = [];

    const activationTimer = window.setTimeout(() => {
      if (handledSubmissions.has(result.submissionId)) return;
      handledSubmissions.add(result.submissionId);

      sound = new Howl({
        src: [result.isCorrect ? correctSoundUrl : wrongSoundUrl],
        volume: result.isCorrect ? 0.68 : 0.62,
        preload: true,
        pool: 1,
        onloaderror: () => undefined,
        onplayerror: () => undefined,
      });
      sound.play();

      if (
        result.isCorrect &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const colors = ['#f4b942', '#ffe08a', '#f6f7ff', '#1b1c4d'];
        fireConfetti({
          particleCount: 88,
          spread: 96,
          startVelocity: 38,
          gravity: 0.82,
          scalar: 0.92,
          origin: { x: 0.5, y: 0.28 },
          colors,
          disableForReducedMotion: true,
        });

        confettiTimers.push(
          window.setTimeout(() => {
            fireConfetti({
              particleCount: 54,
              angle: 58,
              spread: 62,
              startVelocity: 52,
              gravity: 0.88,
              scalar: 0.9,
              origin: { x: 0.04, y: 0.7 },
              colors,
              disableForReducedMotion: true,
            });
            fireConfetti({
              particleCount: 54,
              angle: 122,
              spread: 62,
              startVelocity: 52,
              gravity: 0.88,
              scalar: 0.9,
              origin: { x: 0.96, y: 0.7 },
              colors,
              disableForReducedMotion: true,
            });
          }, 230),
        );

        confettiTimers.push(
          window.setTimeout(() => {
            fireConfetti({
              particleCount: 58,
              spread: 124,
              startVelocity: 27,
              gravity: 0.72,
              scalar: 0.64,
              drift: 0.15,
              ticks: 190,
              origin: { x: 0.5, y: 0.2 },
              colors,
              disableForReducedMotion: true,
            });
          }, 620),
        );

        confettiTimers.push(
          window.setTimeout(() => {
            fireConfetti({
              particleCount: 34,
              spread: 74,
              startVelocity: 20,
              gravity: 0.68,
              scalar: 0.52,
              ticks: 160,
              origin: { x: 0.28, y: 0.36 },
              colors,
              disableForReducedMotion: true,
            });
            fireConfetti({
              particleCount: 34,
              spread: 74,
              startVelocity: 20,
              gravity: 0.68,
              scalar: 0.52,
              ticks: 160,
              origin: { x: 0.72, y: 0.36 },
              colors,
              disableForReducedMotion: true,
            });
          }, 920),
        );
      }
    }, 0);

    return () => {
      window.clearTimeout(activationTimer);
      confettiTimers.forEach((timer) => window.clearTimeout(timer));
      sound?.stop();
      sound?.unload();
    };
  }, [result.isCorrect, result.submissionId]);

  useEffect(() => {
    if (!result.isCorrect || paused) return;
    const autoAdvanceTimer = window.setTimeout(
      nextQuestion,
      CORRECT_FEEDBACK_AUTO_ADVANCE_MS,
    );
    return () => window.clearTimeout(autoAdvanceTimer);
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
