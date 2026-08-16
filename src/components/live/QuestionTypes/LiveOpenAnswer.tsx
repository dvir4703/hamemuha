import { useEffect, useRef } from 'react';

import { LiveQuestionHeader } from './LiveQuestionHeader';
import type { LiveQuestionTypeProps } from './types';

export function LiveOpenAnswer({
  question,
  timeoutExpired,
  onSubmit,
  disabled = false,
}: LiveQuestionTypeProps) {
  const timeoutHandledRef = useRef(false);

  useEffect(() => {
    if (disabled || !timeoutExpired || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    onSubmit(false, 0, true);
  }, [disabled, onSubmit, timeoutExpired]);

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
