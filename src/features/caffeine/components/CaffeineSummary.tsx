import type { ReactNode } from 'react';
import './summary.css';
import { formatTime, localDateKey } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';

export function CaffeineSummary({ today, last, now, children }: { today: number; last?: CaffeineEntry; now: Date; children: ReactNode }) {
  const lastConsumedAt = last ? new Date(last.consumedAt) : undefined;
  const showLastDate = lastConsumedAt && localDateKey(lastConsumedAt) !== localDateKey(now);

  return <section className="summary-card" aria-label="카페인 기록 요약">
    <div className="summary-grid">
      <div className="summary-item">
        <span className="summary-label">오늘 섭취</span>
        <p className="summary-value"><strong>{today}</strong><span>mg</span></p>
      </div>
      <div className="summary-item">
        <div className="summary-item-heading">
          <span className="summary-label">마지막 섭취</span>
          {showLastDate && <time className="summary-detail summary-date" dateTime={lastConsumedAt.toISOString()}>{lastConsumedAt.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</time>}
        </div>
        <p className="summary-value"><strong>{lastConsumedAt ? formatTime(lastConsumedAt) : '—'}</strong></p>
      </div>
      {children}
    </div>
  </section>;
}
