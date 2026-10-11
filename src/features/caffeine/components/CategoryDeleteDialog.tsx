import { useId, useLayoutEffect, useRef } from 'react'
import type { DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { CategoryDeleteForm } from './CategoryDeleteForm'
import './drink-delete-dialog.css'
import './category-delete-dialog.css'

interface CategoryDeleteDialogProps {
  category: DrinkCategory
  categories: readonly DrinkCategory[]
  drinkCount: number
  entryCount: number
  busy: boolean
  onCreate: (name: string) => Promise<boolean>
  onDelete: (destinationId?: DrinkCategoryId) => Promise<boolean>
  onForceDelete: () => Promise<boolean>
  onClose: () => void
}

export function CategoryDeleteDialog({ category, categories, drinkCount, entryCount, busy, onCreate, onDelete, onForceDelete, onClose }: CategoryDeleteDialogProps) {
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pending = useRef(false)

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
  async function write(operation: () => Promise<boolean>) {
    if (busy || pending.current) return false
    pending.current = true
    try { return await operation() }
    finally { pending.current = false }
  }

  return <dialog ref={dialogRef} role="alertdialog" className="drink-delete-dialog category-delete-dialog category-action-sheet" aria-labelledby={`${id}-title`} aria-busy={busy}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); cancel() }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel() } }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) cancel()
    }}>
    <h2 id={`${id}-title`} className="sr-only">카테고리 삭제</h2>
    <CategoryDeleteForm category={category} categories={categories} drinkCount={drinkCount} entryCount={entryCount} busy={busy} onCreate={name => write(() => onCreate(name))} onDelete={destinationId => write(() => onDelete(destinationId))} onForceDelete={() => write(onForceDelete)} onDone={onClose} onCancel={cancel} autoFocusCancel />
  </dialog>
}
