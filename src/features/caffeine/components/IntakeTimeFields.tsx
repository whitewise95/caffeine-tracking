import { useId } from 'react'
import type { IntakeTimeDraft } from './useIntakeTimeFields'
import { localDateTimeInput, parseLocalDateTime } from './useIntakeTimeFields'
import type { IntakeTimeTarget } from './IntakeTimePicker'
import { displayIntakeTime } from './intakeTimeFormat'
import { localDateKey } from '../model/caffeine'
import './intake-time.css'

function IntakeTimeCard({ title, dayHint, timeLabel, dateLabel, value, max, disabled, hintId, onChange, onPickTime }: {
  title: string
  dayHint?: string
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
    <span className="intake-time-label">{title}{dayHint && <span className="intake-time-day-hint">{dayHint}</span>}</span>
    <button className="intake-clock-input" type="button" aria-label={timeLabel} onClick={onPickTime} disabled={disabled} aria-describedby={hintId}>{displayIntakeTime(time)}</button>
    <div className="intake-date-control"><input type="date" aria-label={dateLabel} value={date} max={maxDate} onChange={event => onChange(`${event.target.value}T${time}`)} disabled={disabled} aria-describedby={hintId} required /></div>
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
    <div id={`${id}-fields`} className="intake-time-inputs">
        <div className="intake-period-heading"><span>마신 시간</span>{duration > 0 && <span className="intake-duration" role="status" aria-label="마신 기간" aria-atomic="true">{durationText}</span>}</div>
        <div className="intake-time-range">
          <IntakeTimeCard onPickTime={() => onPickTime('start')} title="시작" timeLabel="마시기 시작한 시각" dateLabel="마시기 시작한 날짜" value={draft.start} max={draft.end && end ? draft.end : maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={start => onChange({ ...draft, start })} />
          <IntakeTimeCard onPickTime={() => onPickTime('end')} title="종료" dayHint={endsNextDay ? '다음 날' : undefined} timeLabel="마신 마지막 시각" dateLabel="마신 마지막 날짜" value={draft.end} max={maxTime} disabled={disabled} hintId={`${id}-hint`} onChange={end => onChange({ ...draft, end })} />
        </div>
        <p className="intake-time-hint" id={`${id}-hint`}>{duration > 0 ? '이 시간 동안 일정하게 나눠 마신 것으로 추정해요.' : '시작과 종료가 같으면 한 시점에 마신 것으로 기록해요.'}</p>
    </div>
  </div>
}
