import { motion, useReducedMotion } from 'framer-motion';

import { useLiveStore } from '../../store/liveStore';
import type { QuestionWithRelations } from '../../types';
import { LiveAssociationHints } from './QuestionTypes/LiveAssociationHints';
import { LiveCompleteSentence } from './QuestionTypes/LiveCompleteSentence';
import { LiveMultipleChoice } from './QuestionTypes/LiveMultipleChoice';
import { LiveMultipleOptions } from './QuestionTypes/LiveMultipleOptions';
import { LiveOpenAnswer } from './QuestionTypes/LiveOpenAnswer';
import { LiveTrueFalse } from './QuestionTypes/LiveTrueFalse';
import type { LiveQuestionTypeProps } from './QuestionTypes/types';

interface LiveQuestionRendererProps {
  question: QuestionWithRelations;
  revealedHints: number;
  timeoutExpired: boolean;
  blocked?: boolean;
  contestantTimeExpired?: boolean;
}

const questionComponents = {
  multiple_choice: LiveMultipleChoice,
  true_false: LiveTrueFalse,
  complete_sentence: LiveCompleteSentence,
  open_answer: LiveOpenAnswer,
  multiple_options: LiveMultipleOptions,
  association_hints: LiveAssociationHints,
} satisfies Record<
  QuestionWithRelations['question_type'],
  (props: LiveQuestionTypeProps) => React.JSX.Element
>;

export function LiveQuestionRenderer({
  question,
  revealedHints,
  timeoutExpired,
  blocked = false,
  contestantTimeExpired = false,
}: LiveQuestionRendererProps) {
  const shouldReduceMotion = useReducedMotion();
  const gamePhase = useLiveStore((state) => state.gamePhase);
  const submitAnswer = useLiveStore((state) => state.submitAnswer);
  const QuestionComponent = questionComponents[question.question_type];
  const disabled = gamePhase !== 'playing' || blocked;
  const potentialPoints = useLiveStore(
    (state) => state.potentialPointsForCurrentQuestion,
  );

  return (
    <motion.div
      layout
      transition={{
        layout: {
          duration: shouldReduceMotion ? 0.01 : 0.36,
          ease: [0.22, 0.82, 0.24, 1],
        },
      }}
      className="live-question-shell"
      data-question-type={question.question_type}
    >
      <motion.div layout="position" className="live-question-shell__status">
        <span className="live-question-shell__points">
          {potentialPoints} נקודות
        </span>
        {contestantTimeExpired ? (
          <span className="text-sm font-bold text-[#ffe08a]/80" role="status">
            הזמן הסתיים — אפשר לענות על השאלה הנוכחית ללא ניקוד
          </span>
        ) : null}
      </motion.div>
      <motion.div layout="position" className="live-question-shell__content">
        <QuestionComponent
          key={question.id}
          question={question}
          revealedHints={revealedHints}
          timeoutExpired={timeoutExpired}
          onSubmit={submitAnswer}
          disabled={disabled}
        />
      </motion.div>
    </motion.div>
  );
}
