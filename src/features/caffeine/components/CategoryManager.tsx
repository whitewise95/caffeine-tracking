import { useEffect, useId, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { CategoryNameForm } from './CategoryNameForm'
import { CategoryDeleteForm } from './CategoryDeleteForm'
import { moveCategoryToIndex } from './categoryDrag'
import { useCategoryDrag } from './useCategoryDrag'
import './category-manager.css'

interface CategoryManagerProps {
  categories: readonly DrinkCategory[]
  drinks: readonly Drink[]
  busy: boolean
  error: string
  onCreate: (name: string) => Promise<boolean>
  onRename: (id: DrinkCategoryId, name: string) => Promise<boolean>
  onDelete: (id: DrinkCategoryId, destinationId?: DrinkCategoryId) => Promise<boolean>
  onReorder: (ids: DrinkCategoryId[]) => Promise<boolean>
  onClearError: () => void
}

type Panel = { kind: 'add' } | { kind: 'manage' | 'rename' | 'delete'; id: DrinkCategoryId } | null

export function CategoryManager({ categories, drinks, busy, error, onCreate, onRename, onDelete, onReorder, onClearError }: CategoryManagerProps) {
  const id = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const writePending = useRef(false)
  const focusReturn = useRef<DrinkCategoryId | 'add' | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [pendingReorder, setPendingReorder] = useState<{ ids: DrinkCategoryId[]; original: DrinkCategoryId[] } | null>(null)
  const disabled = busy || working
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  useEffect(() => {
    if (!focusReturn.current) return
    const controls = Array.from(scrollRef.current?.parentElement?.querySelectorAll<HTMLButtonElement>('[data-category-manage]') ?? [])
    controls.find(button => button.dataset.categoryManage === focusReturn.current)?.focus({ preventScroll: true })
    focusReturn.current = null
  }, [panel])
  useEffect(() => {
    if (pendingReorder && (pendingReorder.original.length !== categories.length || pendingReorder.original.some((value, index) => value !== categories[index]?.id))) setPendingReorder(null)
  }, [categories, pendingReorder])

  async function write(operation: () => Promise<boolean>, fallback: string): Promise<boolean> {
    if (disabled || writePending.current) return false
    writePending.current = true
    setWorking(true)
    setActionError('')
    setAnnouncement('')
    setPendingReorder(null)
    onClearError()
    try {
      const saved = await operation()
      if (mounted.current && !saved) setActionError(fallback)
      return saved
    } catch {
      if (mounted.current) setActionError(fallback)
      return false
    } finally {
      writePending.current = false
      if (mounted.current) setWorking(false)
    }
  }

  async function saveOrder(ids: DrinkCategoryId[]) {
    const original = categories.map(category => category.id)
    const saved = await write(() => onReorder(ids), '순서를 저장하지 못했어요. 다시 시도해 주세요.')
    if (mounted.current && !saved) setPendingReorder({ ids, original })
    return saved
  }

  const drag = useCategoryDrag({ categories, disabled: disabled || panel !== null, scrollRef, onCommit: saveOrder })

  function openPanel(next: Panel) {
    if (disabled || drag.drag) return
    drag.cancel()
    setActionError('')
    setAnnouncement('')
    setPendingReorder(null)
    onClearError()
    setPanel(next)
  }

  function finish(message: string, returnTo: DrinkCategoryId | 'add') {
    if (!mounted.current) return
    setAnnouncement(message)
    focusReturn.current = returnTo
    setPanel(null)
  }

  async function move(category: DrinkCategory, index: number) {
    const saved = await saveOrder(moveCategoryToIndex(categories.map(item => item.id), category.id, index))
    if (saved && mounted.current) setAnnouncement(`${category.name}을 ${index + 1}번째로 이동했어요.`)
  }

  return <div className="category-manager" aria-busy={disabled}>
    <div ref={scrollRef} className="category-manager-scroll">
      <p id={`${id}-instructions`} className="category-manager-hint category-manager-intro">왼쪽 손잡이를 길게 눌러 순서를 바꿔요.<br />이름 변경과 삭제는 ‘관리’에서 할 수 있어요.</p>
      <span id={`${id}-keyboard`} className="sr-only">스페이스로 순서 이동을 시작하고 위아래 방향키로 이동해요. 스페이스 또는 엔터로 저장하고 Esc로 취소해요.</span>
      {(error || actionError) && <p className="field-error category-manager-error" role="alert">{error || actionError}</p>}
      {pendingReorder && <button type="button" className="button-secondary category-manager-retry" disabled={disabled} onClick={() => void saveOrder(pendingReorder.ids).then(saved => { if (saved && mounted.current) setAnnouncement('카테고리 순서를 저장했어요.') })}>순서 다시 저장</button>}
      {panel?.kind === 'add' && <div className="category-manager-panel category-manager-add-form">
        <CategoryNameForm categories={categories} busy={disabled} title="새 카테고리" submitLabel="추가" onSave={name => write(() => onCreate(name), '카테고리를 추가하지 못했어요. 다시 시도해 주세요.')} onDone={name => finish(`${name} 카테고리를 추가했어요.`, 'add')} onCancel={() => { focusReturn.current = 'add'; openPanel(null) }} />
      </div>}
      {categories.length === 0 && panel?.kind !== 'add' && <p className="category-manager-empty">카테고리를 추가해 음료를 모아 보세요.</p>}
      <ul className="category-manager-list" aria-label="음료 카테고리">
        {categories.map((category, index) => {
          const count = drinks.filter(drink => drink.categoryId === category.id).length
          const activePanel = panel && 'id' in panel && panel.id === category.id ? panel.kind : null
          const isDragging = drag.drag?.id === category.id
          const dropBefore = drag.drag && drag.drag.targetIndex !== drag.drag.sourceIndex && drag.drag.targetIndex < drag.drag.sourceIndex && index === drag.drag.targetIndex
          const dropAfter = drag.drag && drag.drag.targetIndex !== drag.drag.sourceIndex && drag.drag.targetIndex > drag.drag.sourceIndex && index === drag.drag.targetIndex
          return <li key={category.id} data-category-row={category.id} className={`category-manager-item${isDragging ? ' is-dragging' : ''}${dropBefore ? ' drop-before' : ''}${dropAfter ? ' drop-after' : ''}`}>
            <div className={`category-manager-row${activePanel ? ' is-open' : ''}`} style={isDragging ? { transform: `translateY(${drag.drag?.offset ?? 0}px)` } : undefined}>
              <button type="button" className="category-manager-grip" aria-label={`${category.name} 카테고리 순서 이동`} aria-describedby={`${id}-keyboard`} aria-pressed={isDragging} disabled={disabled || panel !== null || categories.length < 2} {...drag.handleProps(category.id)}><GripVertical size={22} strokeWidth={1.7} aria-hidden="true" /></button>
              <div className="category-manager-details"><span className="category-manager-name">{category.name}</span><span className="category-manager-count">음료 {count}개</span></div>
              <button type="button" className="category-manager-manage" data-category-manage={category.id} aria-label={`${category.name} 카테고리 관리`} aria-expanded={Boolean(activePanel)} aria-controls={`${id}-panel-${category.id}`} disabled={disabled || Boolean(drag.drag)} onClick={() => openPanel(activePanel ? null : { kind: 'manage', id: category.id })}>관리</button>
            </div>
            {activePanel && <div id={`${id}-panel-${category.id}`} className="category-manager-panel">
              {activePanel === 'manage' && <>
                <div className="category-manager-panel-heading"><h3>{category.name} 관리</h3><button type="button" className="category-manager-close" aria-label="카테고리 관리 닫기" disabled={disabled} onClick={() => { focusReturn.current = category.id; openPanel(null) }}><X size={18} aria-hidden="true" /></button></div>
                <div className="category-manager-tools">
                  <button type="button" disabled={disabled} onClick={() => openPanel({ kind: 'rename', id: category.id })}><Pencil size={18} aria-hidden="true" />이름 변경</button>
                  <button type="button" disabled={disabled} onClick={() => openPanel({ kind: 'delete', id: category.id })}><Trash2 size={18} aria-hidden="true" />삭제</button>
                  <button type="button" disabled={disabled || index === 0} onClick={() => void move(category, index - 1)}><ArrowUp size={18} aria-hidden="true" />위로 이동</button>
                  <button type="button" disabled={disabled || index === categories.length - 1} onClick={() => void move(category, index + 1)}><ArrowDown size={18} aria-hidden="true" />아래로 이동</button>
                </div>
              </>}
              {activePanel === 'rename' && <CategoryNameForm categories={categories} category={category} busy={disabled} title="카테고리 이름 변경" submitLabel="저장" onSave={name => write(() => onRename(category.id, name), '이름을 저장하지 못했어요. 다시 시도해 주세요.')} onDone={name => finish(`${name}으로 이름을 변경했어요.`, category.id)} onCancel={() => openPanel({ kind: 'manage', id: category.id })} />}
              {activePanel === 'delete' && <CategoryDeleteForm category={category} categories={categories} drinkCount={count} busy={disabled} onCreate={name => write(() => onCreate(name), '카테고리를 추가하지 못했어요. 다시 시도해 주세요.')} onDelete={destinationId => write(() => onDelete(category.id, destinationId), '카테고리를 삭제하지 못했어요. 다시 시도해 주세요.')} onDone={() => finish(`${category.name} 카테고리를 삭제했어요.`, 'add')} onCancel={() => openPanel({ kind: 'manage', id: category.id })} />}
            </div>}
          </li>
        })}
      </ul>
    </div>
    <div className="category-manager-footer"><button type="button" className="button-primary" data-category-manage="add" disabled={disabled || Boolean(drag.drag)} aria-expanded={panel?.kind === 'add'} onClick={() => { openPanel({ kind: 'add' }); if (scrollRef.current) scrollRef.current.scrollTop = 0 }}><Plus size={20} aria-hidden="true" />카테고리 추가</button></div>
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement || drag.announcement}</p>
  </div>
}
