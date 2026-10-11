import { localDateKey, MAX_STORED_CAFFEINE_MG, remainingCaffeine } from '../../caffeine/model/caffeine';
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types';
import { isValidIntakeTiming } from '../../caffeine/model/intakeTiming';
export { nextClockTime } from '../../caffeine/model/bedtime';

export type ReportPeriod = 'today' | 'week' | 'month';
export interface ReportDay { key: string; date: Date; total: number; count: number; eveningMg: number }
export interface ForecastPoint { at: Date; mg: number }
const HOUR = 3_600_000;

function dayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}
function shiftDay(date: Date, amount: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + amount);
  return shifted;
}

/** Reports use local calendar dates and completed, valid records only. */
export function recordedEntries(entries: readonly CaffeineEntry[], now: Date): CaffeineEntry[] {
  return entries.filter(entry => isValidIntakeTiming(entry, now) && Number.isFinite(entry.caffeineMg) && entry.caffeineMg >= 0 && entry.caffeineMg <= MAX_STORED_CAFFEINE_MG);
}

export function forecastSeries(entries: readonly CaffeineEntry[], now: Date, end: Date, halfLifeHours: number): ForecastPoint[] {
  const recorded = recordedEntries(entries, now);
  const length = Math.max(0, end.getTime() - now.getTime());
  const steps = Math.max(1, Math.ceil(length / (HOUR / 4)));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const at = new Date(now.getTime() + length * index / steps);
    return { at, mg: remainingCaffeine(recorded, at, halfLifeHours) };
  });
}

function aggregate(all: CaffeineEntry[], start: Date, end: Date, halfLifeHours: number) {
  const keys = new Map<string, CaffeineEntry[]>();
  for (const entry of all) {
    const at = new Date(entry.consumedAt);
    if (at < start || at >= shiftDay(end, 1)) continue;
    const key = localDateKey(at);
    keys.set(key, [...(keys.get(key) ?? []), entry]);
  }
  const days: ReportDay[] = [];
  for (let date = new Date(start); date <= end; date = shiftDay(date, 1)) {
    const key = localDateKey(date);
    const items = keys.get(key) ?? [];
    const evening = new Date(date);
    evening.setHours(22);
    // Entries after 22:00 never leak backwards into the evening estimate.
    days.push({ key, date, total: items.reduce((sum, item) => sum + item.caffeineMg, 0), count: items.length, eveningMg: remainingCaffeine(all, evening, halfLifeHours) });
  }
  const entries = [...keys.values()].flat().sort((a, b) => Date.parse(a.consumedAt) - Date.parse(b.consumedAt));
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const lastMinutes = [...keys.values()].map(items => Math.max(...items.map(item => { const at = new Date(item.consumedAt); return at.getHours() * 60 + at.getMinutes(); })));
  // Circular average keeps 23:50 and 00:10 near midnight rather than noon.
  const angle = lastMinutes.length ? Math.atan2(lastMinutes.reduce((sum, minute) => sum + Math.sin(minute / 1440 * Math.PI * 2), 0), lastMinutes.reduce((sum, minute) => sum + Math.cos(minute / 1440 * Math.PI * 2), 0)) : null;
  const averageLastMinutes = angle === null ? null : ((Math.round(angle / (Math.PI * 2) * 1440) % 1440) + 1440) % 1440;
  const drinks = new Map<string, { name: string; count: number }>();
  for (const entry of entries) {
    const drink = drinks.get(entry.drinkId) ?? { name: entry.drinkName, count: 0 };
    drink.count++;
    drinks.set(entry.drinkId, drink);
  }
  const hours = Array.from({ length: 12 }, (_, index) => ({ startHour: index * 2, count: 0 }));
  entries.forEach(entry => { hours[Math.floor(new Date(entry.startedAt ?? entry.consumedAt).getHours() / 2)].count++; });
  const commonWindow = hours.reduce((best, item) => item.count > best.count ? item : best, hours[0]);
  return {
    days, entries, total, average: total / days.length,
    eveningAverage: days.reduce((sum, day) => sum + day.eveningMg, 0) / days.length,
    unrecordedDays: days.filter(day => day.count === 0).length,
    maxDay: days.reduce<ReportDay | null>((best, day) => day.count && (!best || day.total > best.total) ? day : best, null),
    mostCommonDrink: [...drinks.values()].sort((a, b) => b.count - a.count)[0] ?? null,
    averageLastMinutes, commonWindow: commonWindow.count ? commonWindow : null,
    lateDays: [...keys.values()].filter(items => items.some(item => new Date(item.consumedAt).getHours() >= 18)).length,
  };
}

export function buildReport(entries: readonly CaffeineEntry[], period: ReportPeriod, now: Date, halfLifeHours: number) {
  const all = recordedEntries(entries, now);
  const today = dayStart(now);
  const start = period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : shiftDay(today, period === 'week' ? -6 : 0);
  const previousStart = period === 'month' ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : shiftDay(start, period === 'week' ? -7 : -1);
  const previousEnd = period === 'month' ? new Date(now.getFullYear(), now.getMonth() - 1, Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth(), 0).getDate())) : shiftDay(start, -1);
  const current = aggregate(all, start, today, halfLifeHours);
  const previous = aggregate(all, previousStart, previousEnd, halfLifeHours);
  return {
    ...current, start, end: today, previous,
    changePercent: current.entries.length && previous.average > 0 ? (current.average / previous.average - 1) * 100 : null,
  };
}

/** Sampled at five-minute intervals; display as an approximate model peak. */
export function todayPeak(entries: readonly CaffeineEntry[], now: Date, halfLifeHours: number): ForecastPoint | null {
  const all = recordedEntries(entries, now);
  if (!all.length) return null;
  const start = dayStart(now).getTime();
  let peak: ForecastPoint = { at: new Date(start), mg: remainingCaffeine(all, new Date(start), halfLifeHours) };
  for (let at = start; at <= now.getTime(); at += HOUR / 12) {
    const mg = remainingCaffeine(all, new Date(at), halfLifeHours);
    if (mg > peak.mg) peak = { at: new Date(at), mg };
  }
  const current = remainingCaffeine(all, now, halfLifeHours);
  if (current > peak.mg) peak = { at: now, mg: current };
  return peak.mg >= 1 ? peak : null;
}

export function halfRemainingTime(entries: readonly CaffeineEntry[], now: Date, halfLifeHours: number): Date | null {
  const points = forecastSeries(entries, now, new Date(now.getTime() + 72 * HOUR), halfLifeHours);
  const current = points[0].mg;
  if (current < 1) return null;
  return points.find(point => point.mg <= current / 2)?.at ?? null;
}
