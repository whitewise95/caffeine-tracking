import { Moon } from 'lucide-react';
import { nextEvening, remainingCaffeine } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';

export function CaffeineForecast({ entries, halfLifeHours, now }: { entries: CaffeineEntry[]; halfLifeHours: number; now: Date }) {
  const target = nextEvening(now);
  const current = remainingCaffeine(entries, now, halfLifeHours);
  const predicted = remainingCaffeine(entries, target, halfLifeHours);
  const duration = target.getTime() - now.getTime();
  const max = Math.max(current * 1.15, 30);
  const points = Array.from({ length: 25 }, (_, i) => {
    const value = remainingCaffeine(entries, new Date(now.getTime() + duration * i / 24), halfLifeHours);
    return `${4 + i * 12.5},${63 - (value / max) * 51}`;
  }).join(' ');
  const tomorrow = now.toDateString() !== target.toDateString();
  return <section className="forecast" aria-label="밤 10시 예상 잔존 카페인">
    <div className="forecast-heading"><div><span className="summary-label"><Moon size={15} />{tomorrow ? '내일' : '오늘'} 밤 10시에는</span><p><strong>{Math.round(predicted)}</strong><span>mg 예상</span></p></div></div>
    <svg className="forecast-chart" viewBox="0 0 308 72" aria-hidden="true"><path d="M4 65H304" stroke="var(--border-strong)" strokeDasharray="2 4" /><polyline points={points} fill="none" stroke="var(--caffeine-blue)" strokeWidth="1.5" /><circle cx="4" cy={63 - current / max * 51} r="3" fill="var(--caffeine-cyan)" /><circle cx="304" cy={63 - predicted / max * 51} r="3" fill="var(--bg)" stroke="var(--caffeine-blue)" strokeWidth="1.5" /></svg>
    <p className="forecast-note">추가 섭취가 없을 때의 추정치예요</p>
  </section>;
}
