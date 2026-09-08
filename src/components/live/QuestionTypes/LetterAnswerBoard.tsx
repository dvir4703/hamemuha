import { motion, useReducedMotion } from 'framer-motion';

interface LetterAnswerBoardProps {
  answer: string;
  revealedPositions?: ReadonlySet<number>;
  revealAll?: boolean;
}

export function LetterAnswerBoard({
  answer,
  revealedPositions,
  revealAll = false,
}: LetterAnswerBoardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className="live-letter-board"
      dir="rtl"
      role="group"
      aria-label={
        revealAll ? `התשובה הנכונה: ${answer}` : 'תיבות התשובה — מענה בעל פה'
      }
    >
      {Array.from(answer.trim()).map((character, position) => {
        if (/\s/u.test(character))
          return (
            <span
              key={position}
              className="live-letter-board__space"
              aria-hidden="true"
            />
          );
        const revealed = revealAll || Boolean(revealedPositions?.has(position));
        return (
          <motion.span
            key={`${position}-${revealed}`}
            data-answer-position={position}
            data-filled={revealed}
            data-revealed={revealed}
            aria-label={`אות ${position + 1}: ${revealed ? character : 'ריקה'}`}
            initial={reduceMotion || !revealed ? false : { scale: 1.3, y: -12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 410, damping: 18 }}
            className="live-letter-board__tile"
          >
            {revealed ? character : '\u00a0'}
          </motion.span>
        );
      })}
    </div>
  );
}
