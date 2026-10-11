import { describe, expect, it } from 'vitest';
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types';
import { bedtimeAmountLevel, sleepInsight } from './sleepInsight';

const now = new Date('2026-10-06T16:00:00+09:00');
const at = new Date('2026-10-06T23:00:00+09:00');
const entry: CaffeineEntry = { id: '1', drinkId: 'coffee', drinkName: '커피', icon: 'coffee', caffeineMg: 200, consumedAt: '2026-10-06T12:00:00+09:00' };

describe('sleep insight copy', () => {
  it.each([
    [0, 'VERY_LOW'], [24.49, 'VERY_LOW'], [24.5, 'LOW'], [25, 'LOW'],
    [49.49, 'LOW'], [49.5, 'MODERATE'], [50, 'MODERATE'],
    [99.49, 'MODERATE'], [99.5, 'HIGH'], [100, 'HIGH'],
    [149.49, 'HIGH'], [149.5, 'VERY_HIGH'], [150, 'VERY_HIGH'], [300, 'VERY_HIGH'],
  ])('selects the amount band that agrees with the displayed %s mg', (mg, level) => {
    expect(bedtimeAmountLevel(mg)).toBe(level);
  });
  it('distinguishes missing or zero-dose records from a low future estimate', () => {
    expect(sleepInsight([], now, at, 4.5).kind).toBe('no-records');
    expect(sleepInsight([{ ...entry, caffeineMg: 0 }], now, at, 4.5).kind).toBe('no-records');
    expect(sleepInsight([entry], now, new Date('2026-10-10T23:00:00+09:00'), 4.5).kind).toBe('VERY_LOW');
  });
  it('explains a decreased amount without calling it a sleep safety threshold', () => {
    const insight = sleepInsight([entry], now, at, 4.5);
    expect(insight.kind).toBe('LOW');
    expect(insight.context).toContain('38mg');
    expect(insight.intakeGap).toBe('마지막 섭취 후 11시간');
    expect(insight.effect).toContain('카페인에 민감하다면');
  });
  it.each([
    [80, 'VERY_LOW'], [200, 'LOW'], [400, 'MODERATE'], [600, 'HIGH'], [900, 'VERY_HIGH'],
  ])('uses the future estimate instead of the %s mg intake to select its message', (dose, level) => {
    expect(sleepInsight([{ ...entry, caffeineMg: dose }], now, at, 4.5).kind).toBe(level);
  });
  it('reflects fresh absorption rather than falsely describing a decreasing amount', () => {
    const insight = sleepInsight([{ ...entry, consumedAt: now.toISOString() }], now, new Date(now.getTime() + 30 * 60_000), 4.5);
    expect(insight.kind).toBe('VERY_HIGH');
    expect(insight.context).toContain('170mg');
    expect(insight.intakeGap).toBe('마지막 섭취 후 30분');
  });
  it('updates across midnight and ignores future or invalid records', () => {
    const tomorrow = new Date('2026-10-07T01:00:00+09:00');
    const insight = sleepInsight([entry, { ...entry, caffeineMg: 900, consumedAt: '2026-10-06T20:00:00+09:00' }, { ...entry, caffeineMg: -200 }], now, tomorrow, 4.5);
    expect(insight).toEqual(sleepInsight([entry], now, tomorrow, 4.5));
    expect(insight.intakeGap).toBe('마지막 섭취 후 13시간');
  });
});
