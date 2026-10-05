import { useMemo, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import type { CaffeineEntry, Drink } from '../features/caffeine/model/caffeine.types';
import { localDateKey } from '../features/caffeine/model/caffeine';
import { HistoryCalendar } from '../features/caffeine/components/HistoryCalendar';
import { HistoryTimeline } from '../features/caffeine/components/HistoryTimeline';
import './history.css';

export function HistoryPage({ entries, drinks, now, onAdd, onEdit, onDelete }: { entries: CaffeineEntry[]; drinks: readonly Drink[]; now: Date; onAdd: () => void; onEdit: (entry: CaffeineEntry) => void; onDelete: (entry: CaffeineEntry) => void }) {
  const today = localDateKey(now);
  const [requestedDay, setSelectedDay] = useState(() => {
    const latest = entries.reduce<CaffeineEntry | undefined>((last, entry) => {
      if (localDateKey(new Date(entry.consumedAt)) > today) return last;
      return !last || Date.parse(entry.consumedAt) > Date.parse(last.consumedAt) ? entry : last;
    }, undefined);
    return localDateKey(latest ? new Date(latest.consumedAt) : now);
  });
  const selectedDay = requestedDay > today ? today : requestedDay;
  const { grouped, counts } = useMemo(() => {
    const grouped = new Map<string, CaffeineEntry[]>();
    [...entries].sort((a, b) => Date.parse(a.consumedAt) - Date.parse(b.consumedAt)).forEach(entry => {
      const key = localDateKey(new Date(entry.consumedAt));
      const day = grouped.get(key) ?? [];
      day.push(entry);
      grouped.set(key, day);
    });
    return { grouped, counts: new Map([...grouped].map(([day, items]) => [day, items.length])) };
  }, [entries]);
  const items = grouped.get(selectedDay) ?? [];
  const total = items.reduce((sum, entry) => sum + entry.caffeineMg, 0);
  const dateLabel = new Date(`${selectedDay}T12:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  return <main className="page history-page" id="main-content">
    <header className="page-header"><div><span className="eyebrow">MY JOURNAL</span><h1 className="page-title">한 잔의 기록</h1></div><button className="icon-button" aria-label="카페인 추가" onClick={onAdd}><Plus size={22} aria-hidden="true" /></button></header>
    <HistoryCalendar selectedDay={selectedDay} today={today} counts={counts} onSelect={setSelectedDay} />
    <section className="history-day" aria-labelledby="history-day-title">
      <header className="history-day-summary" aria-live="polite" aria-atomic="true">
        <div className="history-day-meta"><h2 id="history-day-title">{dateLabel}</h2><span>섭취 기록 <strong data-testid="daily-count">{items.length}</strong>잔</span></div>
        <p className="history-total"><strong data-testid="daily-total">{Number(total.toFixed(2)).toLocaleString('ko-KR')}</strong><span>mg</span></p>
      </header>
      {items.length > 0 ? <HistoryTimeline drinks={drinks} entries={items} onEdit={onEdit} onDelete={onDelete} /> : <div className="empty-state history-empty">
        <CalendarDays size={28} strokeWidth={1.3} aria-hidden="true" />
        <h3>{entries.length === 0 ? '아직 기록이 없어요' : '이날은 기록이 없어요'}</h3>
        <p>{entries.length === 0 ? '첫 한 잔을 기록하면 여기에 모아드릴게요.' : '점이 표시된 날짜에서 다른 기록을 찾아보세요.'}</p>
        {entries.length === 0 && <button className="button-secondary" onClick={onAdd}>첫 카페인 기록하기</button>}
      </div>}
    </section>
    {entries.length > 0 && <p className="history-note">날짜별 기록은 마신 마지막 시각을 기준으로 모아요.</p>}
  </main>;
}
