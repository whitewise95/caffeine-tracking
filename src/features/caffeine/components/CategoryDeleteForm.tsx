import { useEffect, useId, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { categoryNameKey } from '../model/drinkCategories'
import { CategoryNameForm } from './CategoryNameForm'

interface CategoryDeleteFormProps {
  category: DrinkCategory
  categories: readonly DrinkCategory[]
  drinkCount: number
  entryCount: number
  busy: boolean
  onCreate: (name: string) => Promise<boolean>
  onDelete: (destinationId?: DrinkCategoryId) => Promise<boolean>
  onForceDelete: () => Promise<boolean>
  onDone: () => void
  onCancel: () => void
  autoFocusCancel?: boolean
}

export function CategoryDeleteForm({ category, categories, drinkCount, entryCount, busy, onCreate, onDelete, onForceDelete, onDone, onCancel, autoFocusCancel = false }: CategoryDeleteFormProps) {
  const id = useId()
  const mounted = useRef(true)
  const submitting = useRef(false)
  const [destinationId, setDestinationId] = useState<DrinkCategoryId | ''>('')
  // Keep the automatically opened form mounted through its successful write;
  // the new destination can reach props before the save promise resolves.
  const [creating, setCreating] = useState(() => drinkCount > 0 && categories.every(item => item.id === category.id))
  const [createdName, setCreatedName] = useState('')
  const [saveError, setSaveError] = useState('')
  const [forceConfirm, setForceConfirm] = useState(false)
  const forceHeading = useRef<HTMLHeadingElement>(null)
  const forceButton = useRef<HTMLButtonElement>(null)
  const wasForceConfirm = useRef(false)
  useEffect(() => {
    if (forceConfirm) forceHeading.current?.focus()
    else if (wasForceConfirm.current) forceButton.current?.focus()
    wasForceConfirm.current = forceConfirm
  }, [forceConfirm])
  const destinations = categories.filter(item => item.id !== category.id)
  const needsDestination = drinkCount > 0
  const validDestination = destinations.some(item => item.id === destinationId)
  const showCreate = needsDestination && (creating || destinations.length === 0)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  useEffect(() => {
    if (!createdName) return
    const created = categories.find(item => item.id !== category.id && categoryNameKey(item.name) === categoryNameKey(createdName))
    if (created) { setDestinationId(created.id); setCreating(false); setCreatedName('') }
  }, [categories, category.id, createdName])

  async function remove(force = false) {
    if (busy || submitting.current || (!force && needsDestination && !validDestination)) return
    submitting.current = true
    setSaveError('')
    try {
      const saved = force ? await onForceDelete() : await onDelete(needsDestination && destinationId ? destinationId : undefined)
      if (!mounted.current) return
      if (saved) onDone()
      else setSaveError('카테고리를 삭제하지 못했어요. 다시 시도해 주세요.')
    } catch {
      if (mounted.current) setSaveError('카테고리를 삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      submitting.current = false
    }
  }

  return <section className="category-manager-delete" aria-labelledby={`${id}-${forceConfirm ? 'force-title' : 'title'}`}>
    {forceConfirm && <div className="category-force-confirm">
      <h3 ref={forceHeading} tabIndex={-1} id={`${id}-force-title`}>‘{category.name}’을 강제 삭제할까요?</h3>
      <p className="category-manager-hint" data-testid="category-force-summary">이 카테고리의 음료 {drinkCount}개와 연결된 섭취 기록 {entryCount}건을 함께 삭제해요. 음료 사진도 삭제되며, 복구할 수 없어요.</p>
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
      <div className="category-manager-actions category-manager-actions--stacked">
        <button type="button" className="button-secondary category-manager-destructive" disabled={busy} onClick={() => void remove(true)}>{busy ? '삭제 중…' : '음료·기록 모두 삭제'}</button>
        <button type="button" className="button-secondary" disabled={busy} onClick={() => { setSaveError(''); setForceConfirm(false) }}>취소</button>
      </div>
    </div>}
    <div hidden={forceConfirm}>
      <h3 id={`${id}-title`}>카테고리를 삭제할까요?</h3>
      <p className="category-manager-hint">{needsDestination ? `‘${category.name}’의 음료 ${drinkCount}개를 다른 카테고리로 옮긴 뒤 삭제하려면, 음료를 이동할 카테고리를 선택해 주세요.` : `‘${category.name}’ 카테고리를 삭제해요. 기존 섭취 기록은 유지돼요.`}</p>
      {needsDestination && <>
        {destinations.length > 0 && <>
          <label htmlFor={`${id}-destination`}>음료를 이동할 카테고리</label>
          <select id={`${id}-destination`} value={validDestination ? destinationId : ''} onChange={event => setDestinationId(event.target.value as DrinkCategoryId | '')} disabled={busy}>
            <option value="" disabled>카테고리를 선택해 주세요</option>
            {destinations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </>}
        {destinations.length === 0 && <p className="category-manager-hint">옮길 카테고리가 없어요. 새 카테고리를 먼저 만들어 주세요.</p>}
        {!showCreate && <button type="button" className="category-manager-inline-add" disabled={busy} onClick={() => setCreating(true)}><Plus size={18} aria-hidden="true" />새 카테고리 만들기</button>}
        {showCreate && <CategoryNameForm categories={categories} busy={busy} title="새 카테고리 만들기" submitLabel="추가" onSave={onCreate} onDone={name => setCreatedName(name)} onCancel={destinations.length > 0 ? () => setCreating(false) : undefined} />}
      </>}
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
      <div className="category-manager-actions">
        <button type="button" className="button-secondary" disabled={busy} onClick={onCancel} autoFocus={autoFocusCancel}>취소</button>
        <button type="button" className="button-secondary category-manager-destructive" disabled={busy || (needsDestination && !validDestination)} onClick={() => void remove()}>{busy ? '저장 중…' : needsDestination ? '음료 이동 후 삭제' : '카테고리 삭제'}</button>
      </div>
      <div className="category-manager-delete-action">
        <button ref={forceButton} type="button" className="category-manager-destructive" disabled={busy} onClick={() => { setSaveError(''); setForceConfirm(true) }}><Trash2 size={18} aria-hidden="true" />강제 삭제</button>
      </div>
    </div>
  </section>
}
