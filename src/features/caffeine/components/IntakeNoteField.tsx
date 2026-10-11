import { useId, useRef } from 'react'
import { limitIntakeNote, MAX_INTAKE_NOTE_LENGTH, noteLength } from '../model/intakeNote'
import './intake-note.css'

export function IntakeNoteField({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (note: string) => void }) {
  const id = useId()
  const composing = useRef(false)
  return <div className="intake-note-field">
    <div className="intake-note-heading">
      <label htmlFor={id}>메모<span aria-hidden="true">선택</span></label>
      <span id={`${id}-count`} className="intake-note-count" aria-label={`최대 ${MAX_INTAKE_NOTE_LENGTH}자`}>{noteLength(value)}/{MAX_INTAKE_NOTE_LENGTH}</span>
    </div>
    <textarea id={id} value={value} disabled={disabled} rows={2} placeholder="이 음료에 대해 남기고 싶은 내용을 적어 주세요" aria-describedby={`${id}-count`}
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={event => { composing.current = false; onChange(limitIntakeNote(event.currentTarget.value)) }}
      onChange={event => onChange(composing.current ? event.target.value : limitIntakeNote(event.target.value))} />
  </div>
}
