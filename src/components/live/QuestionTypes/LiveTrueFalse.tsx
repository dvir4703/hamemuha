import { CircleCheckBig } from 'lucide-react';

import { AnswerSelection } from './AnswerSelection';
import type { LiveQuestionTypeProps } from './types';

export function LiveTrueFalse(props: LiveQuestionTypeProps) {
  return (
    <section aria-labelledby="live-true-false-heading">
      <div className="mb-8 text-center">
        <CircleCheckBig className="mx-auto text-violet" size={44} />
        <p className="mt-3 text-sm font-black text-violet">נכון או לא נכון?</p>
        <h3
          id="live-true-false-heading"
          className="mx-auto mt-2 max-w-4xl font-display text-4xl font-black leading-tight sm:text-5xl"
        >
          {props.question.question_text}
        </h3>
      </div>
      <AnswerSelection {...props} forceSingle compact />
    </section>
  );
}
