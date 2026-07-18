import { ListChecks } from 'lucide-react';

import { AnswerSelection } from './AnswerSelection';
import type { LiveQuestionTypeProps } from './types';

export function LiveMultipleChoice(props: LiveQuestionTypeProps) {
  return (
    <section aria-labelledby="live-multiple-choice-heading">
      <div className="mb-7 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal">
          <ListChecks size={27} />
        </span>
        <div>
          <p className="text-sm font-black text-teal">שאלת בחירה</p>
          <h3
            id="live-multiple-choice-heading"
            className="mt-1 font-display text-3xl font-black leading-tight sm:text-4xl"
          >
            {props.question.question_text}
          </h3>
        </div>
      </div>
      <AnswerSelection {...props} />
    </section>
  );
}
