import type { QuestionWithRelations } from '../../types';
import { LiveQuestionHeader } from './QuestionTypes/LiveQuestionHeader';

interface QuestionRevealScreenProps {
  question: QuestionWithRelations;
  progress: number;
}

export function QuestionRevealScreen({
  question,
  progress,
}: QuestionRevealScreenProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <section
      className="live-question-reveal"
      aria-labelledby="live-question-reveal-heading"
      data-question-reveal
    >
      <LiveQuestionHeader
        headingId="live-question-reveal-heading"
        imagePath={question.image_path}
        title={question.question_text}
      />

      <div
        className="live-question-reveal__progress"
        role="progressbar"
        aria-label="זמן קריאת השאלה"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </section>
  );
}
