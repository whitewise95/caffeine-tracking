import { useState } from 'react';
import { localDateKey, formatTime, MAX_CAFFEINE_MG } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';

function inputDate(value: Date) { return `${localDateKey(value)}T${formatTime(value)}`; }
export function EditEntryForm({ entry, busy, onSave }: { entry: CaffeineEntry; busy: boolean; onSave: (changes: Pick<CaffeineEntry, 'caffeineMg' | 'consumedAt'>) => Promise<boolean> }) {
  const [mg, setMg] = useState(String(entry.caffeineMg));
  const [time, setTime] = useState(inputDate(new Date(entry.consumedAt)));
  const [error, setError] = useState('');
  return <form className="dialog-content" onSubmit={event => {
    event.preventDefault();
    const caffeineMg = Number(mg);
    const date = new Date(time);
    if (!mg.trim() || !Number.isFinite(caffeineMg) || caffeineMg < 0 || caffeineMg > MAX_CAFFEINE_MG) { setError(`카페인량은 0~${MAX_CAFFEINE_MG}mg 사이로 입력해 주세요.`); return; }
    if (!time || !Number.isFinite(date.getTime()) || date.getTime() > Date.now()) { setError('현재 또는 과거의 섭취 시각을 입력해 주세요.'); return; }
    setError('');
    void onSave({ caffeineMg, consumedAt: date.toISOString() });
  }}>
    <p>{entry.drinkName}</p>
    <label className="field">카페인량 (mg)<input type="number" min="0" max={MAX_CAFFEINE_MG} step="any" inputMode="decimal" value={mg} onChange={event => setMg(event.target.value)} required /></label>
    <label className="field">섭취 시각<input type="datetime-local" max={inputDate(new Date())} value={time} onChange={event => setTime(event.target.value)} required /></label>
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className="button-primary full-width" disabled={busy}>{busy ? '저장하는 중…' : '수정 저장'}</button>
  </form>;
}
