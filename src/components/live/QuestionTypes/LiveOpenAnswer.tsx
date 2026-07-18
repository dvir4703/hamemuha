import { MessageCircleMore } from 'lucide-react';

import type { LiveQuestionTypeProps } from './types';

export function LiveOpenAnswer({ question }: LiveQuestionTypeProps) {
  return (
    <section
      className="grid min-h-96 place-items-center py-8 text-center"
      aria-labelledby="live-open-answer-heading"
    >
      <div className="max-w-5xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-coral/10 text-coral">
          <MessageCircleMore size={36} />
        </span>
        <p className="mt-5 text-sm font-black text-coral">תשובה פתוחה</p>
        <h3
          id="live-open-answer-heading"
          className="mt-3 font-display text-5xl font-black leading-tight sm:text-6xl"
        >
          {question.question_text}
        </h3>
        <p className="mt-8 inline-flex rounded-full bg-canvas px-5 py-2 text-base font-bold text-ink/50">
          התשובה נמסרת בעל־פה למנחה
        </p>
      </div>
    </section>
  );
}
