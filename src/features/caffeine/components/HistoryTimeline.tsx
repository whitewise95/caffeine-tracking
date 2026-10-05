import { Pencil, Trash2 } from 'lucide-react';
import { DrinkIcon } from '../../../components/icons/DrinkIcon';
import { formatTime, localDateKey } from '../model/caffeine';
import type { CaffeineEntry, Drink } from '../model/caffeine.types';
import './intake-time.css';

function intakePeriod(entry: CaffeineEntry) {
  if (!entry.startedAt) return null;
  const start = new Date(entry.startedAt);
  const end = new Date(entry.consumedAt);
  const startDate = localDateKey(start) !== localDateKey(end) ? `${start.toLocaleDateString('ko-KR', { ...(start.getFullYear() !== end.getFullYear() ? { year: 'numeric' } : {}), month: 'long', day: 'numeric' })} ` : '';
  return `${startDate}${formatTime(start)} – ${formatTime(end)}`;
}

export function HistoryTimeline({ entries, drinks, onEdit, onDelete }: {
  entries: CaffeineEntry[]; drinks: readonly Drink[]; onEdit: (entry: CaffeineEntry) => void; onDelete: (entry: CaffeineEntry) => void;
}) {
  return <ol className="history-list" aria-label="선택한 날짜의 섭취 타임라인">
    {entries.map(entry => <li key={entry.id} className="history-timeline-item">
      <time className="entry-time" dateTime={entry.consumedAt}>{formatTime(new Date(entry.consumedAt))}</time>
      <article className="history-entry">
        <div className="entry-content">
          <span className="drink-icon-container"><DrinkIcon photoDataUrl={drinks.find(drink => drink.id === entry.drinkId)?.photoDataUrl} type={entry.icon} size={20} /></span>
          <div className="entry-copy"><h3>{entry.drinkName}</h3><p>{entry.caffeineMg}<span>mg</span></p>{entry.startedAt && <span className="entry-intake-period">{intakePeriod(entry)}</span>}</div>
        </div>
        <div className="entry-actions">
          <button className="icon-button" aria-label={`${entry.drinkName} 기록 수정`} onClick={() => onEdit(entry)}><Pencil size={16} aria-hidden="true" /></button>
          <button className="icon-button" aria-label={`${entry.drinkName} 기록 삭제`} onClick={() => onDelete(entry)}><Trash2 size={16} aria-hidden="true" /></button>
        </div>
      </article>
    </li>)}
  </ol>;
}
