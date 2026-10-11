import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Coffee, Moon, TrendingUp } from 'lucide-react';
import { formatTime, localDateKey, remainingCaffeine } from '../features/caffeine/model/caffeine';
import type { CaffeineEntry } from '../features/caffeine/model/caffeine.types';
import { buildReport, halfRemainingTime, recordedEntries, todayPeak, type ReportPeriod } from '../features/insights/model/report';
import { ReportForecast } from '../features/insights/components/ReportForecast';
import { ReportIntakeChart } from '../features/insights/components/ReportIntakeChart';
import { ReportHeatmap } from '../features/insights/components/ReportHeatmap';
import './insights.css';

const periods: { value: ReportPeriod; label: string }[] = [{ value: 'today', label: '오늘' }, { value: 'week', label: '7일' }, { value: 'month', label: '이번 달' }];
const number = (value: number) => Math.round(value).toLocaleString('ko-KR');
function clock(minutes: number | null) { return minutes === null ? '—' : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
function dateLabel(date: Date) { return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }); }

export function InsightsPage({ entries, now, halfLifeHours, onHistory }: { entries: CaffeineEntry[]; now: Date; halfLifeHours: number; onHistory: (day?: string) => void }) {
  const periodSection = useRef<HTMLElement>(null);
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const report = useMemo(() => buildReport(entries, period, now, halfLifeHours), [entries, period, now, halfLifeHours]);
  const monthly = useMemo(() => buildReport(entries, 'month', now, halfLifeHours), [entries, now, halfLifeHours]);
  const all = useMemo(() => recordedEntries(entries, now), [entries, now]);
  const peak = useMemo(() => todayPeak(entries, now, halfLifeHours), [entries, now, halfLifeHours]);
  const halfAt = useMemo(() => halfRemainingTime(entries, now, halfLifeHours), [entries, now, halfLifeHours]);
  const current = remainingCaffeine(all, now, halfLifeHours);
  const previousLabel = period === 'today' ? '어제' : period === 'week' ? '이전 7일' : '지난달 같은 기간';
  const change = report.changePercent;
  const patterns: string[] = [];
  if (report.commonWindow) patterns.push(`가장 자주 마신 시간대는 ${report.commonWindow.startHour}–${report.commonWindow.startHour + 2}시예요. 이 시간대에 ${report.commonWindow.count}잔을 기록했어요.`);
  if (change !== null) patterns.push(`${previousLabel}보다 하루 평균 섭취량이 ${Math.abs(Math.round(change))}% ${change < 0 ? '줄었어요' : change > 0 ? '늘었어요' : '변화가 없어요'}.`);
  if (report.entries.length) patterns.push(`오후 6시 이후 마친 음료가 있는 날은 ${report.lateDays}일이에요.`);
  return <main className="page insights-page" id="main-content">
    <header className="report-page-header"><h1 className="page-title">카페인 리포트</h1></header>
    <section className="report-group" aria-label="현재와 앞으로">
    <ReportForecast entries={entries} now={now} halfLifeHours={halfLifeHours} />
    <section className="report-metrics" aria-label="현재 카페인 핵심 지표">
      <article className="report-card"><Coffee size={18} aria-hidden="true" /><h2>현재 추정 잔존량</h2><p><strong data-testid="report-current-mg">{number(current)}</strong><span>mg</span></p><small>지금까지의 섭취 기록 기준</small></article>
      <article className="report-card"><TrendingUp size={18} aria-hidden="true" /><h2>오늘의 추정 최고점</h2><p><strong>{peak ? formatTime(peak.at) : '—'}</strong></p><small>{peak ? `약 ${number(peak.mg)}mg · ${formatTime(now)} 기준` : '표시할 잔존량이 없어요'}</small></article>
      <article className="report-card"><Moon size={18} aria-hidden="true" /><h2>지금 양의 절반은</h2><p><strong>{halfAt ? formatTime(halfAt) : '—'}</strong></p><small>{halfAt ? `${localDateKey(halfAt) !== localDateKey(now) ? `${dateLabel(halfAt)} · ` : ''}약 ${number(current / 2)}mg 예상` : '현재 추정량이 1mg 미만이에요'}</small></article>
    </section>
    </section>
    <section ref={periodSection} className="report-group report-period-report" aria-labelledby="period-report-title">
      <header className="report-group-heading"><h2 id="period-report-title">기간별 기록</h2><p>선택한 기간의 섭취량과 패턴을 살펴보세요.</p></header>
    <div className="report-periods" role="group" aria-label="리포트 기간">{periods.map(item => <button key={item.value} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div>
    <p className="report-period-caption" aria-live="polite">{dateLabel(report.start)}{period !== 'today' && ` – ${dateLabel(report.end)}`} · {report.entries.length}잔의 기록</p>
    <ReportIntakeChart key={period} period={period} days={report.days} entries={report.entries} average={report.average} now={now} onHistory={onHistory} />
    <section className="report-patterns" aria-labelledby="patterns-title"><h2 id="patterns-title">기록에서 발견한 패턴</h2>{patterns.length ? <ul>{patterns.slice(0, 3).map(pattern => <li key={pattern}>{pattern}</li>)}</ul> : <p className="report-copy">음료를 기록하면 자주 마시는 시간대와 섭취 패턴을 여기에서 확인할 수 있어요.</p>}</section>
    </section>
    <section className="report-group report-month-group" aria-label="이번 달 기록">
    <section className="report-card report-monthly" aria-labelledby="monthly-title"><header className="report-section-heading"><div><h2 id="monthly-title">{now.getMonth() + 1}월 한 장 요약</h2><p>1일부터 오늘까지의 저장된 기록이에요.</p></div></header><dl className="report-monthly-stats">
      <div><dt>이번 달 총 섭취</dt><dd>{number(monthly.total)} <small>mg</small></dd></div><div><dt>하루 평균 섭취</dt><dd>{number(monthly.average)} <small>mg</small></dd></div><div><dt>지난달 같은 기간 평균</dt><dd>{monthly.previous.entries.length ? number(monthly.previous.average) : '—'} <small>{monthly.previous.entries.length ? 'mg' : '기록 없음'}</small></dd></div><div><dt>밤 10시 평균 추정량</dt><dd>{number(monthly.eveningAverage)} <small>mg</small></dd></div><div><dt>기록 없는 날</dt><dd>{monthly.unrecordedDays} <small>일</small></dd></div><div><dt>가장 많이 기록한 날</dt><dd>{monthly.maxDay ? dateLabel(monthly.maxDay.date) : '—'}<small>{monthly.maxDay ? ` · ${number(monthly.maxDay.total)}mg` : ''}</small></dd></div><div><dt>가장 자주 마신 음료</dt><dd>{monthly.mostCommonDrink?.name ?? '—'}<small>{monthly.mostCommonDrink ? ` · ${monthly.mostCommonDrink.count}잔` : ''}</small></dd></div><div><dt>평균 마지막 섭취</dt><dd>{clock(monthly.averageLastMinutes)}</dd></div>
    </dl><button className="text-button" onClick={() => { setPeriod('month'); periodSection.current?.scrollIntoView({ block: 'start' }); }}>월간 그래프 보기 <ArrowUpRight size={15} aria-hidden="true" /></button></section>
    <ReportHeatmap days={monthly.days} now={now} onHistory={onHistory} />
    </section>
    <p className="report-footer">기록을 바탕으로 계산한 추정치예요.<br />실제 체내 카페인량이나 신체 상태를 측정하지 않으며, 개인차가 있을 수 있어요.</p>
  </main>;
}
