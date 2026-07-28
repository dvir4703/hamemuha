import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveOpenAnswer({ question }: LiveQuestionTypeProps) {
  return (
    <section
      className="live-question live-question--open-answer"
      aria-labelledby="live-open-answer-heading"
    >
      <LiveQuestionHeader
        headingId="live-open-answer-heading"
        imagePath={question.image_path}
        title={question.question_text}
        variant="cinematic"
      />
    </section>
  );
}
