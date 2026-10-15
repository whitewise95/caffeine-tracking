import { useLayoutEffect, useRef, useState } from 'react'
import { displayIntakeTime } from './intakeTimeFormat'
import { useTimeWheelGesture } from './useTimeWheelGesture'
import './time-picker.css'

export type IntakeTimeTarget = 'start' | 'end'
const periods = ['오전', '오후']
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))


function TimeWheel({ label, options, selected, onChange, disabled }: {
  label: string
  options: readonly string[]
  selected: number
  onChange: (index: number) => void
  disabled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const latest = useRef(selected)
  const fromScroll = useRef<number | null>(null)
  latest.current = selected
  function updateFromScroll(index: number) {
    if (disabled || index === latest.current) return
    fromScroll.current = index
    latest.current = index
    onChange(index)
  }
  const { stop, ...gestures } = useTimeWheelGesture(ref, options.length, disabled, updateFromScroll)
  function rowHeight() { return ref.current?.firstElementChild?.getBoundingClientRect().height || 48 }
  useLayoutEffect(() => {
    if (fromScroll.current === selected) return
    ref.current?.scrollTo({ top: selected * rowHeight(), behavior: 'instant' })
  }, [selected])
  useLayoutEffect(() => {
    const row = ref.current?.firstElementChild
    if (!row) return
    const observer = new ResizeObserver(() => {
      stop()
      ref.current?.scrollTo({ top: latest.current * rowHeight(), behavior: 'instant' })
    })
    observer.observe(row)
    return () => observer.disconnect()
  }, [stop])
  return <div className="time-wheel-column">
    <span className="time-wheel-label" aria-hidden="true">{label}</span>
    <div className="time-wheel-frame">
      <div className="time-wheel-selection" aria-hidden="true" />
      <div ref={ref} className="time-wheel" role="img" data-time-wheel={label} data-value={label === '시' ? selected + 1 : selected}
        aria-label={`${label} ${options[selected]}${label === '오전·오후' ? '' : label}`} aria-disabled={disabled}
        {...gestures}
        onScroll={event => {
          if (disabled) return
          const index = Math.max(0, Math.min(options.length - 1, Math.round(event.currentTarget.scrollTop / rowHeight())))
          updateFromScroll(index)
        }}>
        {options.map((option, index) => <div key={option} aria-hidden="true"
          className={`time-wheel-option${index === selected ? ' is-selected' : ''}`}>{option}</div>)}
      </div>
    </div>
  </div>
}

export function IntakeTimePicker({ value, onDone, onCancel, disabled = false }: { value: string; onDone: (time: string) => void; onCancel: () => void; disabled?: boolean }) {
  const [initialHour, initialMinute] = value.split(':').map(Number)
  const validHour = Number.isInteger(initialHour) && initialHour >= 0 && initialHour <= 23 ? initialHour : new Date().getHours()
  const [period, setPeriod] = useState(validHour < 12 ? 0 : 1)
  const [hour, setHour] = useState((validHour % 12 || 12) - 1)
  const [minute, setMinute] = useState(Number.isInteger(initialMinute) && initialMinute >= 0 && initialMinute <= 59 ? initialMinute : 0)
  const time = `${String((hour + 1) % 12 + period * 12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return <div className="time-picker">
    <div className="time-picker-content">
      <p className="time-picker-preview" aria-live="polite" aria-atomic="true">{displayIntakeTime(time)}</p>
      <div className="time-picker-wheels" role="group" aria-label="시간 선택">
        <TimeWheel label="오전·오후" options={periods} selected={period} onChange={setPeriod} disabled={disabled} />
        <TimeWheel label="시" options={hours} selected={hour} onChange={setHour} disabled={disabled} />
        <TimeWheel label="분" options={minutes} selected={minute} onChange={setMinute} disabled={disabled} />
      </div>
    </div>
    <div className="time-picker-actions"><button type="button" className="button-secondary" disabled={disabled} onClick={onCancel}>취소</button><button type="button" className="button-primary" disabled={disabled} onClick={() => onDone(time)}>{disabled ? '저장 중…' : '완료'}</button></div>
  </div>
}
