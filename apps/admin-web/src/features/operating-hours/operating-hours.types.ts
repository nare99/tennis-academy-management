export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type DayOfWeek = (typeof WEEK_DAYS)[number];

export type OperatingHour = {
  id: string;
  courtId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  createdAt: string;
  updatedAt: string;
};

export type OperatingHourInput = {
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
};

export type ReplaceOperatingHoursInput = {
  intervals: OperatingHourInput[];
};
