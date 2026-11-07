
export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const WEEKDAY_BY_INDEX = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export type LocalWeekday = (typeof WEEKDAY_BY_INDEX)[number];

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
}

export function getLocalDateTimeParts(
  date: Date,
  timeZone: string,
): LocalDateTimeParts {
  const values = getFormatter(timeZone).formatToParts(date);
  const parts = Object.fromEntries(
    values.map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function getLocalWeekday(
  parts: Pick<LocalDateTimeParts, 'year' | 'month' | 'day'>,
): LocalWeekday {
  const weekdayIndex = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();

  return WEEKDAY_BY_INDEX[weekdayIndex]!;
}

export function getLocalMinuteOfDay(
  parts: Pick<LocalDateTimeParts, 'hour' | 'minute'>,
): number {
  return parts.hour * 60 + parts.minute;
}

export function addLocalDays(
  date: Pick<LocalDateTimeParts, 'year' | 'month' | 'day'>,
  days: number,
): Pick<LocalDateTimeParts, 'year' | 'month' | 'day'> {
  const result = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days),
  );

  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

/**
 * Converts a local wall-clock time into an actual UTC instant.
 *
 * This is useful for finding local midnight and pricing boundaries.
 * It verifies the result instead of silently accepting a nonexistent
 * local time during a timezone transition.
 */
export function localDateTimeToUtc(
  date: Pick<LocalDateTimeParts, 'year' | 'month' | 'day'>,
  minuteOfDay: number,
  timeZone: string,
): Date {
  if (
    !Number.isInteger(minuteOfDay) ||
    minuteOfDay < 0 ||
    minuteOfDay > 1440
  ) {
    throw new RangeError('Invalid local minute of day.');
  }

  const targetDate =
    minuteOfDay === 1440
      ? addLocalDays(date, 1)
      : date;

  const targetMinute = minuteOfDay === 1440 ? 0 : minuteOfDay;

  const targetUtcRepresentation = Date.UTC(
    targetDate.year,
    targetDate.month - 1,
    targetDate.day,
    Math.floor(targetMinute / 60),
    targetMinute % 60,
  );

  let candidate = targetUtcRepresentation;

  // Resolve the timezone offset iteratively.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const local = getLocalDateTimeParts(new Date(candidate), timeZone);

    const representedAsUtc = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );

    const difference = targetUtcRepresentation - representedAsUtc;

    if (difference === 0) {
      return new Date(candidate);
    }

    candidate += difference;
  }

  const resolved = getLocalDateTimeParts(new Date(candidate), timeZone);

  if (
    resolved.year !== targetDate.year ||
    resolved.month !== targetDate.month ||
    resolved.day !== targetDate.day ||
    resolved.hour !== Math.floor(targetMinute / 60) ||
    resolved.minute !== targetMinute % 60 ||
    resolved.second !== 0
  ) {
    throw new RangeError(
      'The requested local time does not exist in the academy timezone.',
    );
  }

  return new Date(candidate);
}
