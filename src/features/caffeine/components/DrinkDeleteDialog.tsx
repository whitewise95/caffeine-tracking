import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { Drink } from '../model/caffeine.types'
import './drink-delete-dialog.css'

interface DrinkDeleteDialogProps {
  drink: Drink
  busy: boolean
  error: string
  onDelete: () => Promise<boolean>
  onClose: () => void
}

export function DrinkDeleteDialog({ drink, busy, error, onDelete, onClose }: DrinkDeleteDialogProps) {
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)
  const [working, setWorking] = useState(false)
  const disabled = busy || working

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (focused?.isConnected) focused.focus({ preventScroll: true })
    }
  }, [])

  function cancel() { if (!busy && !pending.current) onClose() }
  async function confirm() {
    if (busy || pending.current) return
    pending.current = true
    setWorking(true)
    try { if (await onDelete()) onClose() }
    finally { pending.current = false; setWorking(false) }
  }

  return <dialog ref={dialogRef} role="alertdialog" className="drink-delete-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={disabled}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); cancel() }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel() } }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) cancel()
    }}>
    <h2 id={`${id}-title`}>{drink.name} 음료를 삭제할까요?</h2>
    <p id={`${id}-description`}>음료 목록에서 삭제돼요.<br />이미 남긴 섭취 기록은 유지돼요.</p>
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="drink-delete-dialog-actions">
      <button type="button" className="button-secondary" disabled={disabled} onClick={cancel} autoFocus>취소</button>
      <button type="button" className="button-primary" disabled={disabled} onClick={() => void confirm()}>{disabled ? '삭제하는 중…' : '삭제하기'}</button>
    </div>
  </dialog>
}
