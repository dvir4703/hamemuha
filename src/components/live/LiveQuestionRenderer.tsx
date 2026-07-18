import { LockKeyhole } from 'lucide-react';

import type { QuestionWithRelations } from '../../types';
import { calculatePotentialPoints } from '../../utils/liveQuestion';
import { useLiveStore } from '../../store/liveStore';
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
}: LiveQuestionRendererProps) {
  const gamePhase = useLiveStore((state) => state.gamePhase);
  const submitAnswer = useLiveStore((state) => state.submitAnswer);
  const QuestionComponent = questionComponents[question.question_type];
  const disabled = gamePhase !== 'playing';
  const potentialPoints = calculatePotentialPoints(question, revealedHints);

  return (
    <div data-question-type={question.question_type}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.07] pb-4">
        <span className="rounded-full bg-amber/15 px-4 py-2 font-display text-lg font-black text-amber-dark">
          {potentialPoints} נקודות
        </span>
        {gamePhase === 'showing_answer' ? (
          <span
            className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-4 py-2 font-bold text-teal"
            role="status"
          >
            <LockKeyhole size={17} /> התשובה נקלטה
          </span>
        ) : null}
      </div>
      <QuestionComponent
        key={question.id}
        question={question}
        revealedHints={revealedHints}
        onSubmit={submitAnswer}
        disabled={disabled}
      />
    </div>
  );
}
