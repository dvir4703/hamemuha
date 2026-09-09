import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CompleteSentenceFields } from '../src/components/quiz/QuestionTypeFields/CompleteSentenceFields';
import { AssociationHintsFields } from '../src/components/quiz/QuestionTypeFields/AssociationHintsFields';
import { parseRevealPositions } from '../src/utils/letterReveal';
import { type HintDraft } from '../src/components/quiz/QuestionTypeFields/types';

function FormHarness() {
  const [answer, setAnswer] = useState('אב גד');
  const [pre, setPre] = useState<number[]>([]);
  const [hints, setHints] = useState<HintDraft[]>([
    { key: 'a', hintType: 'letter_reveal', hintText: '1', pointsPenalty: 2 },
    { key: 'b', hintType: 'letter_reveal', hintText: '[4]', pointsPenalty: 1 },
  ]);
  return (
    <>
      <CompleteSentenceFields
        correctAnswerText={answer}
        prerevealedPositions={pre}
        hints={hints}
        errors={{}}
        onCorrectAnswerChange={setAnswer}
        onHintsChange={setHints}
        onPrerevealedPositionsChange={setPre}
      />
      <output>
        {JSON.stringify({
          pre,
          hints: hints.map((hint) => parseRevealPositions(hint.hintText)),
        })}
      </output>
    </>
  );
}
it('blocks every letter already used by prereveal or another reveal hint', () => {
  render(<FormHarness />);
  const pre = within(
    screen.getByRole('group', { name: 'בחירת אותיות גלויות מראש' }),
  );
  const hint = within(
    screen.getByRole('group', { name: 'בחירת מיקומי אותיות לרמז 1' }),
  );
  expect(
    pre.getByRole('button', { name: 'ב, מיקום 2' }).hasAttribute('disabled'),
  ).toBe(true);
  expect(
    pre.getByRole('button', { name: 'ד, מיקום 5' }).hasAttribute('disabled'),
  ).toBe(true);
  fireEvent.click(pre.getByRole('button', { name: 'א, מיקום 1' }));
  expect(
    hint.getByRole('button', { name: 'א, מיקום 1' }).hasAttribute('disabled'),
  ).toBe(true);
  fireEvent.click(hint.getByRole('button', { name: 'ג, מיקום 4' }));
  expect(screen.getByRole('status').textContent).toBe(
    '{"pre":[0],"hints":[[1,3],[4]]}',
  );
  expect(
    hint.getByRole('button', { name: 'ד, מיקום 5' }).hasAttribute('disabled'),
  ).toBe(true);
  fireEvent.click(hint.getByRole('button', { name: 'ג, מיקום 4' }));
  expect(screen.getByRole('status').textContent).toBe(
    '{"pre":[0],"hints":[[1],[4]]}',
  );
  fireEvent.change(screen.getByLabelText('המילה או הביטוי החסרים'), {
    target: { value: 'א' },
  });
  expect(screen.getByRole('status').textContent).toBe(
    '{"pre":[0],"hints":[[],[]]}',
  );
});
it('association editor requires only answer options', () => {
  render(
    <AssociationHintsFields
      answers={[]}
      errors={{}}
      onAnswersChange={() => undefined}
    />,
  );
  expect(screen.queryByText(/רמז/)).toBeNull();
  expect(screen.getByRole('button', { name: /הוספת אפשרות/ })).toBeTruthy();
});
