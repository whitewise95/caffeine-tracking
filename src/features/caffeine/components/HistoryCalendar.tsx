import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { localDateKey } from '../model/caffeine';

const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

export function HistoryCalendar({ selectedDay, today, counts, onSelect }: {
  selectedDay: string; today: string; counts: ReadonlyMap<string, number>; onSelect: (day: string) => void;
}) {
  const selected = new Date(`${selectedDay}T12:00:00`);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const firstDay = new Date(year, month, 1, 12);
  const lastDay = new Date(year, month + 1, 0, 12).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const monthLabel = firstDay.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const days = Array.from({ length: lastDay }, (_, i) => new Date(year, month, i + 1, 12));
  const canMoveNext = selectedDay.slice(0, 7) < today.slice(0, 7);
  const recordedDays = days.filter(day => localDateKey(day) <= today && counts.has(localDateKey(day))).length;

  function moveMonth(offset: number) {
    const target = new Date(year, month + offset, 1, 12);
    if (localDateKey(target).slice(0, 7) > today.slice(0, 7)) return;
    const targetLastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
    target.setDate(Math.min(selected.getDate(), targetLastDay));
    const targetDay = localDateKey(target);
    onSelect(targetDay > today ? today : targetDay);
  }

  return <section className="history-calendar" aria-label="월간 기록 캘린더">
    <header className="calendar-header">
      <div className="calendar-month"><span className="calendar-year">{year}</span><h2 aria-label={`${monthLabel} 날짜 선택`}>{month + 1}월</h2></div>
      <div className="calendar-controls">
        <button className="calendar-today" onClick={() => onSelect(today)}>오늘</button>
        <button className="icon-button" aria-label="이전 달" onClick={() => moveMonth(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
        {canMoveNext && <button className="icon-button" aria-label="다음 달" onClick={() => moveMonth(1)}><ChevronRight size={18} aria-hidden="true" /></button>}
      </div>
    </header>
    <div className="calendar-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-dates" role="group" aria-label={`${monthLabel} 날짜 선택`}>
      {Array.from({ length: leading }, (_, i) => <span key={`blank-${i}`} aria-hidden="true" />)}
      {days.map(day => {
        const key = localDateKey(day);
        const isFuture = key > today;
        const count = isFuture ? 0 : counts.get(key) ?? 0;
        const isSelected = key === selectedDay;
        const label = day.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        return <button key={key} className="calendar-day" disabled={isFuture} aria-pressed={isSelected} aria-current={key === today ? 'date' : undefined}
          aria-label={`${label}, ${isFuture ? '미래 날짜, 선택 불가' : `${key === today ? '오늘, ' : ''}${count ? `기록 ${count}잔` : '기록 없음'}`}`} onClick={() => { if (!isFuture) onSelect(key) }}>
          <span>{day.getDate()}</span>
          {isSelected && <Check className="calendar-selected-check" size={10} strokeWidth={2.5} aria-hidden="true" />}
          {count > 0 && <span className="calendar-record-dot" aria-hidden="true" />}
        </button>;
      })}
    </div>
    <footer className="calendar-footer"><span><i aria-hidden="true" />기록 있는 날</span><span>이달 {recordedDays}일 기록</span></footer>
  </section>;
}
