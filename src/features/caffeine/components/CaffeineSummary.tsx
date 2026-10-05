import type { ReactNode } from 'react';
import { formatTime } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';

export function CaffeineSummary({ today, last, children }: { today: number; last?: CaffeineEntry; children: ReactNode }) {
  return <section className="summary-card" aria-label="카페인 기록 요약">
    <div className="summary-grid">
      <div className="summary-item">
        <span className="summary-label">오늘 섭취</span>
        <p className="summary-value"><strong>{today}</strong><span>mg</span></p>
      </div>
      <div className="summary-item">
        <span className="summary-label">마지막 섭취</span>
        <p className="summary-value"><strong>{last ? formatTime(new Date(last.consumedAt)) : '—'}</strong></p>
        {last && <time className="summary-detail summary-date" dateTime={last.consumedAt}>{new Date(last.consumedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</time>}
      </div>
      {children}
    </div>
    <p className="forecast-note">밤 10시 예상량은 추가 섭취가 없을 때의 추정치예요</p>
  </section>;
}
