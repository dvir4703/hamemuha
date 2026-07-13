const relativeTime = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });

function parseSqliteDate(value: string): Date {
  if (value.includes('T')) {
    return new Date(value);
  }

  return new Date(`${value.replace(' ', 'T')}Z`);
}

export function formatRelativeDate(value: string): string {
  const date = parseSqliteDate(value);
  const differenceInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(differenceInSeconds);

  if (absoluteSeconds < 60) {
    return 'עודכן עכשיו';
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (absoluteSeconds >= secondsInUnit) {
      const valueInUnit = Math.round(differenceInSeconds / secondsInUnit);
      return `עודכן ${relativeTime.format(valueInUnit, unit)}`;
    }
  }

  return 'עודכן עכשיו';
}
