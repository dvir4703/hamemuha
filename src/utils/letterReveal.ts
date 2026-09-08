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

// JSON array of zero-based Array.from(answer.trim()) indexes, including spaces.
// A legacy numeric string (e.g. "3") still denotes one position.
export function parseRevealPositions(
  value: string | null | undefined,
): number[] {
  if (!value?.trim()) return [];
  const single = parseRevealPosition(value);
  if (single !== null) return [single];
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (item: unknown) =>
          typeof item === 'number' && Number.isSafeInteger(item) && item >= 0,
      )
    )
      return [];
    return [...new Set(parsed as number[])].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function serializeRevealPositions(positions: number[]): string {
  return JSON.stringify([...new Set(positions)].sort((a, b) => a - b));
}

export function resolveLetterHintPositions(
  answer: string,
  hints: Array<string | null>,
): number[][] {
  const characters = Array.from(answer.trim());
  const available = getRevealablePositions(answer);
  const used = new Set<number>();
  return hints.map((text) => {
    const positions = parseRevealPositions(text).filter((position) =>
      available.includes(position),
    );
    // Older questions stored an actual letter. Repeated letters resolve in order.
    if (positions.length === 0 && isSingleRevealCharacter(text ?? '')) {
      const position = available.find(
        (index) =>
          !used.has(index) &&
          normalizeRevealCharacter(characters[index]) ===
            normalizeRevealCharacter(text!.trim()),
      );
      if (position !== undefined) positions.push(position);
    }
    positions.forEach((position) => used.add(position));
    return positions;
  });
}
