import type { DayOfWeek, OperatingHourInput } from '../operating-hours.types';
import { WEEK_DAYS } from '../operating-hours.types';

type WeeklyScheduleEditorProps = {
  intervals: OperatingHourInput[];
  onChange: (intervals: OperatingHourInput[]) => void;
  disabled?: boolean;
};

const dayLabels: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

function toTime(value: number): string {
  const hours = Math.floor(value / 60).toString().padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function fromTime(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function WeeklyScheduleEditor({
  intervals,
  onChange,
  disabled = false,
}: WeeklyScheduleEditorProps) {
  function updateInterval(
    dayOfWeek: DayOfWeek,
    index: number,
    changes: Partial<OperatingHourInput>,
  ) {
    const dayIntervals = intervals
      .filter((item) => item.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startMinute - b.startMinute);
    const target = dayIntervals[index];
    if (!target) return;
    const updated = { ...target, ...changes };
    onChange(intervals.map((item) => item === target ? updated : item));
  }

  function addInterval(dayOfWeek: DayOfWeek) {
    const dayIntervals = intervals.filter((item) => item.dayOfWeek === dayOfWeek);
    const last = dayIntervals[dayIntervals.length - 1];
    const startMinute = last ? Math.min(last.endMinute + 60, 23 * 60) : 9 * 60;
    const endMinute = Math.min(startMinute + 8 * 60, 24 * 60);
    onChange([...intervals, { dayOfWeek, startMinute, endMinute }]);
  }

  function removeInterval(dayOfWeek: DayOfWeek, index: number) {
    const dayIntervals = intervals
      .filter((item) => item.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startMinute - b.startMinute);
    const target = dayIntervals[index];
    if (!target) return;
    onChange(intervals.filter((item) => item !== target));
  }

  return (
    <div className="divide-y divide-academy-line rounded-xl border border-academy-line bg-white">
      {WEEK_DAYS.map((day) => {
        const dayIntervals = intervals
          .filter((item) => item.dayOfWeek === day)
          .sort((a, b) => a.startMinute - b.startMinute);

        return (
          <div key={day} className="grid gap-3 px-4 py-4 sm:grid-cols-[110px_1fr] sm:items-start">
            <div className="pt-2">
              <p className="text-sm font-semibold text-academy-ink">{dayLabels[day]}</p>
              <p className="text-xs text-academy-muted">
                {dayIntervals.length ? 'Open' : 'Closed'}
              </p>
            </div>
            <div className="space-y-3">
              {dayIntervals.map((interval, index) => (
                <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`${day}-start-${index}`}>Opening time</label>
                  <input
                    id={`${day}-start-${index}`}
                    type="time"
                    value={toTime(interval.startMinute)}
                    disabled={disabled}
                    onChange={(event) => updateInterval(day, index, { startMinute: fromTime(event.target.value) })}
                    className="rounded-lg border border-academy-line px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-academy-muted">to</span>
                  <label className="sr-only" htmlFor={`${day}-end-${index}`}>Closing time</label>
                  <input
                    id={`${day}-end-${index}`}
                    type="time"
                    value={interval.endMinute === 1440 ? '23:59' : toTime(interval.endMinute)}
                    disabled={disabled || interval.endMinute === 1440}
                    onChange={(event) => updateInterval(day, index, { endMinute: fromTime(event.target.value) })}
                    className="rounded-lg border border-academy-line px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-academy-muted">
                    <input
                      type="checkbox"
                      checked={interval.endMinute === 1440}
                      disabled={disabled}
                      onChange={(event) => updateInterval(day, index, {
                        endMinute: event.target.checked ? 1440 : 23 * 60 + 59,
                      })}
                    />
                    Midnight
                  </label>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeInterval(day, index)}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={disabled || (dayIntervals[dayIntervals.length - 1]?.endMinute ?? 0) >= 1440}
                onClick={() => addInterval(day)}
                className="text-xs font-semibold text-academy-green hover:underline disabled:opacity-50"
              >
                + Add hours
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
