import { CircleCheckBig } from 'lucide-react';

import { AnswerSelection } from './AnswerSelection';
import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveTrueFalse(props: LiveQuestionTypeProps) {
  return (
    <section
      className="live-question live-question--true-false"
      aria-labelledby="live-true-false-heading"
    >
      <LiveQuestionHeader
        eyebrow="נכון או לא נכון?"
        headingId="live-true-false-heading"
        icon={<CircleCheckBig size={25} />}
        imagePath={props.question.image_path}
        title={props.question.question_text}
      />
      <AnswerSelection {...props} forceSingle compact />
    </section>
  );
}
