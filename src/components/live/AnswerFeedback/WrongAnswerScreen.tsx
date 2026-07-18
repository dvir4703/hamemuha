import { ArrowRight, BookOpenCheck, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

import type { QuestionWithRelations } from '../../../types';

interface WrongAnswerScreenProps {
  question: QuestionWithRelations;
}

const optionQuestionTypes = new Set([
  'multiple_choice',
  'true_false',
  'multiple_options',
  'association_hints',
]);

export function WrongAnswerScreen({ question }: WrongAnswerScreenProps) {
  const sortedAnswers = [...question.answers].sort(
    (a, b) => a.display_order - b.display_order || a.id - b.id,
  );
  const showOptions = optionQuestionTypes.has(question.question_type);

  return (
    <section
      className="mx-auto min-h-[30rem] max-w-5xl py-7 text-center"
      data-answer-feedback="wrong"
      aria-live="assertive"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
      >
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-violet/10 text-violet shadow-[inset_0_0_0_1px_rgba(119,113,199,0.16)]">
          <Heart size={38} fill="currentColor" className="opacity-80" />
        </span>
        <h3 className="mt-5 font-display text-5xl font-black text-violet sm:text-6xl">
          כמעט — בואו נראה יחד
        </h3>
        <p className="mt-3 text-xl font-bold text-ink/55">
          טעות היא עוד דרך טובה להגיע לתשובה.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.34 }}
        className="mx-auto mt-8 max-w-4xl rounded-[28px] border border-amber/35 bg-amber/[0.12] p-6 text-right"
      >
        <div className="flex items-center gap-3 text-amber-dark">
          <BookOpenCheck size={26} />
          <h4 className="font-display text-2xl font-black">התשובה שחיפשנו</h4>
        </div>

        {showOptions ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sortedAnswers.map((answer) => (
              <div
                key={answer.id}
                className={`rounded-2xl border-2 px-5 py-4 font-display text-xl font-black transition ${answer.is_correct ? 'border-teal bg-white text-teal shadow-card' : 'border-transparent bg-white/45 text-ink/35'}`}
              >
                {answer.answer_text}
                {answer.is_correct ? (
                  <span className="mr-2 text-sm font-black">✓ נכון</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border-2 border-teal bg-white px-6 py-5 font-display text-3xl font-black text-teal shadow-card">
            {question.correct_answer_text || 'לא הוגדרה תשובה להצגה'}
          </p>
        )}
      </motion.div>

      {question.explanation ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.32 }}
          className="mx-auto mt-5 max-w-4xl rounded-[24px] border border-violet/15 bg-violet/[0.06] px-6 py-5 text-right"
        >
          <p className="text-sm font-black text-violet">הסבר קצר</p>
          <p className="mt-2 text-xl font-semibold leading-relaxed text-ink/75">
            {question.explanation}
          </p>
        </motion.div>
      ) : null}

      <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-canvas px-5 py-2 text-sm font-bold text-ink/45">
        <ArrowRight size={17} /> כשההסבר הסתיים, ממשיכים עם חץ ימינה
      </p>
    </section>
  );
}
