import { motion, useReducedMotion } from 'framer-motion';

import type { QuestionWithRelations } from '../../../types';

interface WrongAnswerScreenProps {
  question: QuestionWithRelations;
}

const optionQuestionTypes = new Set([
  'multiple_choice',
  'true_false',
  'multiple_options',
  'association_hints',
]);

export function WrongAnswerScreen({ question }: WrongAnswerScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const sortedAnswers = [...question.answers].sort(
    (a, b) => a.display_order - b.display_order || a.id - b.id,
  );
  const showOptions = optionQuestionTypes.has(question.question_type);

  return (
    <section
      className="live-feedback live-feedback--wrong"
      data-answer-feedback="wrong"
      aria-live="assertive"
    >
      <div className="live-feedback__wrong-spotlight" aria-hidden="true" />

      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, scale: 0.72, y: 32, filter: 'blur(9px)' }
        }
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          type: 'spring',
          stiffness: 210,
          damping: 19,
        }}
        className="live-feedback__wrong-intro"
      >
        <h3>כמעט — הנה התשובה</h3>
      </motion.div>

      <motion.article
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, y: 42, scale: 0.94, rotateX: 8 }
        }
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        transition={{
          delay: shouldReduceMotion ? 0 : 0.16,
          duration: 0.52,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="live-feedback__answer-reveal"
      >
        <header>
          <h4>התשובה הנכונה</h4>
        </header>

        {showOptions ? (
          <div className="live-feedback__answer-options">
            {sortedAnswers.map((answer, index) => (
              <motion.div
                key={answer.id}
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, x: index % 2 === 0 ? 24 : -24 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: shouldReduceMotion ? 0 : 0.34 + index * 0.07,
                  duration: 0.34,
                }}
                className="live-feedback__answer-option"
                data-correct={answer.is_correct}
              >
                <span>{answer.answer_text}</span>
                {answer.is_correct ? <strong>נכון</strong> : null}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p
            initial={
              shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.94 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.36,
              type: 'spring',
              stiffness: 230,
              damping: 18,
            }}
            className="live-feedback__correct-text"
          >
            {question.correct_answer_text || 'לא הוגדרה תשובה להצגה'}
          </motion.p>
        )}
      </motion.article>

      {question.explanation ? (
        <motion.article
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.58,
            duration: 0.36,
          }}
          className="live-feedback__wrong-explanation"
        >
          <span>הסבר</span>
          <p>{question.explanation}</p>
        </motion.article>
      ) : null}
    </section>
  );
}
