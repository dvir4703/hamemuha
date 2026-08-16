import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface QuestionTimerProps {
  remainingSeconds: number;
  progress: number;
  paused: boolean;
  expired: boolean;
}

type TimerStyle = CSSProperties & { '--timer-progress': string };

export function QuestionTimer({
  remainingSeconds,
  progress,
  paused,
  expired,
}: QuestionTimerProps) {
  const shouldReduceMotion = useReducedMotion();
  const timerStyle: TimerStyle = {
    '--timer-progress': `${Math.round(progress * 360)}deg`,
  };

  return (
    <motion.aside
      role="timer"
      aria-live="off"
      aria-label={`${remainingSeconds} שניות נותרו${paused ? ', הטיימר מושהה' : ''}`}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, x: '-50%', y: 24, scale: 0.78, rotate: -7 }
      }
      animate={{ opacity: 1, x: '-50%', y: 0, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 17, mass: 0.7 }}
      className="live-question-timer"
      data-paused={paused}
      data-expired={expired}
      data-urgent={!expired && remainingSeconds <= 5}
    >
      <span className="live-question-timer__dial" style={timerStyle}>
        <span className="live-question-timer__face">
          <strong>{remainingSeconds}</strong>
        </span>
      </span>
    </motion.aside>
  );
}
