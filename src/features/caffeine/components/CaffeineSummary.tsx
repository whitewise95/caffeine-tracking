import { ArrowUpRight, Clock3 } from 'lucide-react';
import { formatTime } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';

export function CaffeineSummary({ today, last }: { today: number; last?: CaffeineEntry }) {
  return <div className="summary-grid">
    <div className="summary-item"><span className="summary-label"><ArrowUpRight size={15} />오늘 섭취</span><p><strong>{today}</strong><span>mg</span></p></div>
    <div className="summary-item"><span className="summary-label"><Clock3 size={15} />마지막 섭취</span><p><strong className="time-value">{last ? formatTime(new Date(last.consumedAt)) : '—'}</strong>{last && <span>{new Date(last.consumedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>}</p></div>
  </div>;
}
