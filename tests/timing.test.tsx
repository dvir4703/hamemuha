import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { CreateQuizModal } from '../src/components/ui/CreateQuizModal';
import { TimeLimitStepper } from '../src/components/quiz/TimeLimitStepper';
import { LiveQuestionRenderer } from '../src/components/live/LiveQuestionRenderer';
import { useContestantTimer } from '../src/hooks/useContestantTimer';
import { useKeyboard } from '../src/hooks/useKeyboard';
import { selectCurrentQuestion, useLiveStore } from '../src/store/liveStore';
import LiveGame from '../src/pages/LiveGame/LiveGame';
import type { Quiz, TimingMode } from '../src/types';
import { buildScoreboardEntries } from '../src/utils/scoreboard';
import { isSelectionQuestion } from '../src/utils/liveQuestion';
import {
  isValidContestantTimeLimit,
  normalizeContestantTimeLimit,
} from '../src/utils/timeLimit';
import {
  playQuestionLoopSound,
  stopQuestionLoopSound,
} from '../src/utils/liveSounds';
import { question, seed, types } from './fixtures';

const quiz: Quiz = {
  id: 1,
  name: 'תקציב זמן',
  timing_mode: 'per_contestant',
  logo_path: null,
  created_at: '',
  updated_at: '',
};
const state = () => useLiveStore.getState();
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });
const press = (key: string) => fireEvent.keyDown(window, { key, code: key });

function seedTimed(
  questions = [
    question('open_answer'),
    question('open_answer', 2),
    question('open_answer', 3),
  ],
) {
  vi.useFakeTimers();
  seed(questions);
  useLiveStore.setState({
    quiz,
    gamePhase: 'intro_video',
    contestants: state().contestants.map((c) => ({
      ...c,
      total_time_limit: c.id === 1 ? 30 : 60,
    })),
    remainingTimeMsByContestant: new Map([
      [1, 30000],
      [2, 60000],
    ]),
  });
  state().startGame();
  return questions[0];
}

afterEach(() => {
  state().resetGame();
  vi.unstubAllGlobals();
});

