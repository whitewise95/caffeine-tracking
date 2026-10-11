import { formatTime, remainingCaffeine } from '../model/caffeine';
import { nextClockTime } from '../model/bedtime';
import type { CaffeineEntry } from '../model/caffeine.types';
import { consumedEntriesAt } from '../model/forecast';

export function CaffeineForecast({ entries, halfLifeHours, now, bedtime }: { entries: CaffeineEntry[]; halfLifeHours: number; now: Date; bedtime: string }) {
  const target = nextClockTime(now, bedtime);
  // Forecast only what has already been consumed, even if imported data includes future records.
  const consumedEntries = consumedEntriesAt(entries, now);
  const predicted = remainingCaffeine(consumedEntries, target, halfLifeHours);
  const tomorrow = now.toDateString() !== target.toDateString();
  const label = `${tomorrow ? '내일' : '오늘'} ${formatTime(target)}`;
  return <section className="summary-item forecast" aria-label={`${label} 취침 시 예상 잔존 카페인`}>
    <div className="summary-item-heading">
      <span className="summary-label">{label}</span>
      <span className="summary-detail">취침 시 예상량</span>
    </div>
    <p className="summary-value"><strong>{Math.round(predicted)}</strong><span>mg</span></p>
  </section>;
}
