import { motion } from 'framer-motion';
import { Music2 } from 'lucide-react';

import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { getQuestionMediaType } from '../../../utils/media';

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
  const mediaUrl = useMediaUrl(imagePath);
  const mediaType = getQuestionMediaType(imagePath);

  return (
    <motion.header
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.44, ease: [0.22, 0.82, 0.24, 1] }}
      className={`live-question-header live-question-header--${variant}`}
      data-has-image={Boolean(mediaUrl)}
    >
      {mediaUrl && mediaType ? (
        <motion.figure
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.08,
            duration: 0.46,
            ease: [0.22, 0.82, 0.24, 1],
          }}
          className="live-question__media"
          data-media-type={mediaType}
        >
          {mediaType === 'image' ? <img src={mediaUrl} alt="" /> : null}
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              playsInline
              preload="metadata"
              aria-label="וידאו מצורף לשאלה"
            />
          ) : null}
          {mediaType === 'audio' ? (
            <div className="live-question__audio">
              <Music2 size={34} aria-hidden="true" />
              <span>קטע אודיו לשאלה</span>
              <audio
                src={mediaUrl}
                controls
                preload="metadata"
                aria-label="אודיו מצורף לשאלה"
              />
            </div>
          ) : null}
        </motion.figure>
      ) : null}

      <div className="live-question-header__copy">
        <motion.h3
          id={headingId}
          initial={false}
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
