import { useId, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { formatTime, nextEvening, remainingCaffeine } from '../../caffeine/model/caffeine';
import type { CaffeineEntry } from '../../caffeine/model/caffeine.types';
import { forecastSeries, recordedEntries } from '../model/report';
import { HoldAdjustButton } from '../../caffeine/components/HoldAdjustButton';

export function ReportForecast({ entries, now, halfLifeHours }: { entries: readonly CaffeineEntry[]; now: Date; halfLifeHours: number }) {
  const id = useId();
  const evening = nextEvening(now);
  const points = useMemo(() => forecastSeries(entries, now, new Date(now.getTime() + 24 * 3_600_000), halfLifeHours), [entries, now, halfLifeHours]);
  const [selection, setSelection] = useState<number | null>(null);
  const currentEntries = recordedEntries(entries, now);
  const eveningMg = remainingCaffeine(currentEntries, evening, halfLifeHours);
  const start = now.getTime();
  const end = start + 24 * 3_600_000;
  const clampTime = (at: number) => Math.max(start, Math.min(end, at));
  const selectedAt = new Date(clampTime(selection ?? evening.getTime()));
  const selected = { at: selectedAt, mg: remainingCaffeine(currentEntries, selectedAt, halfLifeHours) };
  const shiftMinute = (delta: number) => setSelection(previous => clampTime(clampTime(previous ?? evening.getTime()) + delta * 60_000));
  const max = Math.max(20, ...points.map(point => point.mg));
  const x = (at: Date) => 14 + (at.getTime() - now.getTime()) / (24 * 3_600_000) * 292;
  const y = (mg: number) => 136 - mg / max * 110;
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(point.at).toFixed(2)},${y(point.mg).toFixed(2)}`).join(' ');
  const tomorrow = evening.getDate() !== now.getDate();
  const rising = eveningMg > points[0].mg + 1;
  return <section className="report-card report-hero" aria-labelledby="forecast-title">
    <div className="report-kicker"><Clock3 size={15} aria-hidden="true" /><h2 id="forecast-title">{tomorrow ? '내일' : '오늘'} 밤 10시에는</h2></div>
    <p className="report-hero-number"><strong data-testid="report-evening-mg">{Math.round(eveningMg)}</strong><span>mg 남아요</span></p>
    <p className="report-status">{eveningMg < 1 ? '예상 잔존량 1mg 미만' : rising ? '흡수를 반영한 예상량' : '시간에 따라 줄어들어요'}</p>
    <p className="report-copy">{rising ? '지금 흡수 중인 카페인을 포함해 예측했어요.' : '지금까지의 기록으로 본 밤 10시 예상 잔존량이에요.'}</p>
    <div className="report-curve" role="slider" tabIndex={0} aria-label="예측 시각 선택" aria-valuemin={0} aria-valuemax={1440} aria-valuenow={Math.round((selectedAt.getTime() - start) / 60_000)} aria-valuetext={`${selected.at.getDate() !== now.getDate() ? '내일 ' : ''}${formatTime(selected.at)}, 추정 ${Math.round(selected.mg)}mg`} aria-describedby={`${id}-help`} onClick={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = ((event.clientX - bounds.left) / bounds.width * 320 - 14) / 292;
      const minutes = Math.round(Math.max(0, Math.min(1, position)) * 1440 / 5) * 5;
      setSelection(start + minutes * 60_000);
    }} onKeyDown={event => {
      const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
      if (!delta && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      if (event.key === 'Home') setSelection(start);
      else if (event.key === 'End') setSelection(end);
      else shiftMinute(delta);
    }}>
      <span id={`${id}-help`} className="sr-only">좌우 버튼으로 1분씩 조정하며, 길게 누르면 점점 빠르게 조정해요. 키보드 방향키로 이동하고 Home·End로 처음과 끝을 선택할 수 있어요.</span>
      <svg viewBox="0 0 320 158" aria-hidden="true">
        <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--accent-pink)" stopOpacity=".18" /><stop offset="1" stopColor="var(--accent-pink)" stopOpacity="0" /></linearGradient></defs>
        {[26, 81, 136].map(at => <line key={at} x1="14" y1={at} x2="306" y2={at} className="report-chart-grid" />)}
        <path d={`${line} L306,136 L14,136 Z`} fill={`url(#${id}-area)`} />
        <path d={line} fill="none" className="report-curve-line" />
        <line x1={x(evening)} x2={x(evening)} y1="20" y2="136" className="report-chart-marker" />
        <circle cx="14" cy={y(points[0].mg)} r="4" className="report-dot" />
        <circle cx={x(evening)} cy={y(eveningMg)} r="4" className="report-dot" />
        <text x={x(evening)} y="154" textAnchor={x(evening) < 35 ? "start" : x(evening) > 285 ? "end" : "middle"} className="report-evening-axis">22시</text>
        <circle cx={x(selected.at)} cy={y(selected.mg)} r="6" className="report-selected-dot" />
      </svg>
    </div>
    <div className="report-axis"><span>지금 {formatTime(now)}</span><span>24시간 뒤</span></div>
    <div className="report-chart-selection" aria-live="polite"><div className="report-forecast-time">
      <HoldAdjustButton direction={-1} ariaLabel="예측 시각 1분 앞당기기" className="report-forecast-step" disabled={selectedAt.getTime() <= start} onAdjust={shiftMinute}><ChevronLeft size={18} aria-hidden="true" /></HoldAdjustButton>
      <span>{selected.at.getDate() !== now.getDate() ? '내일 ' : ''}{formatTime(selected.at)}</span>
      <HoldAdjustButton direction={1} ariaLabel="예측 시각 1분 늦추기" className="report-forecast-step" disabled={selectedAt.getTime() >= end} onAdjust={shiftMinute}><ChevronRight size={18} aria-hidden="true" /></HoldAdjustButton>
    </div><strong>{Math.round(selected.mg)}<small> mg 예상</small></strong></div>
  </section>;
}
