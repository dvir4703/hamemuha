import { motion, useReducedMotion } from 'framer-motion';

import { useImageUrl } from '../../../hooks/useImageUrl';

interface LiveQuestionHeaderProps {
  headingId: string;
  imagePath: string | null;
  title: string;
  variant?: 'default' | 'cinematic';
}

export function LiveQuestionHeader({
  headingId,
  imagePath,
  title,
  variant = 'default',
}: LiveQuestionHeaderProps) {
  const imageUrl = useImageUrl(imagePath);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.44, ease: [0.22, 0.82, 0.24, 1] }}
      className={`live-question-header live-question-header--${variant}`}
      data-has-image={Boolean(imageUrl)}
    >
      {imageUrl ? (
        <motion.figure
          initial={
            shouldReduceMotion ? false : { opacity: 0, y: -24, scale: 0.94 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.08,
            duration: 0.46,
            ease: [0.22, 0.82, 0.24, 1],
          }}
          className="live-question__media"
        >
          <img src={imageUrl} alt="" />
        </motion.figure>
      ) : null}

      <div className="live-question-header__copy">
        <motion.h3
          id={headingId}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 18, filter: 'blur(7px)' }
          }
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            delay: 0.13,
            duration: 0.45,
            ease: [0.22, 0.82, 0.24, 1],
          }}
          className="live-question__title"
        >
          {title}
        </motion.h3>
      </div>
    </motion.header>
  );
}
