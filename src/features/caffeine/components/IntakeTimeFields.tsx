import { useId } from 'react'
import { ArrowRight, Clock3 } from 'lucide-react'
import type { IntakeTimeDraft } from './useIntakeTimeFields'
import { localDateTimeInput, parseLocalDateTime } from './useIntakeTimeFields'
import type { IntakeTimeTarget } from './IntakeTimePicker'
import { displayIntakeTime } from './intakeTimeFormat'
import './intake-time.css'

function IntakeTimeCard({ title, timeLabel, dateLabel, value, max, disabled, hintId, onChange, onPickTime }: {
  title: string
  timeLabel: string
  dateLabel: string
  value: string
  max: string
  disabled: boolean
  hintId: string
  onPickTime: () => void
  onChange: (value: string) => void
}) {
  const [date = '', time = ''] = value.split('T')
  const [maxDate] = max.split('T')
  return <div className="intake-time-card">
    <span className="intake-time-label" aria-hidden="true">{title}</span>
    <button className="intake-clock-input" type="button" aria-label={timeLabel} onClick={onPickTime} disabled={disabled} aria-describedby={hintId}>{displayIntakeTime(time)}</button>
    <div className="intake-date-control"><input type="date" aria-label={dateLabel} value={date} max={maxDate} onChange={event => onChange(`${event.target.value}T${time}`)} disabled={disabled} aria-describedby={hintId} required /></div>
  </div>
}

export function IntakeTimeFields({ draft, disabled, showInstantTime = false, onChange, onToggle, onPickTime }: {
  draft: IntakeTimeDraft
  disabled: boolean
  showInstantTime?: boolean
  onChange: (draft: IntakeTimeDraft) => void
  onPickTime: (target: IntakeTimeTarget) => void
  onToggle: (slow: boolean) => void
}) {
  const id = useId()
  const maxTime = localDateTimeInput(new Date())
  const start = parseLocalDateTime(draft.start)
  const end = parseLocalDateTime(draft.end)
  const duration = start && end ? Math.round((end.getTime() - start.getTime()) / 60_000) : 0
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  const durationText = `${hours ? `${hours}시간` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes}분` : ''} 동안`

  return <div className="intake-time-fields">
    <label className="intake-time-toggle">
      <input type="checkbox" role="switch" checked={draft.slow} onChange={event => onToggle(event.target.checked)} disabled={disabled} aria-controls={`${id}-fields`} />
      <Clock3 size={17} strokeWidth={1.7} aria-hidden="true" />
      <span>천천히 마셨어요</span>
      <span className="intake-toggle-track" aria-hidden="true"><span /></span>
    </label>
    <div id={`${id}-fields`} className="intake-time-inputs">
      {draft.slow && <>
        <div className="intake-period-heading"><span>마신 시간</span>{duration > 0 && <span className="intake-duration" role="status" aria-label="마신 기간" aria-atomic="true">{durationText}</span>}</div>
        <div className="intake-time-range">
          <IntakeTimeCard onPickTime={() => onPickTime('start')} title="시작" timeLabel="마시기 시작한 시각" dateLabel="마시기 시작한 날짜" value={draft.start} max={draft.end && end ? draft.end : maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={start => onChange({ ...draft, start })} />
          <span className="intake-time-arrow" aria-hidden="true"><ArrowRight size={14} /></span>
          <IntakeTimeCard onPickTime={() => onPickTime('end')} title="종료" timeLabel="마신 마지막 시각" dateLabel="마신 마지막 날짜" value={draft.end} max={maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={end => onChange({ ...draft, end })} />
        </div>
        <p className="intake-time-hint" id={`${id}-hint`}>이 시간 동안 일정하게 나눠 마신 것으로 추정해요.</p>
      </>}
      {!draft.slow && showInstantTime && <label className="field intake-instant-field">섭취 시각
        <input type="datetime-local" value={draft.end} max={maxTime} onChange={event => onChange({ ...draft, end: event.target.value })} disabled={disabled} required />
      </label>}
    </div>
  </div>
}
