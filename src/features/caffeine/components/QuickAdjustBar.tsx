import { useLayoutEffect, useRef, useState } from 'react'
import { Clock3, Trash2 } from 'lucide-react'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import { CaffeineDoseControl } from './CaffeineDoseControl'
import { IntakeNoteField } from './IntakeNoteField'
import type { Drink } from '../model/caffeine.types'
import { IntakeTimeFields } from './IntakeTimeFields'
import type { IntakeTimeTarget } from './IntakeTimePicker'
import type { IntakeTimeDraft } from './useIntakeTimeFields'

interface QuickAdjustBarProps {
  drink: Drink
  caffeineMg: number
  busy: boolean
  error: string
  onChange: (value: number) => void
  onRecord: () => void
  note: string
  onNoteChange: (note: string) => void
  onDelete: () => void
  timingDraft: IntakeTimeDraft
  showInstantTime?: boolean
  onTimingChange: (draft: IntakeTimeDraft) => void
  onPickTime: (target: IntakeTimeTarget) => void
  onTimingToggle: (slow: boolean) => void
}

export function QuickAdjustBar({ drink, caffeineMg, busy, error, onChange, onRecord, note, onNoteChange, onDelete, timingDraft, showInstantTime = false, onTimingChange, onTimingToggle, onPickTime }: QuickAdjustBarProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const deleteButton = useRef<HTMLButtonElement>(null)
  const confirmHeading = useRef<HTMLHeadingElement>(null)
  const restoreDeleteFocus = useRef(false)
  useLayoutEffect(() => {
    if (confirmingDelete) confirmHeading.current?.focus({ preventScroll: true })
    else if (restoreDeleteFocus.current) {
      deleteButton.current?.focus({ preventScroll: true })
      deleteButton.current?.scrollIntoView({ block: 'nearest' })
      restoreDeleteFocus.current = false
    }
  }, [confirmingDelete])
  return (
    <div className={`quick-adjust${timingDraft.slow ? ' quick-adjust--timing' : ''}`}>
      <div className="quick-adjust-heading">
        <div className="quick-adjust-drink">
          <span className="quick-adjust-icon"><DrinkIcon photoDataUrl={drink.photoDataUrl} type={drink.icon} size={21} /></span>
          <div>
            <h3>{drink.name}</h3>
            <p>{drink.isCustom ? '내 음료' : drink.sourceType === 'custom' ? '수정한 기본값' : drink.sourceType === 'official' ? '공식 정보' : '참고용 기본값'}{drink.servingMl ? ` · ${drink.servingMl}ml` : ''}</p>
          </div>
        </div>
        <span className="quick-adjust-time"><Clock3 size={13} aria-hidden="true" /> {timingDraft.slow ? '나눠 마심' : showInstantTime ? '날짜 지정' : '지금'}</span>
      </div>
      <div className="quick-adjust-content">
        {confirmingDelete ? <section className="drink-delete-confirmation" aria-labelledby="drink-delete-title">
          <h3 ref={confirmHeading} tabIndex={-1} id="drink-delete-title">이 음료를 삭제할까요?</h3>
          <p>{drink.name} 음료를 목록에서 삭제해요.</p>
          <p>이미 남긴 섭취 기록은 유지돼요.</p>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="button-secondary" disabled={busy} onClick={() => { restoreDeleteFocus.current = true; setConfirmingDelete(false) }}>취소</button>
            <button type="button" className="button-primary" disabled={busy} onClick={onDelete}>{busy ? '삭제하는 중…' : '삭제하기'}</button>
          </div>
        </section> : <>
        <CaffeineDoseControl value={String(caffeineMg)} disabled={busy} onChange={value => onChange(Number(value))} />
        {caffeineMg === 0 && <p className="quick-adjust-hint">기록하려면 카페인량을 0mg보다 크게 조절해 주세요.</p>}
        <IntakeTimeFields lockDates={!showInstantTime} showInstantTime={showInstantTime} onPickTime={onPickTime} draft={timingDraft} disabled={busy} onChange={onTimingChange} onToggle={onTimingToggle} />
        <IntakeNoteField value={note} disabled={busy} onChange={onNoteChange} />
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="button" className="button-primary quick-adjust-record" disabled={busy || caffeineMg <= 0} onClick={onRecord}>
          {busy ? '기록하는 중…' : timingDraft.slow || showInstantTime ? '기록 저장' : '지금 기록'}
        </button>
        <div className="quick-adjust-delete-action">
          <button ref={deleteButton} type="button" className="quick-adjust-delete" disabled={busy} onClick={() => setConfirmingDelete(true)}><Trash2 size={18} aria-hidden="true" />음료 삭제</button>
        </div>
        </>}
      </div>
    </div>
  )
}
