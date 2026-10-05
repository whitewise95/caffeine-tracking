import { nextEvening, remainingCaffeine } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';
import { consumedEntriesAt } from '../model/forecast';

export function CaffeineForecast({ entries, halfLifeHours, now }: { entries: CaffeineEntry[]; halfLifeHours: number; now: Date }) {
  const target = nextEvening(now);
  // Forecast only what has already been consumed, even if imported data includes future records.
  const consumedEntries = consumedEntriesAt(entries, now);
  const predicted = remainingCaffeine(consumedEntries, target, halfLifeHours);
  const tomorrow = now.toDateString() !== target.toDateString();
  return <section className="summary-item forecast" aria-label={`${tomorrow ? '내일' : '오늘'} 밤 10시 예상 잔존 카페인`}>
    <span className="summary-label">{tomorrow ? '내일' : '오늘'} 밤 10시</span>
    <p className="summary-value"><strong>{Math.round(predicted)}</strong><span>mg</span></p>
    <span className="summary-detail">예상 잔존량</span>
  </section>;
}
