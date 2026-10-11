import { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ReportDay, ReportPeriod } from '../model/report';
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types';
import { ReportChartWindow } from './ReportChartWindow';

export function ReportIntakeChart({ period, days, entries, average, now, onHistory }: { period: ReportPeriod; days: ReportDay[]; entries: CaffeineEntry[]; average: number; now: Date; onHistory: (day?: string) => void }) {
  const id = useId();
  const daily = period === 'today';
  const [selected, setSelected] = useState(() => daily ? now.getHours() : days.length - 1);
  const bars = daily ? Array.from({ length: 24 }, (_, hour) => {
    const items = entries.filter(entry => new Date(entry.consumedAt).getHours() === hour);
    return { label: `${String(hour).padStart(2, '0')}:00`, total: items.reduce((sum, entry) => sum + entry.caffeineMg, 0), count: items.length, key: days[0].key };
  }) : days.map(day => ({ ...day, label: day.date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) }));
  const index = Math.min(selected, bars.length - 1);
  const bar = bars[index];
  const maximum = Math.max(50, Math.ceil(Math.max(...bars.map(bar => bar.total), average) * 1.15 / 50) * 50);
  const total = bars.reduce((sum, bar) => sum + bar.total, 0);
  return <section className="report-card" aria-labelledby={`${id}-title`}>
    <header className="report-section-heading">
      <div>
        <h2 id={`${id}-title`}>{daily ? '오늘의 섭취' : period === 'week' ? '7일간의 섭취' : '이번 달의 섭취'}</h2>
        <p id={`${id}-chart-help`}>그래프를 탭해 {daily ? '시간' : '날짜'}별 섭취량을 확인하세요.<span className="sr-only"> 좌우로 밀거나 이전·다음 구간 버튼으로 이동할 수 있어요. 키보드 방향키로 선택하고 Home·End로 처음과 끝을 선택할 수 있어요.</span></p>
        <p>합계 <strong>{Math.round(total).toLocaleString('ko-KR')} mg</strong> · {entries.length}잔</p>
      </div>
    </header>
    <div className="report-intake-scale"><span>mg</span>{!daily && <span>하루 평균 <strong>{Math.round(average).toLocaleString('ko-KR')} mg</strong></span>}</div>
    <div className="report-intake-frame">
    <div className="report-intake-y-axis" aria-hidden="true"><span>{maximum.toLocaleString('ko-KR')}</span><span>{(maximum / 2).toLocaleString('ko-KR')}</span><span>0</span></div>
    <ReportChartWindow count={bars.length} selected={index} initialIndex={daily ? now.getHours() : days.length - 1} label={daily ? '섭취 시간 선택' : '섭취 날짜 선택'} valueText={`${bar.label}, ${bar.count}잔, ${Math.round(bar.total)}mg`} helpId={`${id}-chart-help`} rangeLabels={bars.map((_, at) => daily ? `${at}시` : `${days[at].date.getDate()}일`)} onSelect={setSelected}>
    <div className="report-bars">
      <div className="report-bar-grid" aria-hidden="true"><i /><i /><i /></div>
      {!daily && average > 0 && <div className="report-average-line" aria-hidden="true" style={{ bottom: `${average / maximum * 100}%` }} />}
      {bars.map((bar, at) => <div key={bar.label} aria-hidden="true" className={`report-bar-track${bar.total === 0 ? ' is-empty' : ''}${at === index ? ' is-selected' : ''}`}><span className={bar.total === 0 ? 'is-empty' : undefined} style={{ height: `${bar.total / maximum * 100}%` }} /></div>)}
    </div>
    <div className="report-intake-x-axis" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>{bars.map((_, at) => <span key={at} className={at === index ? 'is-selected' : undefined}>{daily ? `${at}시` : days[at].date.getDate()}</span>)}</div>
    </ReportChartWindow>
    </div>
    <div className="report-chart-selection" aria-live="polite"><span>{bar.label} · {bar.count}잔</span><strong>{Math.round(bar.total)}<small> mg</small></strong></div>
    {!bar.count && <p className="report-note">이 구간에는 저장한 기록이 없어요.</p>}
    <button className="button-secondary report-intake-history-button" onClick={() => onHistory(bar.key)}>이날 기록 보기<ChevronRight size={18} aria-hidden="true" /></button>
  </section>;
}
