
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  DayOfWeek,
  PricingDayType,
  PricingPeriod,
} from '@prisma/client';
import {
  addLocalDays,
  getLocalDateTimeParts,
  getLocalMinuteOfDay,
  getLocalWeekday,
  localDateTimeToUtc,
} from './booking-time.utils';

export interface BookingPricingRule {
  dayType: PricingDayType;
  period: PricingPeriod;
  hourlyRateMinor: number;
  currency: string;
}

export interface BookingPriceResult {
  priceMinor: number;
  currency: string;
}

const WEEKEND_DAYS = new Set<DayOfWeek>([
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
]);

@Injectable()
export class BookingPricingService {
  calculatePrice(
    startAt: Date,
    endAt: Date,
    timeZone: string,
    peakStartMinute: number,
    peakEndMinute: number,
    rules: BookingPricingRule[],
  ): BookingPriceResult {
    this.validateRules(rules);

    const ruleMap = new Map<string, BookingPricingRule>();

    for (const rule of rules) {
      ruleMap.set(`${rule.dayType}:${rule.period}`, rule);
    }

    const currencies = new Set(rules.map((rule) => rule.currency));

    if (currencies.size !== 1) {
      throw new InternalServerErrorException(
        'Court pricing rules must use one currency.',
      );
    }

    const firstRule = rules[0];

    if (!firstRule) {
      throw new InternalServerErrorException(
        'Court pricing rules are missing.',
      );
    }

    const currency = firstRule.currency;
    
    let weightedMinorMinutes = 0;
    let current = new Date(startAt);

    while (current.getTime() < endAt.getTime()) {
      const local = getLocalDateTimeParts(current, timeZone);
      const minuteOfDay = getLocalMinuteOfDay(local);
      const weekday = getLocalWeekday(local) as DayOfWeek;

      const dayType = WEEKEND_DAYS.has(weekday)
        ? PricingDayType.WEEKEND
        : PricingDayType.WEEKDAY;

      const period =
        minuteOfDay >= peakStartMinute &&
        minuteOfDay < peakEndMinute
          ? PricingPeriod.PEAK
          : PricingPeriod.OFF_PEAK;

      const rule = ruleMap.get(`${dayType}:${period}`);

      if (!rule) {
        throw new InternalServerErrorException(
          `Missing pricing rule: ${dayType}/${period}.`,
        );
      }

      const nextBoundary = this.findNextBoundary(
        current,
        local,
        minuteOfDay,
        timeZone,
        peakStartMinute,
        peakEndMinute,
      );

      const segmentEnd =
        nextBoundary.getTime() < endAt.getTime()
          ? nextBoundary
          : endAt;

      const durationMinutes =
        (segmentEnd.getTime() - current.getTime()) / 60_000;

      if (
        durationMinutes <= 0 ||
        !Number.isInteger(durationMinutes)
      ) {
        throw new InternalServerErrorException(
          'Could not split the booking into valid pricing segments.',
        );
      }

      weightedMinorMinutes +=
        rule.hourlyRateMinor * durationMinutes;

      current = segmentEnd;
    }

    // Round exactly once, after adding all segment costs.
    const priceMinor = Math.round(weightedMinorMinutes / 60);

    return {
      priceMinor,
      currency,
    };
  }

  private findNextBoundary(
    current: Date,
    local: ReturnType<typeof getLocalDateTimeParts>,
    minuteOfDay: number,
    timeZone: string,
    peakStartMinute: number,
    peakEndMinute: number,
  ): Date {
    const candidates: Date[] = [];

    if (peakStartMinute > minuteOfDay) {
      candidates.push(
        localDateTimeToUtc(local, peakStartMinute, timeZone),
      );
    }

    if (peakEndMinute > minuteOfDay) {
      candidates.push(
        localDateTimeToUtc(local, peakEndMinute, timeZone),
      );
    }

    const nextDay = addLocalDays(local, 1);

    candidates.push(
      localDateTimeToUtc(nextDay, 0, timeZone),
    );

    const futureCandidates = candidates
      .filter((candidate) => candidate.getTime() > current.getTime())
      .sort((a, b) => a.getTime() - b.getTime());

    const result = futureCandidates[0];

    if (!result) {
      throw new InternalServerErrorException(
        'Could not determine the next pricing boundary.',
      );
    }

    return result;
  }

  private validateRules(rules: BookingPricingRule[]): void {
    const expected = [
      'WEEKDAY:OFF_PEAK',
      'WEEKDAY:PEAK',
      'WEEKEND:OFF_PEAK',
      'WEEKEND:PEAK',
    ];

    const actual = rules.map(
      (rule) => `${rule.dayType}:${rule.period}`,
    );

    if (
      rules.length !== 4 ||
      new Set(actual).size !== 4 ||
      expected.some((key) => !actual.includes(key))
    ) {
      throw new InternalServerErrorException(
        'The court must have exactly four complete pricing rules.',
      );
    }

    if (
      rules.some(
        (rule) =>
          !Number.isSafeInteger(rule.hourlyRateMinor) ||
          rule.hourlyRateMinor < 0,
      )
    ) {
      throw new InternalServerErrorException(
        'Court pricing contains an invalid hourly rate.',
      );
    }
  }
}
