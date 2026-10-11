import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { localDateKey } from '../../caffeine/model/caffeine';
import type { ReportDay } from '../model/report';

export function ReportHeatmap({ days, now, onHistory }: { days: ReportDay[]; now: Date; onHistory: (day?: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const length = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const blanks = (first.getDay() + 6) % 7;
  const today = localDateKey(now);
  const selectedKey = days.some(day => day.key === selected) ? selected : today;
  const active = days.find(day => day.key === selectedKey);
  return <section className="report-card report-heatmap-card" aria-labelledby="heatmap-title">
    <header className="report-section-heading"><div><h2 id="heatmap-title">{now.getMonth() + 1}월 기록 달력</h2><p>하루에 기록한 음료 개수를 색으로 보여줘요.</p></div></header>
    <div className="report-heatmap-weekdays" aria-hidden="true">{['월', '화', '수', '목', '금', '토', '일'].map(day => <span key={day}>{day}</span>)}</div>
    <div className="report-heatmap">
      {Array.from({ length: blanks }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length }, (_, index) => {
        const number = index + 1;
        const day = days[number - 1];
        const level = Math.min(day?.count ?? 0, 4);
        return <button key={number} disabled={!day} aria-pressed={selectedKey === day?.key} aria-current={day?.key === today ? 'date' : undefined} aria-label={`${now.getMonth() + 1}월 ${number}일, ${day ? day.count ? `${day.count}잔, ${Math.round(day.total)}mg` : '기록 없음' : '아직 오지 않은 날짜'}`} onClick={() => setSelected(day.key)}><span data-level={level}>{number}</span></button>;
      })}
    </div>
    <div className="report-heatmap-legend" role="group" aria-label="하루 기록 수별 색상">{[0, 1, 2, 3, 4].map(level => <span key={level}><i data-level={level} aria-hidden="true" />{level === 4 ? '4개 이상' : `${level}개`}</span>)}</div>
    {active && <div className="report-heatmap-detail" aria-live="polite"><p>{active.date.getMonth() + 1}월 {active.date.getDate()}일 · <strong>{Math.round(active.total)}mg</strong> · {active.count}잔</p><button className="button-secondary report-heatmap-history-button" onClick={() => onHistory(active.key)}>이날 기록 보기<ChevronRight size={18} aria-hidden="true" /></button></div>}
  </section>;
}
