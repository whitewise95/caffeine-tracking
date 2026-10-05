import { useCallback, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, Ref } from 'react'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import { HoldAdjustButton } from './HoldAdjustButton'

interface CaffeineDoseControlProps {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  inputId?: string
  inputRef?: Ref<HTMLInputElement>
  invalid?: boolean
  describedBy?: string
}

export function CaffeineDoseControl({ value, disabled, onChange, inputId, inputRef, invalid, describedBy }: CaffeineDoseControlProps) {
  const numericValue = Number.isFinite(Number(value)) ? Math.min(MAX_CAFFEINE_MG, Math.max(0, Math.round(Number(value)))) : 0
  const currentValue = useRef(numericValue)
  const change = useRef(onChange)
  useLayoutEffect(() => {
    currentValue.current = numericValue
    change.current = onChange
  }, [numericValue, onChange])
  // Accumulate repeated presses even before React commits a new render.
  const adjust = useCallback((delta: number) => {
    const next = Math.min(MAX_CAFFEINE_MG, Math.max(0, currentValue.current + delta))
    currentValue.current = next
    change.current(String(next))
  }, [])

  return <div className="caffeine-dose-control">
    <div className="sheet-dose-controls">
      <HoldAdjustButton direction={-1} disabled={disabled || numericValue === 0} onAdjust={adjust} />
      <div className={`sheet-dose-value${inputId ? '' : ' quick-adjust-amount'}`} aria-live={inputId ? undefined : 'polite'} aria-atomic={inputId ? undefined : true}>
        {inputId
          ? <input ref={inputRef} id={inputId} className="sheet-dose-input" style={{ width: `${Math.max(1, value.length)}ch` }} type="number" inputMode="numeric" min={0} max={MAX_CAFFEINE_MG} step={1} value={value} onChange={event => onChange(event.target.value)} placeholder="0" disabled={disabled} required aria-invalid={invalid} aria-describedby={describedBy} />
          : <strong>{numericValue}</strong>}
        <span aria-hidden={Boolean(inputId)}>mg</span>
      </div>
      <HoldAdjustButton direction={1} disabled={disabled || numericValue === MAX_CAFFEINE_MG} onAdjust={adjust} />
    </div>
    <div className="sheet-dose-slider">
      <input type="range" style={{ '--dose-progress': `${numericValue / MAX_CAFFEINE_MG * 100}%` } as CSSProperties} aria-label="카페인량 조절" aria-valuetext={`${numericValue}mg`} min={0} max={MAX_CAFFEINE_MG} step={1} value={numericValue} disabled={disabled} onChange={event => onChange(event.target.value)} />
      <div className="sheet-dose-limits" aria-hidden="true"><span>0 mg</span><span>{MAX_CAFFEINE_MG} mg</span></div>
    </div>
  </div>
}
