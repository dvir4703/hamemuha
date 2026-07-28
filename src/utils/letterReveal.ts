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

export function getUniqueRevealCharacters(answer: string): string[] {
  const uniqueCharacters = new Map<string, string>();

  for (const character of Array.from(answer)) {
    if (!SINGLE_LETTER_PATTERN.test(character)) continue;

    const normalizedCharacter = normalizeRevealCharacter(character);
    if (!uniqueCharacters.has(normalizedCharacter)) {
      uniqueCharacters.set(normalizedCharacter, character);
    }
  }

  return Array.from(uniqueCharacters.values());
}

export function getRevealCharacterPositions(
  answer: string,
  selectedCharacters: Iterable<string>,
): Set<number> {
  const normalizedSelections = new Set(
    Array.from(selectedCharacters, normalizeRevealCharacter).filter(Boolean),
  );

  return new Set(
    Array.from(answer)
      .map((character, index) => ({ character, index }))
      .filter(
        ({ character }) =>
          SINGLE_LETTER_PATTERN.test(character) &&
          normalizedSelections.has(normalizeRevealCharacter(character)),
      )
      .map(({ index }) => index),
  );
}
