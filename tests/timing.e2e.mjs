import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { _electron, expect } from '@playwright/test';

// All UI, IPC, audio and SQLite checks use an isolated profile, removed in finally.
const temporary = mkdtempSync(join(tmpdir(), 'hamemuha-timing-test-'));
const artifactDir = resolve('test-results/timing');
mkdirSync(artifactDir, { recursive: true });
const launcher = join(temporary, 'launcher.cjs');
writeFileSync(
  launcher,
  `const { app } = require('electron');\napp.setPath('userData', ${JSON.stringify(temporary)});\nrequire(${JSON.stringify(resolve('dist-electron/main.js'))});\n`,
);
let app;
let db;
try {
  app = await _electron.launch({
    args: [launcher],
    timeout: 20000,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '' },
  });
  const page = await app.firstWindow();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.waitForFunction(() => Boolean(window.api));
  const go = (hash) =>
    page.evaluate((target) => {
      location.hash = target;
    }, hash);
  const screenshot = async (name) => {
    await app.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.show();
      window.focus();
      window.webContents.focus();
    });
    await page.waitForTimeout(350);
    const png = await app.evaluate(async ({ BrowserWindow }) => {
      const image = await Promise.race([
        BrowserWindow.getAllWindows()[0].capturePage(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Screenshot timeout')), 8000),
        ),
      ]);
      return image.toPNG().toString('base64');
    });
    writeFileSync(join(artifactDir, name), Buffer.from(png, 'base64'));
  };
  const createQuiz = async (name, total) => {
    await go('/');
    await page.getByRole('button', { name: 'חידון חדש', exact: true }).click();
    await expect(
      page.getByRole('radio', { name: /זמן לכל שאלה בנפרד/ }),
    ).toBeChecked();
    if (total)
      await page.getByRole('radio', { name: /זמן כולל לכל מתמודד/ }).check();
    await page.getByLabel('שם החידון', { exact: true }).fill(name);
    if (total) await screenshot('creation.png');
    await page
      .getByRole('button', { name: 'יצירת חידון', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    return page.evaluate(
      async (name) =>
        (await window.api.quiz.getAll()).find((q) => q.name === name),
      name,
    );
  };
  const perQuestion = await createQuiz('בדיקת זמן לכל שאלה', false);
  const perContestant = await createQuiz('בדיקת זמן כולל', true);
  assert.equal(perQuestion.timing_mode, 'per_question');
  assert.equal(perContestant.timing_mode, 'per_contestant');
  await go(`/quizzes/${perContestant.id}/edit`);
  await page
    .getByRole('button', { name: 'הוספת מתמודד', exact: true })
    .first()
    .click();
  await page.getByPlaceholder('שם המתמודד', { exact: true }).fill('אלון');
  await expect(
    page.getByRole('status').filter({ hasText: '120' }),
  ).toBeVisible();
  for (let i = 0; i < 9; i++)
    await page.getByRole('button', { name: 'הפחתת 10 שניות' }).click();
  await expect(
    page.getByRole('button', { name: 'הפחתת 10 שניות' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'הוספה', exact: true }).click();
  await expect(
    page.getByText('זמן כולל:', { exact: false }).filter({ hasText: '0:30' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'שם וזמן כולל' }).click();
  await page.getByRole('button', { name: 'הוספת 10 שניות' }).click();
  await page.getByRole('button', { name: 'שמירה', exact: true }).click();
  await page.reload();
  await expect(
    page.getByText('זמן כולל:', { exact: false }).filter({ hasText: '0:40' }),
  ).toBeVisible();
  await screenshot('contestants.png');
  const data = await page.evaluate(
    async ({ totalId, questionId }) => {
      const api = window.api;
      const [a] = await api.contestant.getByQuizId(totalId);
      await api.contestant.update(a.id, {
        name: a.name,
        displayOrder: 1,
        totalTimeLimit: 30,
      });
      const b = await api.contestant.create({
        quizId: totalId,
        name: 'ברק',
        displayOrder: 2,
        totalTimeLimit: 60,
      });
      const p = await api.contestant.create({
        quizId: questionId,
        name: 'פר שאלה',
        displayOrder: 1,
      });
      const make = async (quizId, contestantId, number, timeLimit) =>
        api.question.create({
          quizId,
          contestantId,
          questionType: 'open_answer',
          questionText: `שאלת תזמון ${number}`,
          correctAnswerText: 'תשובה',
          points: 10,
          timeLimit,
          displayOrder: number,
          shuffleAnswers: false,
          answers: [],
          hints: [],
        });
      const aQuestions = [];
      for (let i = 1; i <= 3; i++)
        aQuestions.push(await make(totalId, a.id, i, 30));
      await make(totalId, b.id, 1, null);
      const pTimed = await make(questionId, p.id, 1, 30);
      await make(questionId, p.id, 2, null);
      return { a, b, p, aQuestions, pTimed };
    },
    { totalId: perContestant.id, questionId: perQuestion.id },
  );
  assert(data.aQuestions.every((q) => q.time_limit === null));
  assert.equal(data.pTimed.time_limit, 30);
  assert.equal(data.p.total_time_limit, null);
  await go(
    `/quizzes/${perContestant.id}/questions/new?contestantId=${data.a.id}`,
  );
  await expect(page.getByLabel('טקסט השאלה', { exact: true })).toBeVisible();
  await expect(page.getByText('זמן מענה', { exact: true })).toHaveCount(0);
  await go(
    `/quizzes/${perContestant.id}/questions/${data.aQuestions[0].id}/edit`,
  );
  await expect(page.getByLabel('טקסט השאלה', { exact: true })).toHaveValue(
    'שאלת תזמון 1',
  );
  await expect(page.getByText('זמן מענה', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await expect(
    page.getByRole('button', { name: 'שם וזמן כולל' }),
  ).toBeVisible();
  await expect(
    page.locator('article').getByText('ללא הגבלת זמן', { exact: true }),
  ).toHaveCount(0);
  await go(`/quizzes/${perQuestion.id}/questions/${data.pTimed.id}/edit`);
  await expect(page.getByText('זמן מענה', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'הוספת 10 שניות' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await expect(
    page.getByRole('button', { name: 'שינוי שם', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('article').getByText('ללא הגבלת זמן', { exact: true }),
  ).toHaveCount(1);
  console.log(
    'PASS: both creation choices; total stepper create/edit/reload; question-time UI hidden only in total mode; question saves in both modes',
  );

  const integrity = await page.evaluate(
    async ({ quiz, a }) => {
      const invalid = [];
      for (const value of [20, 35, 1210, null]) {
        try {
          await window.api.contestant.update(a.id, {
            name: a.name,
            displayOrder: 1,
            totalTimeLimit: value,
          });
          invalid.push(false);
        } catch {
          invalid.push(true);
        }
      }
      const locked = await window.api.quiz.update(quiz.id, {
        name: quiz.name,
        timingMode: 'per_question',
      });
      const copy = await window.api.quiz.duplicate(quiz.id);
      const contestants = await window.api.contestant.getByQuizId(copy.id);
      const contestantCopy = await window.api.contestant.duplicate(a.id);
      await window.api.contestant.delete(contestantCopy.id);
      await window.api.quiz.delete(copy.id);
      return { invalid, locked, copy, contestants, contestantCopy };
    },
    { quiz: perContestant, a: data.a },
  );
  assert(integrity.invalid.every(Boolean));
  assert.equal(integrity.locked.timing_mode, 'per_contestant');
  assert.equal(integrity.copy.timing_mode, 'per_contestant');
  assert.deepEqual(
    integrity.contestants.map((c) => c.total_time_limit),
    [30, 60],
  );
  assert.equal(integrity.contestantCopy.total_time_limit, 30);
  db = new DatabaseSync(join(temporary, 'hamemuha.sqlite3'));
  assert.throws(() =>
    db
      .prepare("UPDATE quizzes SET timing_mode = 'per_question' WHERE id = ?")
      .run(perContestant.id),
  );
  assert.throws(() =>
    db
      .prepare('UPDATE contestants SET total_time_limit = 35 WHERE id = ?')
      .run(data.a.id),
  );
  assert.throws(() =>
    db
      .prepare('UPDATE questions SET time_limit = 30 WHERE id = ?')
      .run(data.aQuestions[0].id),
  );
  console.log(
    'PASS: DAL validation, SQL constraints, locked mode and deep-copy budgets',
  );

  // Capture native animation/compositor frames before installing the virtual clock.
  await go(`/quiz/${perContestant.id}/live`);
  await expect(page.locator('.live-opening')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-intro-video__media')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('timer')).toBeVisible();
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await screenshot('total-timer.png');
  if (process.env.TIMING_VISUAL_QA === '1') {
    await expect(page.getByRole('timer')).toHaveAttribute(
      'data-expired',
      'true',
      { timeout: 32000 },
    );
    await screenshot('time-expired.png');
  }
  await go(`/quizzes/${perContestant.id}/edit`);
  await expect(
    page.getByRole('button', { name: 'שם וזמן כולל' }),
  ).toBeVisible();
  console.log(
    'PASS: native live/help UI; screenshots captured without virtual animation timing',
  );

  // Browser clock controls real renderer timers; Web Audio itself remains native.
  await page.clock.install();
  await page.evaluate(() => {
    window.__loopSources = [];
    const start = AudioBufferSourceNode.prototype.start;
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.loop)
        window.__loopSources.push({
          node: this,
          duration: this.loopEnd,
          stopped: false,
        });
      return start.apply(this, args);
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      const source = window.__loopSources.find(
        (source) => source.node === this,
      );
      if (source) source.stopped = true;
      return stop.apply(this, args);
    };
  });
  const activeLoops = () =>
    page.evaluate(() =>
      window.__loopSources.filter((s) => !s.stopped).map((s) => s.duration),
    );
  const startLive = async (quizId) => {
    await go(`/quiz/${quizId}/live`);
    await expect(page.locator('.live-opening')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('.live-intro-video__media')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('timer')).toBeVisible();
  };
  const remaining = async () => {
    await expect(page.getByRole('timer')).toHaveCount(1);
    return Number(
      (await page.getByRole('timer').getAttribute('aria-label')).match(
        /\d+/,
      )[0],
    );
  };
  const advance = (milliseconds) => page.clock.runFor(milliseconds);
  await startLive(perContestant.id);
  await expect(page.getByRole('timer')).toHaveAttribute(
    'data-scope',
    'contestant',
  );
  await expect.poll(activeLoops).toEqual([10]);
  await advance(2100);
  await page.keyboard.press('Space');
  const paused = await remaining();
  await expect.poll(activeLoops).toEqual([]);
  await advance(10000);
  assert.equal(await remaining(), paused);
  await page.keyboard.press('Space');
  await expect.poll(activeLoops).toEqual([10]);
  await page.keyboard.press('?');
  const help = await remaining();
  await advance(10000);
  assert.equal(await remaining(), help);
  await expect.poll(activeLoops).toEqual([]);
  await page.keyboard.press('Escape');
  await page.keyboard.press('F1');
  await expect(page.locator('.live-feedback')).toBeVisible();
  await expect.poll(activeLoops).toEqual([]);
  await advance(20000);
  await page.keyboard.press('Enter');
  assert(Math.abs((await remaining()) - help) <= 1);
  await page.keyboard.press('2');
  await advance(3100);
  await page.keyboard.press('1');
  assert(Math.abs((await remaining()) - help) <= 1);
  await advance(1000);
  const bounds = await page.getByRole('timer').boundingBox();
  const viewport = await page.evaluate(() => ({
    w: innerWidth,
    h: innerHeight,
  }));
  assert(Math.abs(bounds.x + bounds.width / 2 - viewport.w / 2) < 3);
  assert(bounds.y > viewport.h * 0.75);
  await advance(31000);
  await expect(page.getByRole('timer')).toHaveAttribute('data-expired', 'true');
  await expect(page.getByText('0:00', { exact: true })).toBeVisible();
  await expect.poll(activeLoops).toEqual([]);
  await expect(page.locator('.live-feedback')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('שאלת תזמון 2', { exact: true })).toBeVisible();
  await page.keyboard.press('F1');
  await expect(page.locator('.live-feedback')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText('הזמן הכולל הסתיים — כל הכבוד על ההשתתפות!', {
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('timer')).toHaveCount(0);
  await page.keyboard.press('2');
  assert((await remaining()) >= 56 && (await remaining()) <= 57);
  await page.keyboard.press('F2');
  await expect.poll(activeLoops).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-scoreboard')).toBeVisible();
  await expect
    .poll(
      () =>
        db
          .prepare(
            'SELECT COUNT(*) AS count FROM game_results WHERE quiz_id = ?',
          )
          .get(perContestant.id).count,
    )
    .toBe(1);
  const totals = db
    .prepare(
      'SELECT contestant_id, total_score, correct_count, wrong_count FROM contestant_results ORDER BY contestant_id',
    )
    .all();
  assert.deepEqual(
    totals.map((r) => ({ ...r })),
    [
      {
        contestant_id: data.a.id,
        total_score: 10,
        correct_count: 2,
        wrong_count: 0,
      },
      {
        contestant_id: data.b.id,
        total_score: 0,
        correct_count: 0,
        wrong_count: 1,
      },
    ],
  );
  assert(
    await page.evaluate(() =>
      window.__loopSources.every((s) => s.duration === 10),
    ),
  );
  console.log(
    'PASS: native countdown stop/resume; total budget pause/help/feedback/switch; center-bottom medal; manual zero-point answer after expiration; independent contestant; scoreboard excludes unreached question',
  );

  await startLive(perQuestion.id);
  await expect(page.getByRole('timer')).toHaveAttribute(
    'data-scope',
    'question',
  );
  await expect.poll(activeLoops).toEqual([10]);
  await advance(31000);
  await expect(page.locator('.live-feedback')).toBeVisible();
  await expect.poll(activeLoops).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('timer')).toHaveCount(0);
  await expect
    .poll(async () => (await activeLoops()).some((duration) => duration > 50))
    .toBe(true);
  await page.keyboard.press('F1');
  await expect.poll(activeLoops).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-scoreboard')).toBeVisible();
  await expect
    .poll(
      () =>
        db
          .prepare(
            'SELECT COUNT(*) AS count FROM game_results WHERE quiz_id = ?',
          )
          .get(perQuestion.id).count,
    )
    .toBe(1);
  const result = db
    .prepare(
      'SELECT total_score, correct_count, wrong_count FROM contestant_results WHERE contestant_id = ?',
    )
    .get(data.p.id);
  assert.deepEqual(
    { ...result },
    { total_score: 10, correct_count: 1, wrong_count: 1 },
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: per-question auto-timeout, untimed background audio, scoreboard and persisted stats; no renderer errors',
  );
} finally {
  db?.close();
  if (app) await app.close();
  rmSync(temporary, { recursive: true, force: true });
}
