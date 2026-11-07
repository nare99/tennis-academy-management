
import {
  PricingDayType,
  PricingPeriod,
} from '@prisma/client';
import { BookingPricingService } from './booking-pricing.service';

describe('BookingPricingService', () => {
  let service: BookingPricingService;

  const rules = [
    {
      dayType: PricingDayType.WEEKDAY,
      period: PricingPeriod.OFF_PEAK,
      hourlyRateMinor: 1001,
      currency: 'AMD',
    },
    {
      dayType: PricingDayType.WEEKDAY,
      period: PricingPeriod.PEAK,
      hourlyRateMinor: 2000,
      currency: 'AMD',
    },
    {
      dayType: PricingDayType.WEEKEND,
      period: PricingPeriod.OFF_PEAK,
      hourlyRateMinor: 1200,
      currency: 'AMD',
    },
    {
      dayType: PricingDayType.WEEKEND,
      period: PricingPeriod.PEAK,
      hourlyRateMinor: 2400,
      currency: 'AMD',
    },
  ];

  beforeEach(() => {
    service = new BookingPricingService();
  });

  it('splits a booking at the peak start boundary', () => {
    // Tuesday 16:30–17:30 in Asia/Yerevan.
    const result = service.calculatePrice(
      new Date('2026-11-10T12:30:00.000Z'),
      new Date('2026-11-10T13:30:00.000Z'),
      'Asia/Yerevan',
      1020,
      1260,
      rules,
    );

    // (1001 × 30 + 2000 × 30) / 60 = 1500.5
    expect(result).toEqual({
      priceMinor: 1501,
      currency: 'AMD',
    });
  });

  it('splits a booking at midnight when the day type changes', () => {
    // Friday 23:00–Saturday 01:00 in Asia/Yerevan.
    const result = service.calculatePrice(
      new Date('2026-11-06T19:00:00.000Z'),
      new Date('2026-11-06T21:00:00.000Z'),
      'Asia/Yerevan',
      1020,
      1260,
      rules,
    );

    expect(result).toEqual({
      priceMinor: 2201,
      currency: 'AMD',
    });
  });

  it('splits at both peak boundaries', () => {
    // Tuesday 16:00–22:00 in Asia/Yerevan.
    const result = service.calculatePrice(
      new Date('2026-11-10T12:00:00.000Z'),
      new Date('2026-11-10T18:00:00.000Z'),
      'Asia/Yerevan',
      1020,
      1260,
      rules,
    );

    // 1h off-peak + 4h peak + 1h off-peak.
    expect(result).toEqual({
      priceMinor: 10002,
      currency: 'AMD',
    });
  });

  it('rejects incomplete pricing configuration', () => {
    expect(() =>
      service.calculatePrice(
        new Date('2026-11-10T12:00:00.000Z'),
        new Date('2026-11-10T13:00:00.000Z'),
        'Asia/Yerevan',
        1020,
        1260,
        rules.slice(0, 3),
      ),
    ).toThrow('exactly four complete pricing rules');
  });

  it('rejects different currencies across pricing rules', () => {
    const mixedCurrencyRules = rules.map((rule, index) =>
      index === 0 ? { ...rule, currency: 'USD' } : rule,
    );

    expect(() =>
      service.calculatePrice(
        new Date('2026-11-10T12:00:00.000Z'),
        new Date('2026-11-10T13:00:00.000Z'),
        'Asia/Yerevan',
        1020,
        1260,
        mixedCurrencyRules,
      ),
    ).toThrow('one currency');
  });
});
