import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LiveGame from '../src/pages/LiveGame/LiveGame';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LiveQuestionRenderer } from '../src/components/live/LiveQuestionRenderer';
import { AnswerFeedbackScreen } from '../src/components/live/AnswerFeedback/AnswerFeedbackScreen';
import { useKeyboard } from '../src/hooks/useKeyboard';
import { useQuestionAudio } from '../src/hooks/useQuestionAudio';
import { useQuestionTimer } from '../src/hooks/useQuestionTimer';
import { selectCurrentQuestion, useLiveStore } from '../src/store/liveStore';
import {
  playQuestionLoopSound,
  stopQuestionLoopSound,
} from '../src/utils/liveSounds';
import {
  calculatePotentialPoints,
  chooseFiftyFiftyHiddenIds,
  isSelectionQuestion,
} from '../src/utils/liveQuestion';
import {
  parseRevealPositions,
  resolveLetterHintPositions,
} from '../src/utils/letterReveal';
import { question, seed, types } from './fixtures';

function Harness({ blocked = false }: { blocked?: boolean }) {
  const current = useLiveStore(selectCurrentQuestion)!;
  const state = useLiveStore();
  useKeyboard({ enabled: !blocked, onExitRequest: () => undefined });
  if (state.gamePhase === 'showing_answer' && state.lastAnswerResult)
    return (
      <AnswerFeedbackScreen
        question={current}
        result={state.lastAnswerResult}
      />
    );
  return (
    <LiveQuestionRenderer
      key={`${current.id}-${state.questionEntrySequence}`}
      question={current}
      revealedHints={state.revealedHintsForCurrentQuestion}
      timeoutExpired={false}
      blocked={blocked}
    />
  );
}
function key(
  value: string,
  extra: KeyboardEventInit = {},
  target: EventTarget = window,
) {
  const event = new KeyboardEvent('keydown', {
    key: value,
    code: value,
    bubbles: true,
    cancelable: true,
    ...extra,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('live controls and screens', () => {
  for (const type of types) {
    it(`${type}: context gating, submission, manual feedback and no submit button`, () => {
      vi.useFakeTimers();
      const q = seed([question(type), question('open_answer', 2)]);
      render(<Harness />);
      expect(document.querySelector('.live-question-reveal')).toBeNull();
      expect(screen.queryByRole('button', { name: /הגש|הגשת/ })).toBeNull();
      if (isSelectionQuestion(type)) {
        expect(screen.getAllByRole('button')).toHaveLength(q.answers.length);
        expect(key('Enter').defaultPrevented).toBe(true);
        expect(useLiveStore.getState().gamePhase).toBe('playing');
        key('F1');
        key('F2');
        expect(useLiveStore.getState().gamePhase).toBe('playing');
        q.answers
          .filter((answer) => answer.is_correct)
          .forEach((answer) =>
            fireEvent.click(
              screen.getByRole('button', {
                name: new RegExp(answer.answer_text),
              }),
            ),
          );
        const focused = screen.getAllByRole('button')[0];
        focused.focus();
        key('Enter', {}, focused);
      } else {
        expect(document.querySelector('input')).toBeNull();
        key('Enter');
        key('f');
        key('כ');
        key('h');
        expect(useLiveStore.getState().gamePhase).toBe('playing');
        expect(key('F1').defaultPrevented).toBe(true);
      }
      expect(screen.getByText('תשובה נכונה!')).toBeTruthy();
      expect(useLiveStore.getState().scoresByContestant.get(1)).toBe(10);
      if (type === 'complete_sentence')
        expect(
          document.querySelectorAll('[data-revealed="true"]'),
        ).toHaveLength(4);
      act(() => {
        vi.advanceTimersByTime(15000);
      });
      expect(useLiveStore.getState().gamePhase).toBe('showing_answer');
      expect(document.querySelector('[class*="progress"]')).toBeNull();
      key('Enter', { repeat: true });
      expect(useLiveStore.getState().gamePhase).toBe('showing_answer');
      key('F1');
      key('F2');
      key('F4');
      expect(useLiveStore.getState().gamePhase).toBe('showing_answer');
      key('Enter');
      expect(selectCurrentQuestion(useLiveStore.getState())?.id).toBe(2);
      expect(useLiveStore.getState().gamePhase).toBe('playing');
    });

    it(`${type}: incorrect feedback waits for Enter and shows correct answer`, () => {
      vi.useFakeTimers();
      const q = seed([question(type), question('open_answer', 2)]);
      render(<Harness />);
      if (isSelectionQuestion(type)) {
        fireEvent.click(
          screen.getByRole('button', {
            name: new RegExp(q.answers.at(-1)!.answer_text),
          }),
        );
        key('Enter');
      } else key('F2');
      expect(
        document.querySelector('[data-answer-feedback="wrong"]'),
      ).toBeTruthy();
      expect(
        screen.getByText(
          isSelectionQuestion(type)
            ? q.answers[0].answer_text
            : q.correct_answer_text!,
        ),
      ).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(15000);
      });
      expect(useLiveStore.getState().gamePhase).toBe('showing_answer');
      key('Enter');
      expect(selectCurrentQuestion(useLiveStore.getState())?.id).toBe(2);
    });
  }

  it('50/50 clears hidden selections, retains every correct answer, charges once even after reentry', () => {
    const q = seed();
    render(<Harness />);
    q.answers.forEach((answer) =>
      fireEvent.click(
        screen.getByRole('button', { name: new RegExp(answer.answer_text) }),
      ),
    );
    expect(
      key('F4', { key: 'Unidentified', code: 'F4' }).defaultPrevented,
    ).toBe(true);
    const state = useLiveStore.getState();
    const hidden = state.fiftyFiftyHiddenIdsByQuestion.get(q.id)!;
    expect(hidden).toHaveLength(2);
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(state.selectedAnswerIds.some((id) => hidden.includes(id))).toBe(
      false,
    );
    expect(state.potentialPointsForCurrentQuestion).toBe(5);
    expect(screen.getByText('5 נקודות')).toBeTruthy();
    key('F4');
    key('ArrowRight');
    key('ArrowLeft');
    key('F4');
    expect(
      useLiveStore.getState().fiftyFiftyHiddenIdsByQuestion.get(q.id),
    ).toEqual(hidden);
    expect(useLiveStore.getState().potentialPointsForCurrentQuestion).toBe(5);
    expect(useLiveStore.getState().statsByContestant.get(1)?.hintsUsed).toBe(1);
    q.answers
      .filter((answer) => answer.is_correct)
      .forEach((answer) =>
        fireEvent.click(
          screen.getByRole('button', { name: new RegExp(answer.answer_text) }),
        ),
      );
    key('Enter');
    expect(useLiveStore.getState().lastAnswerResult?.pointsAwarded).toBe(5);
  });

  it('type 3 prerevealed and multi-position hints are independent; F1 awards remaining points', () => {
    seed([question('complete_sentence')]);
    render(<Harness />);
    expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(1);
    key('F4');
    expect(document.querySelectorAll('[data-revealed="true"]')).toHaveLength(3);
    expect(screen.getByText('8 נקודות')).toBeTruthy();
    key('F4');
    expect(screen.getByText('רמז טקסט')).toBeTruthy();
    key('F4');
    key('F1');
    expect(useLiveStore.getState().lastAnswerResult?.pointsAwarded).toBe(7);
  });

  it.each([
    'true_false',
    'open_answer',
    'multiple_options',
    'association_hints',
  ] as const)('%s ignores F4 and all retired hint keys', (type) => {
    seed([question(type)]);
    render(<Harness />);
    key('F4');
    key('h');
    key('י');
    expect(useLiveStore.getState().revealedHintsForCurrentQuestion).toBe(0);
    expect(useLiveStore.getState().potentialPointsForCurrentQuestion).toBe(10);
    expect(screen.queryByText('רמז טקסט')).toBeNull();
  });

  it('pause, overlays, contestant navigation, arrows, Esc and repeat guards', () => {
    seed();
    const exit = vi.fn();
    const hook = renderHook(
      ({ enabled }) => useKeyboard({ enabled, onExitRequest: exit }),
      { initialProps: { enabled: true } },
    );
    key(' ');
    key('F4');
    key('Enter');
    expect(useLiveStore.getState().gamePhase).toBe('paused');
    key('2');
    key(' ');
    expect(useLiveStore.getState().currentContestantId).toBe(2);
    expect(useLiveStore.getState().gamePhase).toBe('playing');
    key('1');
    key('ArrowRight');
    key('ArrowLeft');
    expect(selectCurrentQuestion(useLiveStore.getState())?.id).toBe(1);
    key('Escape');
    expect(exit).toHaveBeenCalledOnce();
    hook.rerender({ enabled: false });
    key('ArrowRight');
    key('F4');
    expect(selectCurrentQuestion(useLiveStore.getState())?.id).toBe(1);
    expect(useLiveStore.getState().potentialPointsForCurrentQuestion).toBe(10);
  });

  it.each(types)(
    '%s handles timeout exactly once without enabling oral Enter submission',
    (type) => {
      const q = seed([question(type)]);
      if (isSelectionQuestion(type)) {
        q.answers
          .filter((answer) => answer.is_correct)
          .forEach((answer) =>
            useLiveStore.getState().toggleSelectedAnswer(answer.id),
          );
      }
      const view = render(
        <LiveQuestionRenderer question={q} revealedHints={0} timeoutExpired />,
      );
      expect(useLiveStore.getState().lastAnswerResult?.wasTimeout).toBe(true);
      expect(useLiveStore.getState().lastAnswerResult?.isCorrect).toBe(
        isSelectionQuestion(type),
      );
      const submission = useLiveStore.getState().lastAnswerResult?.submissionId;
      view.rerender(
        <LiveQuestionRenderer question={q} revealedHints={0} timeoutExpired />,
      );
      expect(useLiveStore.getState().lastAnswerResult?.submissionId).toBe(
        submission,
      );
    },
  );

  it('does not charge 50/50 when wrong answers do not outnumber correct answers', () => {
    const q = question('multiple_choice');
    q.answers = q.answers.slice(0, 3);
    seed([q]);
    render(<Harness />);
    key('F4');
    key('F4');
    expect(useLiveStore.getState().potentialPointsForCurrentQuestion).toBe(10);
    expect(useLiveStore.getState().fiftyFiftyHiddenIdsByQuestion.size).toBe(0);
  });

  it('full live page replaces feedback immediately without keeping a second letter board', () => {
    vi.useFakeTimers();
    seed([question('complete_sentence'), question('open_answer', 2)]);
    render(
      <MemoryRouter
        initialEntries={['/quiz/1/live']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/quiz/:id/live" element={<LiveGame />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.querySelectorAll('.live-letter-board')).toHaveLength(1);
    key('F1');
    expect(document.querySelectorAll('.live-letter-board')).toHaveLength(1);
    expect(
      document.querySelector('.live-question--complete-sentence'),
    ).toBeNull();
    key('1');
    expect(document.querySelectorAll('.live-letter-board')).toHaveLength(1);
    expect(document.querySelector('[data-answer-feedback]')).toBeNull();
    key('F2');
    key('Enter');
    expect(document.querySelector('[data-answer-feedback]')).toBeNull();
    expect(document.querySelector('.live-question--open-answer')).toBeTruthy();
  });

  it('starts the first question in playing immediately', () => {
    seed();
    useLiveStore.setState({ gamePhase: 'intro_video' });
    useLiveStore.getState().startGame();
    expect(useLiveStore.getState().gamePhase).toBe('playing');
    expect(useLiveStore.getState().questionEntrySequence).toBe(1);
  });
});

describe('audio, timer and data compatibility', () => {
  it('starts correct audio immediately and restarts on reentry, stops on pause/feedback', () => {
    const hook = renderHook(
      ({ active, limit, entry }) => useQuestionAudio(1, limit, active, entry),
      {
        initialProps: { active: true, limit: null as number | null, entry: 1 },
      },
    );
    expect(playQuestionLoopSound).toHaveBeenLastCalledWith('background');
    hook.rerender({ active: true, limit: 30, entry: 2 });
    expect(playQuestionLoopSound).toHaveBeenLastCalledWith('countdown');
    hook.rerender({ active: false, limit: 30, entry: 2 });
    expect(stopQuestionLoopSound).toHaveBeenCalled();
    hook.rerender({ active: true, limit: 30, entry: 3 });
    expect(playQuestionLoopSound).toHaveBeenCalledTimes(3);
  });
  it('timer starts immediately, pauses and resets on question reentry', () => {
    vi.useFakeTimers();
    const hook = renderHook(
      ({ active, entry }) => useQuestionTimer(1, 10, active, entry),
      { initialProps: { active: true, entry: 1 } },
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(hook.result.current.remainingSeconds).toBe(8);
    hook.rerender({ active: false, entry: 1 });
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(hook.result.current.remainingSeconds).toBe(8);
    hook.rerender({ active: true, entry: 2 });
    expect(hook.result.current.remainingSeconds).toBe(10);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(hook.result.current.hasExpired).toBe(true);
  });
  it('legacy scalar indexes/letters, JSON arrays, invalid data and spaces', () => {
    expect(parseRevealPositions('3')).toEqual([3]);
    expect(parseRevealPositions('[3,0,3]')).toEqual([0, 3]);
    expect(parseRevealPositions('[-1,0]')).toEqual([]);
    expect(parseRevealPositions('bad')).toEqual([]);
    expect(
      resolveLetterHintPositions('אב אב', ['א', 'א', '[1,4]', '2']),
    ).toEqual([[0], [3], [1, 4], []]);
  });
  it('50/50 leaves one wrong answer per correct answer and halves the score', () => {
    const fourWithOneCorrect = question('multiple_choice');
    fourWithOneCorrect.answers = fourWithOneCorrect.answers
      .slice(0, 4)
      .map((a, i) => ({ ...a, is_correct: i === 0 }));
    const hiddenFromFour = chooseFiftyFiftyHiddenIds(fourWithOneCorrect);
    expect(hiddenFromFour).toHaveLength(2);
    expect(hiddenFromFour).not.toContain(fourWithOneCorrect.answers[0].id);
    expect(
      calculatePotentialPoints({ ...fourWithOneCorrect, points: 100 }, 1, true),
    ).toBe(50);

    const sixWithTwoCorrect = question('multiple_choice');
    const hiddenFromSix = chooseFiftyFiftyHiddenIds(sixWithTwoCorrect);
    expect(hiddenFromSix).toHaveLength(2);
    expect(
      hiddenFromSix.some((id) =>
        sixWithTwoCorrect.answers.some(
          (answer) => answer.id === id && answer.is_correct,
        ),
      ),
    ).toBe(false);
    expect(calculatePotentialPoints(sixWithTwoCorrect, 1, true)).toBe(5);

    const fourWithTwoCorrect = question('multiple_choice');
    fourWithTwoCorrect.answers = fourWithTwoCorrect.answers.slice(0, 4);
    expect(chooseFiftyFiftyHiddenIds(fourWithTwoCorrect)).toEqual([]);
    expect(
      calculatePotentialPoints({ ...fourWithTwoCorrect, points: 1 }, 1, true),
    ).toBe(0);
    expect(calculatePotentialPoints(question('association_hints'), 99)).toBe(
      10,
    );
  });
});
