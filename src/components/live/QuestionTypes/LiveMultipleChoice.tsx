import { ListChecks } from 'lucide-react';

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
        eyebrow="שאלת בחירה"
        headingId="live-multiple-choice-heading"
        icon={<ListChecks size={25} />}
        imagePath={props.question.image_path}
        title={props.question.question_text}
      />
      <AnswerSelection {...props} />
    </section>
  );
}
