import { AnswerSelection } from './AnswerSelection';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveAssociationHints(props: LiveQuestionTypeProps) {
  return (
    <section
      className="live-question live-question--association"
      aria-labelledby="live-association-heading"
    >
      <LiveQuestionHeader
        headingId="live-association-heading"
        imagePath={props.question.image_path}
        title={props.question.question_text}
      />

      <div className="live-association__answers">
        <div className="live-association__answers-label" aria-hidden="true">
          <span />
          אפשרויות תשובה
          <span />
        </div>
        <AnswerSelection {...props} compact />
      </div>
    </section>
  );
}
