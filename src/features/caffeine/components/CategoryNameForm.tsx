import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Trash2, X } from 'lucide-react'
import type { DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { categoryNameKey, isValidCategoryName, MAX_CATEGORY_NAME_LENGTH } from '../model/drinkCategories'

interface CategoryNameFormProps {
  categories: readonly DrinkCategory[]
  busy: boolean
  category?: DrinkCategory
  title: string
  submitLabel: string
  onSave: (name: string) => Promise<boolean>
  onDone: (name: string) => void
  onCancel?: () => void
  onDelete?: () => void
  inline?: boolean
}

function nameError(name: string, categories: readonly DrinkCategory[], editingId?: DrinkCategoryId): string {
  if (!isValidCategoryName(name)) return `카테고리 이름을 1~${MAX_CATEGORY_NAME_LENGTH}자로 입력해 주세요.`
  if (categories.some(category => category.id !== editingId && categoryNameKey(category.name) === categoryNameKey(name))) return '이미 있는 카테고리 이름이에요. 다른 이름을 입력해 주세요.'
  return ''
}

export function CategoryNameForm({ categories, busy, category, title, submitLabel, onSave, onDone, onCancel, onDelete, inline = false }: CategoryNameFormProps) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)
  const submitting = useRef(false)
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  useEffect(() => {
    mounted.current = true
    input.current?.focus()
    if (inline) input.current?.select()
    return () => { mounted.current = false }
  }, [inline])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || submitting.current) return
    const validation = nameError(name, categories, category?.id)
    setError(validation)
    setSaveError('')
    if (validation) { input.current?.focus(); return }
    submitting.current = true
    try {
      const saved = await onSave(name.trim().normalize('NFC'))
      if (!mounted.current) return
      if (saved) onDone(name.trim().normalize('NFC'))
      else setSaveError('저장하지 못했어요. 입력한 이름을 확인하고 다시 시도해 주세요.')
    } catch {
      if (mounted.current) setSaveError('저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      submitting.current = false
    }
  }

  return <form className={`category-manager-form${inline ? ' catalog-category-name-form' : ''}`} onSubmit={event => void submit(event)} onKeyDown={event => { if (inline && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy && !submitting.current) onCancel?.() } }} noValidate aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`} className={inline ? 'sr-only' : undefined}>{title}</h3>
    <label htmlFor={`${id}-name`} className={inline ? 'sr-only' : undefined}>카테고리 이름</label>
    <input ref={input} id={`${id}-name`} className={inline ? 'field' : undefined} value={name} onChange={event => { setName(event.target.value); setError(''); setSaveError('') }} onBlur={() => { if (inline) setError(nameError(name, categories, category?.id)) }} maxLength={MAX_CATEGORY_NAME_LENGTH} autoComplete="off" enterKeyHint="done" placeholder="예: 나의 차" required disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : `${id}-hint`} />
    <p id={`${id}-hint`} className={inline ? 'sr-only' : 'category-manager-hint'}>최대 {MAX_CATEGORY_NAME_LENGTH}자까지 입력할 수 있어요.</p>
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    {saveError && <p className="field-error" role="alert">{saveError}</p>}
    <div className={inline ? 'catalog-category-name-controls' : `category-manager-actions${onDelete ? ' category-manager-actions--stacked' : ''}`}>
      {onCancel && <button type="button" className="button-secondary" aria-label={inline ? '카테고리 이름 변경 취소' : undefined} disabled={busy} onClick={onCancel}>{inline ? <X size={18} aria-hidden="true" /> : '취소'}</button>}
      <button type="submit" className="button-primary" aria-label={inline ? '카테고리 이름 저장' : undefined} disabled={busy}>{inline ? <Check size={18} aria-hidden="true" /> : busy ? '저장 중…' : submitLabel}</button>
    </div>
    {onDelete && <div className="category-manager-delete-action">
      <button type="button" className="category-manager-destructive" disabled={busy} onClick={onDelete}><Trash2 size={18} aria-hidden="true" />삭제</button>
    </div>}
  </form>
}
