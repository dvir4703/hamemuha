const SINGLE_LETTER_PATTERN = /^\p{L}$/u;

export function normalizeRevealCharacter(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('he-IL');
}

export function isSingleRevealCharacter(value: string): boolean {
  const trimmedValue = value.trim();
  return (
    Array.from(trimmedValue.normalize('NFC')).length === 1 &&
    SINGLE_LETTER_PATTERN.test(trimmedValue)
  );
}

export function getRevealablePositions(answer: string): number[] {
  return Array.from(answer.trim())
    .map((character, position) => ({ character, position }))
    .filter(({ character }) => !/\s/u.test(character))
    .map(({ position }) => position);
}

export function parseRevealPosition(
  value: string | null | undefined,
): number | null {
  const normalizedValue = value?.trim() ?? '';
  if (!/^(0|[1-9]\d*)$/u.test(normalizedValue)) return null;

  const position = Number(normalizedValue);
  return Number.isSafeInteger(position) ? position : null;
}
