import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatContestantTime } from '../../utils/timeLimit';

interface QuestionTimerProps {
  remainingSeconds: number;
  progress: number;
  paused: boolean;
  expired: boolean;
  scope?: 'question' | 'contestant';
}

type TimerStyle = CSSProperties & { '--timer-progress': string };

export function QuestionTimer({
  remainingSeconds,
  progress,
  paused,
  expired,
  scope = 'question',
}: QuestionTimerProps) {
  const shouldReduceMotion = useReducedMotion();
  const timerStyle: TimerStyle = {
    '--timer-progress': `${Math.round(progress * 360)}deg`,
  };

  return (
    <motion.aside
      role="timer"
      aria-live="off"
      aria-label={`${scope === 'contestant' ? 'זמן כולל למתמודד: ' : ''}${remainingSeconds} שניות נותרו${paused ? ', הטיימר מושהה' : ''}`}
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              x: scope === 'contestant' ? '-50%' : 0,
              y: -14,
              scale: 0.78,
              rotate: -7,
            }
      }
      animate={{
        opacity: 1,
        x: scope === 'contestant' ? '-50%' : 0,
        y: 0,
        scale: 1,
        rotate: 0,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 17, mass: 0.7 }}
      className="live-question-timer"
      data-scope={scope}
      data-paused={paused}
      data-expired={expired}
      data-urgent={!expired && remainingSeconds <= 5}
    >
      <span className="live-question-timer__dial" style={timerStyle}>
        <span className="live-question-timer__face">
          <strong dir="ltr">
            {scope === 'contestant'
              ? formatContestantTime(remainingSeconds)
              : remainingSeconds}
          </strong>
        </span>
      </span>
    </motion.aside>
  );
}
