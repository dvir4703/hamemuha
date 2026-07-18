import type { ContestantLiveStats } from '../store/liveStore';
import type { Contestant } from '../types';

export interface ScoreboardEntry {
  contestant: Contestant;
  score: number;
  correct: number;
  wrong: number;
  answered: number;
  successRate: number;
  rank: number;
}

export function buildScoreboardEntries(
  contestants: Contestant[],
  scoresByContestant: Map<number, number>,
  statsByContestant: Map<number, ContestantLiveStats>,
): ScoreboardEntry[] {
  return contestants
    .map((contestant) => {
      const stats = statsByContestant.get(contestant.id) ?? {
        correct: 0,
        wrong: 0,
        hintsUsed: 0,
      };
      const answered = stats.correct + stats.wrong;
      return {
        contestant,
        score: scoresByContestant.get(contestant.id) ?? 0,
        correct: stats.correct,
        wrong: stats.wrong,
        answered,
        successRate:
          answered === 0 ? 0 : Math.round((stats.correct / answered) * 100),
      };
    })
    .sort(
      (first, second) =>
        second.score - first.score ||
        second.successRate - first.successRate ||
        second.correct - first.correct ||
        first.contestant.display_order - second.contestant.display_order ||
        first.contestant.id - second.contestant.id,
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function calculateAverageSuccessRate(
  entries: ScoreboardEntry[],
): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, entry) => sum + entry.successRate, 0);
  return Math.round(total / entries.length);
}

export function getCelebrationMessage(
  averageSuccessRate: number,
  audienceName?: string,
): string {
  const prefix = audienceName?.trim() ? `${audienceName.trim()}, ` : '';

  if (averageSuccessRate > 80) {
    return `${prefix}מדהימים! הפגנתם ידע מרשים!`;
  }
  if (averageSuccessRate >= 50) {
    return `${prefix}כל הכבוד, הפגנתם ידע יפה!`;
  }
  return `${prefix}שיחקתם יפה! בפעם הבאה תדעו עוד יותר!`;
}

export function createScoreboardFileName(
  quizName: string,
  date = new Date(),
): string {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const safeQuizName = quizName
    .trim()
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${safeQuizName || 'החידון'}-תוצאות-${datePart}.png`;
}
