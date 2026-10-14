import { useId } from 'react'
import { Check } from 'lucide-react'
import type { IntakeTimeDraft } from './useIntakeTimeFields'
import { localDateTimeInput, parseLocalDateTime } from './useIntakeTimeFields'
import type { IntakeTimeTarget } from './IntakeTimePicker'
import { displayIntakeTime } from './intakeTimeFormat'
import { localDateKey } from '../model/caffeine'
import './intake-time.css'

function showDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== 'function') return false
  try {
    input.showPicker()
    return true
  } catch {
    // Keep native calendar activation and keyboard editing available in WebViews
    // that restrict programmatic pickers.
    return false
  }
}

interface IntakeTimeFieldProps {
  title?: string
  dayHint?: string
  timeLabel: string
  dateLabel: string
  value: string
  max: string
  disabled: boolean
  hintId: string
  onPickTime: () => void
  onChange: (value: string) => void
}

function IntakeTimeRow({ title, dayHint, timeLabel, dateLabel, value, max, disabled, hintId, onChange, onPickTime }: IntakeTimeFieldProps) {
  const valueId = useId()
  const titleId = useId()
  const [date = '', time = ''] = value.split('T')
  const [maxDate] = max.split('T')
  return <div role="group" className="intake-period-row" aria-label={title ? undefined : '마신 시간'} aria-labelledby={title ? titleId : undefined} aria-describedby={hintId}>
    {title && <div id={titleId} className="intake-period-label">{title}{dayHint && <span className="intake-time-day-hint">{dayHint}</span>}</div>}
    <div className="intake-period-controls">
      <label className="intake-period-control">
        <span className="intake-period-field-label">날짜</span>
        <input className="intake-period-field intake-period-date" type="date" aria-label={dateLabel} value={date} max={maxDate} disabled={disabled} required aria-describedby={hintId}
          onClick={event => showDatePicker(event.currentTarget)}
          onKeyDown={event => {
            if ((event.key === 'Enter' || event.key === ' ') && showDatePicker(event.currentTarget)) {
              event.preventDefault()
            }
          }}
          onChange={event => onChange(`${event.target.value}T${time}`)} />
      </label>
      <div className="intake-period-control">
        <span className="intake-period-field-label" aria-hidden="true">시각</span>
        <button type="button" className="intake-period-field intake-period-time" aria-label={timeLabel} disabled={disabled} aria-describedby={`${valueId} ${hintId}`} onClick={onPickTime}>
          <span id={valueId} className="intake-period-value">{displayIntakeTime(time)}</span>
        </button>
      </div>
    </div>
  </div>
}

export function IntakeTimeFields({ draft, disabled, onChange, onPickTime }: {
  draft: IntakeTimeDraft
  disabled: boolean
  onChange: (draft: IntakeTimeDraft) => void
  onPickTime: (target: IntakeTimeTarget) => void
}) {
  const id = useId()
  const maxTime = localDateTimeInput(new Date())
  const start = parseLocalDateTime(draft.start)
  const end = parseLocalDateTime(draft.end)
  const duration = start && end ? Math.round((end.getTime() - start.getTime()) / 60_000) : 0
  const followingDay = start ? new Date(start) : null
  followingDay?.setDate(followingDay.getDate() + 1)
  const endsNextDay = followingDay && end && localDateKey(followingDay) === localDateKey(end)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  const durationText = `${hours ? `${hours}시간` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes}분` : ''} 동안`

  return <div className="intake-time-fields">
    <div className="intake-mode-selector" role="group" aria-label="마신 방식">
      <button type="button" aria-label="한 번에 마시기" aria-pressed={!draft.slow} disabled={disabled} onClick={() => onChange({ ...draft, slow: false })}>{!draft.slow && <Check size={15} aria-hidden="true" />}한 번에</button>
      <button type="button" aria-label="천천히 마시기" aria-pressed={draft.slow} disabled={disabled} onClick={() => onChange({ ...draft, slow: true })}>{draft.slow && <Check size={15} aria-hidden="true" />}천천히</button>
    </div>
    <div id={`${id}-fields`} className={`intake-time-inputs ${draft.slow ? 'is-period' : 'is-single'}`}>
        <div className="intake-period-heading"><span>마신 시간</span>{draft.slow && duration > 0 && <span className="intake-duration" role="status" aria-label="마신 기간" aria-atomic="true">{durationText}</span>}</div>
        {draft.slow ? <div className="intake-time-range">
          <IntakeTimeRow onPickTime={() => onPickTime('start')} title="시작" timeLabel="마시기 시작한 시각" dateLabel="마시기 시작한 날짜" value={draft.start} max={maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={start => onChange({ ...draft, start })} />
          <IntakeTimeRow onPickTime={() => onPickTime('end')} title="종료" dayHint={endsNextDay ? '다음 날' : undefined} timeLabel="마신 마지막 시각" dateLabel="마신 마지막 날짜" value={draft.end} max={maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={end => onChange({ ...draft, end })} />
        </div> : <IntakeTimeRow onPickTime={() => onPickTime('end')} timeLabel="마신 시각" dateLabel="마신 날짜" value={draft.end} max={maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={end => onChange({ ...draft, end })} />}
        <p className={`intake-time-hint${draft.slow ? '' : ' sr-only'}`} id={`${id}-hint`}>{draft.slow ? draft.endManuallyChanged ? '직접 선택한 종료 시간은 유지돼요.' : '종료를 직접 바꾸기 전에는 시작 30분 뒤로 맞춰요.' : '오늘 마신 음료도 날짜와 시각을 직접 선택할 수 있어요.'}</p>
    </div>
  </div>
}
