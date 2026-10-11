export const DEFAULT_BEDTIME = '23:00';

export function isBedtime(value: unknown): value is string {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** The next local occurrence of the planned bedtime, including after midnight. */
export function nextClockTime(now: Date, clock: string): Date {
  const [hours, minutes] = (isBedtime(clock) ? clock : DEFAULT_BEDTIME).split(':').map(Number);
  const at = new Date(now);
  at.setHours(hours, minutes, 0, 0);
  if (at <= now) at.setDate(at.getDate() + 1);
  return at;
}
