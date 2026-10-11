import { describe, expect, it } from 'vitest';
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types';
import { remainingCaffeine } from '../../caffeine/model/caffeine';
import { buildReport, forecastSeries, nextClockTime, todayPeak, halfRemainingTime } from './report';

const now = new Date(2026, 9, 6, 16);
function entry(day: number, hour: number, mg: number, month = 9, name = '커피'): CaffeineEntry {
  return { id: `${month}-${day}-${hour}-${mg}`, drinkId: name, drinkName: name, caffeineMg: mg, icon: 'coffee', consumedAt: new Date(2026, month, day, hour).toISOString() };
}

describe('report aggregation', () => {
  it('compares month-to-date with the same elapsed dates last month', () => {
    const report = buildReport([entry(1, 8, 100), entry(6, 12, 200), entry(1, 8, 200, 8), entry(6, 12, 400, 8), entry(30, 12, 900, 8)], 'month', now, 4.5);
    expect(report.days).toHaveLength(6);
    expect(report.total).toBe(300);
    expect(report.average).toBe(50);
    expect(report.previous.average).toBe(100);
    expect(report.changePercent).toBe(-50);
    expect(report.unrecordedDays).toBe(4);
  });
  it('excludes invalid and future intakes and avoids invented comparisons without records', () => {
    const report = buildReport([entry(7, 12, 900), entry(6, 20, 300), entry(6, 10, -5)], 'today', now, 4.5);
    expect(report.total).toBe(0);
    expect(report.entries).toEqual([]);
    expect(report.changePercent).toBeNull();
    expect(report.mostCommonDrink).toBeNull();
    expect(report.averageLastMinutes).toBeNull();
  });
  it('calculates evening estimates from intake before each evening, including carryover', () => {
    const entries = [entry(4, 20, 100), entry(5, 8, 200), entry(5, 23, 300)];
    const report = buildReport(entries, 'week', now, 4.5);
    const day = report.days.find(item => item.key.endsWith('10-05'))!;
    expect(day.eveningMg).toBeCloseTo(remainingCaffeine(entries.slice(0, 2), new Date(2026, 9, 5, 22), 4.5));
    expect(day.total).toBe(500);
    expect(report.lateDays).toBe(2);
  });
  it('clamps the previous month to its length at the end of a longer month', () => {
    const report = buildReport([], 'month', new Date(2026, 2, 31, 16), 4.5);
    expect(report.days).toHaveLength(31);
    expect(report.previous.days).toHaveLength(28);
  });
});

describe('report forecasts', () => {
  it('retains absorption curves and never adds future records to forecasts', () => {
    const fresh = entry(6, 16, 200);
    const points = forecastSeries([fresh, entry(6, 18, 500)], now, new Date(2026, 9, 7, 16), 4.5);
    expect(points[0].mg).toBe(0);
    expect(points.some(point => point.mg > 100)).toBe(true);
    expect(points.at(-1)!.mg).toBeCloseTo(remainingCaffeine([fresh], new Date(2026, 9, 7, 16), 4.5));
  });
  it('resolves next bedtime clock time across midnight', () => {
    expect(nextClockTime(new Date(2026, 9, 6, 23, 30), '01:00')).toEqual(new Date(2026, 9, 7, 1));
    expect(nextClockTime(now, '23:00')).toEqual(new Date(2026, 9, 6, 23));
  });
  it('finds the absorbed peak instead of reporting an instantaneous dose spike', () => {
    const peak = todayPeak([entry(6, 10, 200)], now, 4.5)!;
    expect(peak.at.getHours()).toBe(10);
    expect(peak.at.getMinutes()).toBeGreaterThan(0);
    expect(peak.mg).toBeGreaterThan(150);
    expect(peak.mg).toBeLessThan(200);
    expect(todayPeak([], now, 4.5)).toBeNull();
  });
  it('finds half of the current model amount after absorption, without promising a sleep threshold', () => {
    const entries = [entry(6, 10, 200)];
    const half = halfRemainingTime(entries, now, 4.5)!;
    expect((half.getTime() - now.getTime()) / 3_600_000).toBeGreaterThanOrEqual(4.5);
    expect((half.getTime() - now.getTime()) / 3_600_000).toBeLessThanOrEqual(4.75);
    expect(halfRemainingTime([], now, 4.5)).toBeNull();
  });
});
