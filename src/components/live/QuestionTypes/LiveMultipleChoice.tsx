import { AnswerSelection } from './AnswerSelection';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveMultipleChoice(props: LiveQuestionTypeProps) {
  return (
    <section
      className="live-question live-question--multiple-choice"
      aria-labelledby="live-multiple-choice-heading"
    >
      <LiveQuestionHeader
        headingId="live-multiple-choice-heading"
        imagePath={props.question.image_path}
        title={props.question.question_text}
      />
      <AnswerSelection {...props} />
    </section>
  );
}
