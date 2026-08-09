import { useEffect, useState } from 'react';
import { Award, Sparkles, Star } from 'lucide-react';
import { animate, motion, useReducedMotion } from 'framer-motion';

import type { QuestionWithRelations } from '../../../types';

interface CorrectAnswerScreenProps {
  question: QuestionWithRelations;
  pointsAwarded: number;
  autoAdvanceMs: number;
  paused: boolean;
}

function AnimatedPoints({ points }: { points: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [displayedPoints, setDisplayedPoints] = useState(
    shouldReduceMotion ? points : 0,
  );

  useEffect(() => {
    if (shouldReduceMotion) {
      const frame = window.requestAnimationFrame(() =>
        setDisplayedPoints(points),
      );
      return () => window.cancelAnimationFrame(frame);
    }

    const controls = animate(0, points, {
      delay: 0.55,
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplayedPoints(Math.round(value)),
    });

    return () => controls.stop();
  }, [points, shouldReduceMotion]);

  return (
    <strong className="live-feedback__points-value" aria-hidden="true">
      +{displayedPoints}
    </strong>
  );
}

export function CorrectAnswerScreen({
  question,
  pointsAwarded,
  autoAdvanceMs,
  paused,
}: CorrectAnswerScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="live-feedback live-feedback--correct"
      data-answer-feedback="correct"
      aria-live="assertive"
    >
      <div className="live-feedback__celebration-field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, scale: 0.42, rotate: -18, y: 34 }
        }
        animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 18,
          mass: 1.05,
        }}
        className="live-feedback__victory-seal"
        aria-hidden="true"
      >
        <span className="live-feedback__victory-rays" />
        <span className="live-feedback__victory-medal">
          <Award size={62} strokeWidth={1.7} />
          <Star
            className="live-feedback__victory-star"
            size={27}
            fill="currentColor"
          />
        </span>
      </motion.div>

      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, y: 42, scale: 0.7, filter: 'blur(12px)' }
        }
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{
          delay: shouldReduceMotion ? 0 : 0.28,
          type: 'spring',
          stiffness: 155,
          damping: 20,
        }}
        className="live-feedback__headline"
      >
        <h3>תשובה נכונה!</h3>
      </motion.div>

      <motion.div
        initial={
          shouldReduceMotion ? false : { opacity: 0, y: 30, scale: 0.76 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: shouldReduceMotion ? 0 : 0.55,
          type: 'spring',
          stiffness: 165,
          damping: 19,
        }}
        className="live-feedback__points"
        aria-label={`קיבלתם ${pointsAwarded} נקודות`}
      >
        <span className="live-feedback__points-label">נוספו לניקוד</span>
        <AnimatedPoints points={pointsAwarded} />
        <span className="live-feedback__points-unit">נקודות</span>
      </motion.div>

      {question.explanation ? (
        <motion.article
          initial={
            shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.95,
            duration: 0.58,
            ease: [0.22, 0.82, 0.24, 1],
          }}
          className="live-feedback__explanation"
        >
          <div className="live-feedback__explanation-mark" aria-hidden="true">
            <Sparkles size={25} />
          </div>
          <div>
            <span>למה זה נכון?</span>
            <p>{question.explanation}</p>
          </div>
        </motion.article>
      ) : null}

      <div className="live-feedback__advance">
        {!paused ? (
          <div className="live-feedback__progress" aria-hidden="true">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: autoAdvanceMs / 1000, ease: 'linear' }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
