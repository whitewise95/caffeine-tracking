import { Pencil, Trash2 } from 'lucide-react';
import { DrinkIcon } from '../../../components/icons/DrinkIcon';
import { formatTime } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';

export function HistoryTimeline({ entries, onEdit, onDelete }: {
  entries: CaffeineEntry[]; onEdit: (entry: CaffeineEntry) => void; onDelete: (entry: CaffeineEntry) => void;
}) {
  return <ol className="history-list" aria-label="선택한 날짜의 섭취 타임라인">
    {entries.map(entry => <li key={entry.id} className="history-timeline-item">
      <time className="entry-time" dateTime={entry.consumedAt}>{formatTime(new Date(entry.consumedAt))}</time>
      <article className="history-entry">
        <div className="entry-content">
          <span className="drink-icon-container"><DrinkIcon type={entry.icon} size={20} /></span>
          <div className="entry-copy"><h3>{entry.drinkName}</h3><p>{entry.caffeineMg}<span>mg</span></p></div>
        </div>
        <div className="entry-actions">
          <button className="icon-button" aria-label={`${entry.drinkName} 기록 수정`} onClick={() => onEdit(entry)}><Pencil size={16} aria-hidden="true" /></button>
          <button className="icon-button" aria-label={`${entry.drinkName} 기록 삭제`} onClick={() => onDelete(entry)}><Trash2 size={16} aria-hidden="true" /></button>
        </div>
      </article>
    </li>)}
  </ol>;
}
