import { useEffect, useState } from 'react';
import { ArrowRight, Construction, LoaderCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import type { Quiz } from '../../types';

export default function QuizEditorPlaceholder() {
  const { quizId } = useParams();
  const numericQuizId = Number(quizId);
  const hasValidQuizId = Number.isInteger(numericQuizId) && numericQuizId > 0;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(hasValidQuizId);

  useEffect(() => {
    let isActive = true;

    if (!hasValidQuizId) {
      return;
    }

    void window.api.quiz
      .getById(numericQuizId)
      .then((loadedQuiz) => {
        if (isActive) {
          setQuiz(loadedQuiz);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [hasValidQuizId, numericQuizId]);

  return (
    <main className="app-shell grid min-h-screen place-items-center bg-canvas p-6">
      <div className="w-full max-w-2xl rounded-[30px] bg-white p-8 text-center shadow-card ring-1 ring-ink/[0.06] sm:p-12">
        {isLoading ? (
          <LoaderCircle
            className="mx-auto animate-spin text-teal"
            size={38}
            aria-label="טוען את החידון"
          />
        ) : (
          <>
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-amber/20 text-amber-dark">
              <Construction size={38} aria-hidden="true" />
            </span>
            <p className="mt-6 text-sm font-bold text-teal">מסך עריכת החידון</p>
            <h1 className="mt-2 font-display text-3xl font-black text-ink">
              {quiz?.name ?? 'החידון לא נמצא'}
            </h1>
            <p className="mx-auto mt-3 max-w-md leading-7 text-ink/60">
              מסך ניהול השאלות והמתמודדים המלא ייבנה בשלב הבא. החידון כבר שמור
              ומוכן להמשך עבודה.
            </p>
            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-3 font-bold text-white shadow-button transition hover:bg-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <ArrowRight size={19} aria-hidden="true" />
              חזרה לכל החידונים
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
