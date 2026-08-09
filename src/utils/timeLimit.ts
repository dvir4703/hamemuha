export const TIME_LIMIT_MIN = 10;
export const TIME_LIMIT_MAX = 300;
export const TIME_LIMIT_STEP = 10;

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
