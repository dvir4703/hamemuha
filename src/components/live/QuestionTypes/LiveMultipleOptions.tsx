import { LayoutGrid } from 'lucide-react';

import { useImageUrl } from '../../../hooks/useImageUrl';
import { AnswerSelection } from './AnswerSelection';
import type { LiveQuestionTypeProps } from './types';

export function LiveMultipleOptions(props: LiveQuestionTypeProps) {
  const imageUrl = useImageUrl(props.question.image_path);

  return (
    <section aria-labelledby="live-multiple-options-heading">
      <div className="mb-7 overflow-hidden rounded-[28px] bg-hero text-white shadow-hero">
        <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_minmax(15rem,36%)]">
          <div className="flex min-h-52 flex-col justify-center p-7 sm:p-9">
            <div className="flex items-center gap-3 text-mint">
              <LayoutGrid size={25} />
              <span className="text-sm font-black">האלמנט המרכזי</span>
            </div>
            <h3
              id="live-multiple-options-heading"
              className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl"
            >
              {props.question.question_text}
            </h3>
          </div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-64 w-full object-cover md:h-full md:min-h-52"
            />
          ) : (
            <div
              className="hidden min-h-52 place-items-center bg-[radial-gradient(circle_at_center,rgba(159,225,212,0.22),transparent_65%)] md:grid"
              aria-hidden="true"
            >
              <LayoutGrid className="text-white/20" size={92} />
            </div>
          )}
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h4 className="font-display text-xl font-black">מה מתאים?</h4>
        <span className="text-sm font-bold text-ink/40">בחרו מהאפשרויות</span>
      </div>
      <AnswerSelection {...props} />
    </section>
  );
}
