import { AnswerSelection } from './AnswerSelection';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveMultipleOptions(props: LiveQuestionTypeProps) {
  return (
    <section
      className="live-question live-question--multiple-options"
      aria-labelledby="live-multiple-options-heading"
    >
      <LiveQuestionHeader
        headingId="live-multiple-options-heading"
        imagePath={props.question.image_path}
        title={props.question.question_text}
      />
      <AnswerSelection {...props} progressiveReveal />
    </section>
  );
}
