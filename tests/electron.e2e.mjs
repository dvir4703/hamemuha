import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { _electron, expect } from '@playwright/test';

const temporary = mkdtempSync(join(tmpdir(), 'hamemuha-live-test-'));
const artifactDir = resolve('test-results/live');
mkdirSync(artifactDir, { recursive: true });
const databasePath = join(temporary, 'hamemuha.sqlite3');
const db = new DatabaseSync(databasePath);
db.exec(readFileSync('electron/database/migrations/001_initial.sql', 'utf8'));
db.prepare('INSERT INTO quizzes (id, name) VALUES (1, ?)').run('בדיקת לייב');
db.prepare(
  'INSERT INTO contestants (id, quiz_id, name, display_order) VALUES (1, 1, ?, 1)',
).run('מתמודד בדיקה');
const types = [
  'multiple_choice',
  'true_false',
  'complete_sentence',
  'open_answer',
  'multiple_options',
  'association_hints',
];
for (const [index, type] of types.entries()) {
  const id = index + 1;
  db.prepare(
    'INSERT INTO questions (id, quiz_id, contestant_id, question_type, question_text, correct_answer_text, points, time_limit, display_order) VALUES (?, 1, 1, ?, ?, ?, 10, ?, ?)',
  ).run(
    id,
    type,
    `שאלה ${id} — ${type}`,
    'אב גד',
    type === 'true_false' ? 30 : null,
    id,
  );
  if (![3, 4].includes(id)) {
    const count = id === 2 ? 2 : 6;
    for (let option = 0; option < count; option++) {
      const text =
        id === 2 ? ['נכון', 'לא נכון'][option] : `אפשרות ${option + 1}`;
      db.prepare(
        'INSERT INTO answers (question_id, answer_text, is_correct, display_order) VALUES (?, ?, ?, ?)',
      ).run(
        id,
        text,
        option === 0 || (id !== 2 && option === 1) ? 1 : 0,
        option + 1,
      );
    }
  }
}
db.prepare(
  "INSERT INTO hints (question_id, hint_type, hint_text, hint_order, points_penalty) VALUES (3, 'letter_reveal', '1', 1, 2)",
).run();
db.prepare(
  "INSERT INTO hints (question_id, hint_type, hint_text, hint_order, points_penalty) VALUES (6, 'text', 'רמז מדורג ישן', 1, 8)",
).run();
db.close();
const launcher = join(temporary, 'launcher.cjs');
writeFileSync(
  launcher,
  `const { app } = require('electron');\napp.setPath('userData', ${JSON.stringify(temporary)});\nrequire(${JSON.stringify(resolve('dist-electron/main.js'))});\n`,
);
let app;
const errors = [];
try {
  app = await _electron.launch({
    args: [launcher],
    timeout: 20000,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '' },
  });
  const page = await app.firstWindow();
  page.setDefaultTimeout(10000);
  const screenshot = async (name) => {
    await page.waitForTimeout(1200);
    const png = await app.evaluate(async ({ BrowserWindow }) => {
      const image = await BrowserWindow.getAllWindows()[0].capturePage();
      return image.toPNG().toString('base64');
    });
    writeFileSync(join(artifactDir, name), Buffer.from(png, 'base64'));
  };
  page.on('pageerror', (error) => errors.push(error.message));
  await page.waitForFunction(() => Boolean(window.api));
  const migrated = await page.evaluate(() => window.api.question.getById(3));
  assert.equal(migrated.prerevealed_positions, '[]');
  assert.equal(
    (await page.evaluate(() => window.api.question.getById(6))).hints.length,
    1,
  );
  console.log(
    'PASS: legacy database migrated without deleting association hints',
  );

  // Exercise the real editor -> preload IPC -> SQLite -> edit hydration boundary.
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/3/edit';
  });
  await expect(page.getByLabel('המילה או הביטוי החסרים')).toHaveValue('אב גד');
  await page
    .getByRole('group', { name: 'בחירת אותיות גלויות מראש' })
    .getByRole('button', { name: 'א, מיקום 1', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'בחירת מיקומי אותיות לרמז 1' })
    .getByRole('button', { name: 'ג, מיקום 4', exact: true })
    .click();
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  const saved = await page.evaluate(() => window.api.question.getById(3));
  assert.equal(saved.prerevealed_positions, '[0]');
  assert.equal(saved.hints[0].hint_text, '[1,3]');
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/3/edit';
  });
  await expect(
    page
      .getByRole('group', { name: 'בחירת אותיות גלויות מראש' })
      .getByRole('button', { name: 'א, מיקום 1', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  console.log('PASS: editor multi-letter hint/prerevealed save and hydration');

  // All three copy paths must carry the new field.
  const copies = await page.evaluate(async () => {
    const q = await window.api.question.duplicate(3);
    await window.api.question.delete(q.id);
    const contestant = await window.api.contestant.duplicate(1);
    const contestantQuestions = await window.api.question.getByQuizId(1);
    const cq = contestantQuestions.find(
      (item) =>
        item.contestant_id === contestant.id &&
        item.question_type === 'complete_sentence',
    );
    await window.api.contestant.delete(contestant.id);
    const quiz = await window.api.quiz.duplicate(1);
    const quizQuestions = await window.api.question.getByQuizId(quiz.id);
    const qq = quizQuestions.find(
      (item) => item.question_type === 'complete_sentence',
    );
    await window.api.quiz.delete(quiz.id);
    return [
      q.prerevealed_positions,
      cq?.prerevealed_positions,
      qq?.prerevealed_positions,
    ];
  });
  assert.deepEqual(copies, ['[0]', '[0]', '[0]']);
  await page.evaluate(() => {
    location.hash = '/quizzes/1/questions/6/edit';
  });
  await expect(page.getByRole('button', { name: 'שמירת שאלה' })).toBeVisible();
  await expect(page.getByRole('combobox').first()).toHaveValue(
    'association_hints',
  );
  await expect(page.getByText('הוספת רמז', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'שמירת שאלה' }).click();
  await page.waitForURL('**#/quizzes/1/edit');
  assert.equal(
    (await page.evaluate(() => window.api.question.getById(6))).hints.length,
    1,
  );
  console.log(
    'PASS: question/contestant/quiz duplication and legacy type-6 edit',
  );

  await page.evaluate(() => {
    window.__audioStarts = [];
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__audioStarts.push({
        args,
        loopEnd: this.loopEnd,
        bufferDuration: this.buffer?.duration,
      });
      return original.apply(this, args);
    };
    location.hash = '/quiz/1/live';
  });
  await expect(page.locator('.live-opening')).toBeVisible();
  await page.keyboard.press('Enter');
  const video = page.locator('video');
  await expect(video).toBeVisible();
  await video.evaluate((element) => {
    element.pause();
    element.dispatchEvent(new Event('ended'));
  });
  await expect(page.locator('.live-answer-tile')).toHaveCount(6, {
    timeout: 2000,
  });
  await page.waitForFunction(
    () =>
      window.__audioStarts.some(
        (sound) => sound.loopEnd > 50 && sound.loopEnd < 60,
      ),
    undefined,
    { timeout: 3000 },
  );
  await page.keyboard.press('F1');
  await page.keyboard.press('F2');
  await expect(page.locator('.live-answer-tile')).toHaveCount(6);
  await page.keyboard.press('F4');
  await expect(page.locator('.live-answer-tile')).toHaveCount(4);
  await expect(page.getByText('5 נקודות', { exact: true })).toBeVisible();
  await page.keyboard.press('F4');
  await expect(page.locator('.live-answer-tile')).toHaveCount(4);
  await screenshot('type-1-fifty-fifty.png');
  for (const name of ['אפשרות 1', 'אפשרות 2'])
    await page.getByRole('button', { name: new RegExp(name) }).click();
  assert.equal(await page.getByRole('button', { name: /הגש|הגשת/ }).count(), 0);
  await page.keyboard.press('Enter');
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  assert.equal(await page.locator('.live-feedback__progress').count(), 0);
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-answer-tile')).toHaveCount(2, {
    timeout: 2000,
  });
  await page.waitForFunction(
    () => window.__audioStarts.some((sound) => sound.loopEnd === 10),
    undefined,
    { timeout: 3000 },
  );
  await page.getByRole('button', { name: 'נכון', exact: true }).click();
  await page.keyboard.press('Enter');
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  console.log(
    'PASS: types 1/2, real function keys, manual feedback and immediate background/countdown Web Audio',
  );

  await expect(
    page.getByRole('group', { name: 'תיבות התשובה — מענה בעל פה' }),
  ).toBeInViewport();
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(1);
  assert.equal(await page.locator('input').count(), 0);
  await page.keyboard.press('Enter');
  await page.keyboard.type('abc');
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(1);
  await page.keyboard.press('F4');
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(3);
  await screenshot('type-3-hint.png');
  await page.keyboard.press('F1');
  await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
  await expect(page.locator('[data-revealed="true"]')).toHaveCount(4);
  await screenshot('type-3-correct.png');
  // Revisit via the contestant shortcut, which is intentionally retained.
  await page.keyboard.press('1');
  await expect(page.locator('.live-letter-board')).toBeVisible();
  await page.keyboard.press('F2');
  await expect(page.getByText('אב גד', { exact: true })).toBeVisible();
  await page.waitForTimeout(6200);
  await expect(page.getByText('אב גד', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-question--open-answer')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('.live-question--open-answer')).toBeVisible();
  await page.keyboard.press('F2');
  await expect(page.getByText('אב גד', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');
  console.log(
    'PASS: types 3/4 oral judging, multi-letter hint, filled celebration and full wrong answer',
  );

  for (const type of ['multiple-options', 'association']) {
    await expect(page.locator(`.live-question--${type}`)).toBeVisible();
    await expect(page.locator('.live-answer-tile')).toHaveCount(6);
    await page.keyboard.press('F4');
    await page.keyboard.press('F1');
    await page.keyboard.press('F2');
    await expect(page.locator('.live-answer-tile')).toHaveCount(6);
    await expect(page.getByText('10 נקודות', { exact: true })).toBeVisible();
    assert.equal(await page.getByText('רמז מדורג ישן').count(), 0);
    if (type === 'association') await screenshot('type-6-association.png');
    for (const name of ['אפשרות 1', 'אפשרות 2'])
      await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.keyboard.press('Enter');
    await expect(page.getByText('תשובה נכונה!', { exact: true })).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.live-scoreboard')).toBeVisible();
  const results = new DatabaseSync(databasePath);
  const savedStats = results
    .prepare('SELECT * FROM contestant_results ORDER BY id DESC LIMIT 1')
    .get();
  assert.equal(savedStats.total_score, 35);
  assert.equal(savedStats.correct_count, 4);
  assert.equal(savedStats.wrong_count, 2);
  results.close();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: types 5/6, scoreboard and persisted results; no renderer errors',
  );
  await app.close();
  app = undefined;
  // Opening the same migrated database again must not ALTER it a second time.
  app = await _electron.launch({
    args: [launcher],
    timeout: 20000,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '' },
  });
  const reopened = await app.firstWindow();
  assert.equal(
    (await reopened.evaluate(() => window.api.question.getById(3)))
      .prerevealed_positions,
    '[0]',
  );
  console.log('PASS: migration is idempotent on restart');
} finally {
  if (app) await app.close();
  rmSync(temporary, { recursive: true, force: true });
}
