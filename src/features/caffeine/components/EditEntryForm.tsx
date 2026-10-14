import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { AddCaffeineStep } from '../../../app/router';
import { BottomSheet } from '../../../components/BottomSheet';
import { IntakeTimePicker } from './IntakeTimePicker';
import { MAX_CAFFEINE_MG } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';
import { IntakeTimeFields } from './IntakeTimeFields';
import { useIntakeTimeFields } from './useIntakeTimeFields';
import { IntakeNoteField } from './IntakeNoteField';
import { normalizeIntakeNote } from '../model/intakeNote';
import { CaffeineDoseControl } from './CaffeineDoseControl';
import { DrinkIcon } from '../../../components/icons/DrinkIcon';
import './sheet.css';

export function EditEntryForm({ entry, photoDataUrl, busy, step, onStepChange, onBack, onClose, storageError, onSave }: { step: AddCaffeineStep; onStepChange: (step: AddCaffeineStep) => void; onBack: () => void; onClose: () => void; storageError: string; entry: CaffeineEntry; photoDataUrl?: string; busy: boolean; onSave: (changes: Pick<CaffeineEntry, 'caffeineMg' | 'consumedAt' | 'startedAt' | 'note'>) => Promise<boolean> }) {
  const [mg, setMg] = useState(String(entry.caffeineMg));
  const [note, setNote] = useState(entry.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inProgress = useRef(false);
  const intakeTime = useIntakeTimeFields(entry);
  const disabled = busy || saving;
  const doseId = useId();

  const formRef = useRef<HTMLFormElement>(null);
  const returnFocus = useRef<string | null>(null);
  const isPicker = step === 'time-start' || step === 'time-end';
  const target = step === 'time-start' ? 'start' : 'end';
  useLayoutEffect(() => {
    if (!isPicker && returnFocus.current) {
      const trigger = formRef.current?.querySelector<HTMLButtonElement>(`[aria-label="${returnFocus.current}"]`);
      trigger?.focus({ preventScroll: true })
      trigger?.scrollIntoView({ block: 'nearest' })
      returnFocus.current = null;
    }
  }, [isPicker]);

  async function save() {
    if (disabled || inProgress.current) return;
    const caffeineMg = Number(mg);
    if (!mg.trim() || !Number.isFinite(caffeineMg) || caffeineMg < 0 || caffeineMg > MAX_CAFFEINE_MG) { setError(`카페인량은 0~${MAX_CAFFEINE_MG}mg 사이로 입력해 주세요.`); return; }
    const timing = intakeTime.resolveTiming();
    if (!timing.timing) { setError(timing.error); return; }
    setError('');
    inProgress.current = true;
    setSaving(true);
    try {
      const saved = await onSave({ caffeineMg, ...timing.timing, note: normalizeIntakeNote(note) });
      if (!saved) setError('기록을 저장하지 못했어요. 다시 시도해 주세요.');
    } catch {
      setError('기록을 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      inProgress.current = false;
      setSaving(false);
    }
  }

  return <BottomSheet className="sheet-dialog--add sheet-dialog--edit" title={isPicker ? (target === 'start' ? '시작 시간 선택' : '종료 시간 선택') : '기록 수정'} onClose={onClose} onBack={isPicker ? onBack : undefined} backLabel="기록 화면으로 돌아가기" onCancel={isPicker ? onBack : undefined}>
    {storageError && <div className="error-message" role="alert">{storageError}</div>}
    <div className={`sheet-step sheet-step--${step}`}>
    {isPicker ? <IntakeTimePicker key={step} value={intakeTime.draft[target].split('T')[1] ?? ''} onCancel={onBack} onDone={time => { intakeTime.pickTime(target, time); setError(''); onBack(); }} /> : <form ref={formRef} className="quick-adjust" noValidate onSubmit={event => { event.preventDefault(); void save(); }}>
    <div className="quick-adjust-heading"><div className="quick-adjust-drink"><span className="quick-adjust-icon"><DrinkIcon photoDataUrl={photoDataUrl} type={entry.icon} size={21} /></span><div><h3>{entry.drinkName}</h3><p>저장된 섭취 기록</p></div></div></div>
    <div className="quick-adjust-content">
    <label className="sr-only" htmlFor={doseId}>카페인량 (mg)</label>
    <CaffeineDoseControl inputId={doseId} value={mg} disabled={disabled} onChange={value => { setMg(value); setError(''); }} />
    <IntakeTimeFields onPickTime={target => { returnFocus.current = target === 'start' ? '마시기 시작한 시각' : '마신 마지막 시각'; onStepChange(target === 'start' ? 'time-start' : 'time-end'); }} draft={intakeTime.draft} disabled={disabled} onChange={draft => { intakeTime.setDraft(draft); setError(''); }} />
    <IntakeNoteField value={note} disabled={disabled} onChange={value => { setNote(value); setError(''); }} />
    {error && <p className="field-error" role="alert">{error}</p>}
    <button className="button-primary quick-adjust-record" disabled={disabled}>{disabled ? '저장하는 중…' : '수정 저장'}</button>
    </div>
  </form>}
  </div>
  </BottomSheet>;
}