describe('per-contestant time accounting', () => {
  it('preserves fractions across pause, feedback, reentry and independent contestant switches', () => {
    seedTimed();
    const hook = renderHook(() => useContestantTimer(false));
    advance(2350);
    act(() => state().togglePause());
    expect(state().remainingTimeMsByContestant.get(1)).toBe(27650);
    advance(20000);
    expect(state().remainingTimeMsByContestant.get(1)).toBe(27650);
    act(() => state().togglePause());
    advance(650);
    act(() => state().submitAnswer(true, 10));
    expect(state().remainingTimeMsByContestant.get(1)).toBe(27000);
    advance(50000);
    act(() => state().togglePause());
    advance(5000);
    act(() => state().togglePause());
    advance(5000);
    expect(hook.result.current.remainingSeconds).toBe(27);
    act(() => state().nextQuestion());
    advance(1500);
    act(() => state().jumpToContestant(2));
    expect(state().remainingTimeMsByContestant.get(1)).toBe(25500);
    expect(hook.result.current.remainingSeconds).toBe(60);
    advance(4000);
    act(() => state().jumpToContestant(1));
    expect(state().remainingTimeMsByContestant.get(2)).toBe(56000);
    expect(hook.result.current.remainingSeconds).toBe(26);
    act(() => state().previousQuestion());
    advance(500);
    expect(hook.result.current.remainingSeconds).toBe(25);
    expect(state().scoresByContestant.get(1)).toBe(10);
  });

  it('does not spend time on opening/intro, blocking dialogs, or empty contestants', () => {
    seedTimed();
    act(() => state().setContestantTimerBlocked(true));
    useLiveStore.setState({ gamePhase: 'opening' });
    const hook = renderHook(({ blocked }) => useContestantTimer(blocked), {
      initialProps: { blocked: false },
    });
    advance(10000);
    act(() => state().beginIntroVideo());
    advance(10000);
    expect(hook.result.current.remainingSeconds).toBe(30);
    act(() => state().startGame());
    advance(1250);
    hook.rerender({ blocked: true });
    advance(20000);
    expect(state().remainingTimeMsByContestant.get(1)).toBe(28750);
    hook.rerender({ blocked: false });
    advance(750);
    act(() => state().tickContestantTimer());
    expect(hook.result.current.remainingSeconds).toBe(28);
    act(() => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
      state().submitAnswer(true, 10);
      state().nextQuestion();
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    expect(selectCurrentQuestion(state())).toBeNull();
    advance(10000);
    expect(hook.result.current.remainingSeconds).toBe(28);
  });

  it('keeps one continuous budget while skipped questions return in FIFO order', () => {
    seedTimed(
      Array.from({ length: 5 }, (_, index) =>
        question('open_answer', index + 1),
      ),
    );
    const hook = renderHook(() => useContestantTimer(false));

    advance(1000);
    act(() => state().nextQuestion());
    advance(1500);
    act(() => state().nextQuestion());

    advance(1000);
    act(() => {
      state().submitAnswer(true, 10);
    });
    advance(5000);
    act(() => state().nextQuestion());
    advance(1000);
    act(() => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    advance(1000);
    act(() => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });

    expect(state().returnQueueByContestant.get(1)).toEqual([1, 2]);
    expect(selectCurrentQuestion(state())?.id).toBe(1);
    expect(state().remainingTimeMsByContestant.get(1)).toBe(24500);
    expect(hook.result.current.remainingSeconds).toBe(25);

    advance(1200);
    act(() => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    expect(selectCurrentQuestion(state())?.id).toBe(2);
    expect(state().remainingTimeMsByContestant.get(1)).toBe(23300);

    advance(800);
    act(() => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    expect(selectCurrentQuestion(state())).toBeNull();
    expect(state().remainingTimeMsByContestant.get(1)).toBe(22500);
    expect(state().scoresByContestant.get(1)).toBe(50);
    expect(state().statsByContestant.get(1)).toMatchObject({
      correct: 5,
      wrong: 0,
    });
  });

  it('ends after a zero-point answer on an expired returned question and abandons the remaining queue', () => {
    seedTimed(
      Array.from({ length: 5 }, (_, index) =>
        question('open_answer', index + 1),
      ),
    );
    renderHook(() => useContestantTimer(false));

    act(() => {
      state().nextQuestion();
      state().nextQuestion();
      state().submitAnswer(true, 10);
      state().nextQuestion();
      state().submitAnswer(true, 10);
      state().nextQuestion();
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    expect(state().returnQueueByContestant.get(1)).toEqual([1, 2]);
    expect(selectCurrentQuestion(state())?.id).toBe(1);

    advance(30000);
    expect(state().timeExpiryByContestant.get(1)).toEqual({
      questionId: 1,
      answered: false,
    });
    act(() => state().nextQuestion());
    expect(selectCurrentQuestion(state())?.id).toBe(1);

    act(() => state().submitAnswer(true, 10));
    expect(state().lastAnswerResult).toMatchObject({
      questionId: 1,
      isCorrect: true,
      pointsAwarded: 0,
      wasTimeout: true,
    });
    act(() => state().nextQuestion());

    expect(selectCurrentQuestion(state())).toBeNull();
    expect(state().answeredQuestionsLog.has('1:2')).toBe(false);
    expect(
      buildScoreboardEntries(
        state().contestants,
        state().scoresByContestant,
        state().statsByContestant,
      ).find((entry) => entry.contestant.id === 1),
    ).toMatchObject({ score: 30, answered: 4, correct: 4, wrong: 0 });

    state().resetGame();
    expect(state().returnQueueByContestant.size).toBe(0);
  });

  it('settles expiration at submission and navigation even if no display tick has fired', () => {
    seedTimed();
    advance(30001);
    act(() => state().nextQuestion());
    expect(selectCurrentQuestion(state())?.id).toBe(1);
    expect(state().timeExpiryByContestant.get(1)).toEqual({
      questionId: 1,
      answered: false,
    });
    act(() => state().submitAnswer(true, 100));
    expect(state().lastAnswerResult).toMatchObject({
      isCorrect: true,
      pointsAwarded: 0,
      wasTimeout: true,
    });
    act(() => state().jumpToContestant(2));
    act(() => state().jumpToContestant(1));
    expect(selectCurrentQuestion(state())).toBeNull();
    act(() => state().previousQuestion());
    expect(selectCurrentQuestion(state())).toBeNull();
    expect(state().remainingTimeMsByContestant.get(2)).toBe(60000);
  });

  for (const type of types) {
    it(`${type}: accepts a manual answer after zero, awards zero and closes the remaining questions`, () => {
      const q = seedTimed([question(type), question('open_answer', 2)]);
      function Harness() {
        const timer = useContestantTimer(false);
        const current = useLiveStore(selectCurrentQuestion);
        useKeyboard({ enabled: true, onExitRequest: () => undefined });
        return current ? (
          <LiveQuestionRenderer
            question={current}
            revealedHints={0}
            timeoutExpired={false}
            contestantTimeExpired={timer.hasExpired}
          />
        ) : null;
      }
      render(<Harness />);
      advance(30000);
      expect(state().gamePhase).toBe('playing');
      expect(screen.getByText('0 נקודות')).toBeTruthy();
      press('ArrowRight');
      press('ArrowLeft');
      press('1');
      expect(selectCurrentQuestion(state())?.id).toBe(q.id);
      if (isSelectionQuestion(type)) {
        q.answers
          .filter((a) => a.is_correct)
          .forEach((a) =>
            fireEvent.click(
              screen.getByRole('button', { name: new RegExp(a.answer_text) }),
            ),
          );
        press('Enter');
      } else {
        press('F4');
        expect(state().potentialPointsForCurrentQuestion).toBe(0);
        press('F1');
      }
      expect(state().lastAnswerResult).toMatchObject({
        isCorrect: true,
        pointsAwarded: 0,
      });
      expect(state().gamePhase).toBe('showing_answer');
      press('Enter');
      expect(selectCurrentQuestion(state())).toBeNull();
      press('ArrowLeft');
      expect(selectCurrentQuestion(state())).toBeNull();
      press('2');
      expect(state().remainingTimeMsByContestant.get(2)).toBe(60000);
      const entries = buildScoreboardEntries(
        state().contestants,
        state().scoresByContestant,
        state().statsByContestant,
      );
      expect(entries.find((e) => e.contestant.id === 1)).toMatchObject({
        score: 0,
        answered: 1,
        correct: 1,
        wrong: 0,
      });
    });
  }

  it('persists only attempted questions and reaches the scoreboard with an independent second budget', async () => {
    seedTimed();
    const save = vi.fn().mockResolvedValue({ id: 1, contestantResults: [] });
    vi.stubGlobal('api', { result: { saveGameResult: save } });
    advance(5000);
    act(() => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    advance(25000);
    act(() => {
      state().submitAnswer(false, 0);
      state().nextQuestion();
    });
    act(() => state().jumpToContestant(2));
    advance(5000);
    await act(async () => {
      state().submitAnswer(true, 10);
      state().nextQuestion();
    });
    expect(state().gamePhase).toBe('finished');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        contestantResults: [
          {
            contestantId: 1,
            totalScore: 10,
            correctCount: 1,
            wrongCount: 1,
            hintsUsed: 0,
          },
          {
            contestantId: 2,
            totalScore: 10,
            correctCount: 1,
            wrongCount: 0,
            hintsUsed: 0,
          },
        ],
      }),
    );
    expect(state().remainingTimeMsByContestant.get(2)).toBe(55000);
    state().resetGame();
    expect(state().remainingTimeMsByContestant.size).toBe(0);
    expect(state().returnQueueByContestant.size).toBe(0);
  });
});

describe('full live timing/audio routing', () => {
  it.each(['per_question', 'per_contestant'] as TimingMode[])(
    '%s uses its own timeout behavior and pauses countdown with the question',
    async (timingMode) => {
      vi.useFakeTimers();
      state().resetGame();
      const q = {
        ...question('open_answer'),
        time_limit: timingMode === 'per_question' ? 10 : null,
      };
      vi.stubGlobal('api', {
        quiz: {
          getById: vi
            .fn()
            .mockResolvedValue({ ...quiz, timing_mode: timingMode }),
        },
        contestant: {
          getByQuizId: vi.fn().mockResolvedValue([
            {
              id: 1,
              quiz_id: 1,
              display_order: 1,
              name: 'א',
              total_time_limit: timingMode === 'per_contestant' ? 30 : null,
            },
          ]),
        },
        question: {
          getByQuizId: vi
            .fn()
            .mockResolvedValue([q, question('open_answer', 2)]),
        },
      });
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
      await act(async () => {
        vi.advanceTimersByTime(0);
      });
      press('Enter');
      press('Enter');
      expect(playQuestionLoopSound).toHaveBeenLastCalledWith('countdown');
      advance(2000);
      press(' ');
      expect(stopQuestionLoopSound).toHaveBeenCalled();
      const label = screen.getByRole('timer').getAttribute('aria-label');
      advance(5000);
      expect(screen.getByRole('timer').getAttribute('aria-label')).toBe(label);
      press(' ');
      expect(playQuestionLoopSound).toHaveBeenLastCalledWith('countdown');
      press('?');
      advance(5000);
      expect(screen.getByRole('timer').getAttribute('aria-label')).toBe(label);
      press('Escape');
      fireEvent.click(screen.getByRole('button', { name: 'ביטול' }));
      advance(timingMode === 'per_question' ? 8000 : 28000);
      if (timingMode === 'per_question') {
        expect(state().gamePhase).toBe('showing_answer');
        expect(state().lastAnswerResult?.wasTimeout).toBe(true);
      } else {
        expect(state().gamePhase).toBe('playing');
        expect(screen.getByText('0:00')).toBeTruthy();
        expect(playQuestionLoopSound).not.toHaveBeenCalledWith('background');
        press('F1');
        expect(state().lastAnswerResult).toMatchObject({
          pointsAwarded: 0,
          isCorrect: true,
        });
      }
      expect(stopQuestionLoopSound).toHaveBeenCalled();
      const calls = vi.mocked(playQuestionLoopSound).mock.calls.length;
      advance(5000);
      expect(playQuestionLoopSound).toHaveBeenCalledTimes(calls);
    },
  );
});

it('creation defaults to per-question and submits the selected timing mode', async () => {
  const create = vi.fn().mockResolvedValue(undefined);
  render(<CreateQuizModal onClose={() => undefined} onCreate={create} />);
  const choices = screen.getAllByRole('radio') as HTMLInputElement[];
  expect(choices[0].checked).toBe(true);
  fireEvent.change(screen.getByLabelText('שם החידון'), {
    target: { value: 'חידון חדש' },
  });
  fireEvent.click(choices[1]);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'יצירת חידון' }));
  });
  expect(create).toHaveBeenCalledWith({
    name: 'חידון חדש',
    timingMode: 'per_contestant',
  });
});

it('total-time stepper uses only multiples of ten between 30 and 1200', () => {
  function Stepper() {
    const [value, setValue] = useState(30);
    return (
      <TimeLimitStepper scope="contestant" value={value} onChange={setValue} />
    );
  }
  render(<Stepper />);
  const minus = screen.getByRole('button', { name: 'הפחתת 10 שניות' });
  const plus = screen.getByRole('button', { name: 'הוספת 10 שניות' });
  expect(minus.hasAttribute('disabled')).toBe(true);
  fireEvent.click(plus);
  expect(screen.getByRole('status').textContent).toBe('40שניות');
  for (let i = 0; i < 116; i++) fireEvent.click(plus);
  expect(plus.hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('status').textContent).toBe('1200שניות');
  expect(normalizeContestantTimeLimit(37)).toBe(30);
  expect(normalizeContestantTimeLimit(1201)).toBe(1200);
  expect(isValidContestantTimeLimit(35)).toBe(false);
  expect(isValidContestantTimeLimit(20)).toBe(false);
  expect(isValidContestantTimeLimit(1210)).toBe(false);
});
