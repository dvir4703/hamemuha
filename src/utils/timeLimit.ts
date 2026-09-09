export const TIME_LIMIT_MIN = 10;
export const TIME_LIMIT_MAX = 300;
export const TIME_LIMIT_STEP = 10;
export const CONTESTANT_TIME_MIN = 30;
export const CONTESTANT_TIME_MAX = 1200;
export const CONTESTANT_TIME_DEFAULT = 120;

export function normalizeContestantTimeLimit(value: number): number {
  if (!Number.isFinite(value)) return CONTESTANT_TIME_DEFAULT;
  return Math.min(
    CONTESTANT_TIME_MAX,
    Math.max(
      CONTESTANT_TIME_MIN,
      Math.floor(value / TIME_LIMIT_STEP) * TIME_LIMIT_STEP,
    ),
  );
}

export function isValidContestantTimeLimit(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= CONTESTANT_TIME_MIN &&
    value <= CONTESTANT_TIME_MAX &&
    value % TIME_LIMIT_STEP === 0
  );
}

export function formatContestantTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function normalizeTimeLimit(value: number): number {
  if (!Number.isFinite(value)) return 30;
  const roundedDown = Math.floor(value / TIME_LIMIT_STEP) * TIME_LIMIT_STEP;
  return Math.min(TIME_LIMIT_MAX, Math.max(TIME_LIMIT_MIN, roundedDown));
}

export function isValidTimeLimit(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= TIME_LIMIT_MIN &&
    value <= TIME_LIMIT_MAX &&
    value % TIME_LIMIT_STEP === 0
  );
}
