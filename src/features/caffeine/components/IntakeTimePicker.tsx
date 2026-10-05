import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { displayIntakeTime } from './intakeTimeFormat'
import './time-picker.css'

export type IntakeTimeTarget = 'start' | 'end'
const periods = ['오전', '오후']
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))


function TimeWheel({ label, options, selected, onChange }: {
  label: string
  options: readonly string[]
  selected: number
  onChange: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const latest = useRef(selected)
  const fromScroll = useRef<number | null>(null)
  latest.current = selected
  function rowHeight() { return ref.current?.firstElementChild?.getBoundingClientRect().height || 48 }
  function select(index: number) {
    const next = Math.max(0, Math.min(options.length - 1, index))
    latest.current = next
    fromScroll.current = null
    ref.current?.scrollTo({ top: next * rowHeight(), behavior: 'instant' })
    onChange(next)
  }
  useLayoutEffect(() => {
    if (fromScroll.current === selected) return
    ref.current?.scrollTo({ top: selected * rowHeight(), behavior: 'instant' })
  }, [selected])
  useLayoutEffect(() => {
    const row = ref.current?.firstElementChild
    if (!row) return
    const observer = new ResizeObserver(() => {
      ref.current?.scrollTo({ top: latest.current * rowHeight(), behavior: 'instant' })
    })
    observer.observe(row)
    return () => observer.disconnect()
  }, [])
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 }
    if (event.key === 'Home') select(0)
    else if (event.key === 'End') select(options.length - 1)
    else if (event.key in delta) select(latest.current + delta[event.key])
    else return
    event.preventDefault()
  }
  return <div className="time-wheel-column">
    <span className="time-wheel-label" aria-hidden="true">{label}</span>
    <div className="time-wheel-frame">
      <div className="time-wheel-selection" aria-hidden="true" />
      <div ref={ref} className="time-wheel" role="spinbutton" tabIndex={0} aria-label={label}
        aria-valuemin={label === '시' ? 1 : 0} aria-valuemax={label === '시' ? 12 : options.length - 1}
        aria-valuenow={label === '시' ? selected + 1 : selected} aria-valuetext={`${options[selected]}${label === '오전·오후' ? '' : label}`}
        onKeyDown={onKeyDown} onScroll={event => {
          const index = Math.max(0, Math.min(options.length - 1, Math.round(event.currentTarget.scrollTop / rowHeight())))
          if (index === latest.current) return
          fromScroll.current = index
          latest.current = index
          onChange(index)
        }}>
        {options.map((option, index) => <button type="button" key={option} tabIndex={-1}
          className={`time-wheel-option${index === selected ? ' is-selected' : ''}`}
          aria-label={`${option}${label === '오전·오후' ? '' : label} 선택`}
          onClick={() => { ref.current?.focus({ preventScroll: true }); select(index) }}>{option}</button>)}
      </div>
    </div>
  </div>
}

export function IntakeTimePicker({ value, onDone, onCancel }: { value: string; onDone: (time: string) => void; onCancel: () => void }) {
  const [initialHour, initialMinute] = value.split(':').map(Number)
  const validHour = Number.isInteger(initialHour) && initialHour >= 0 && initialHour <= 23 ? initialHour : new Date().getHours()
  const [period, setPeriod] = useState(validHour < 12 ? 0 : 1)
  const [hour, setHour] = useState((validHour % 12 || 12) - 1)
  const [minute, setMinute] = useState(Number.isInteger(initialMinute) && initialMinute >= 0 && initialMinute <= 59 ? initialMinute : 0)
  const time = `${String((hour + 1) % 12 + period * 12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return <div className="time-picker">
    <div className="time-picker-content">
      <p className="time-picker-preview" aria-live="polite" aria-atomic="true">{displayIntakeTime(time)}</p>
      <p className="time-picker-hint" id="time-picker-hint">위아래로 밀거나 숫자를 눌러 선택해요.</p>
      <div className="time-picker-wheels" role="group" aria-label="시간 선택" aria-describedby="time-picker-hint">
        <TimeWheel label="오전·오후" options={periods} selected={period} onChange={setPeriod} />
        <TimeWheel label="시" options={hours} selected={hour} onChange={setHour} />
        <TimeWheel label="분" options={minutes} selected={minute} onChange={setMinute} />
      </div>
    </div>
    <div className="time-picker-actions"><button type="button" className="button-secondary" onClick={onCancel}>취소</button><button type="button" className="button-primary" onClick={() => onDone(time)}>완료</button></div>
  </div>
}
