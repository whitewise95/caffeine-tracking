import { useEffect, useId, useRef, useState } from 'react'
import { Settings, Plus } from 'lucide-react'
import type { Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { CategoryNameForm } from './CategoryNameForm'
import { CategoryDeleteForm } from './CategoryDeleteForm'
import { BottomSheet } from '../../../components/BottomSheet'
import { useCategoryDrag } from './useCategoryDrag'
import './category-manager.css'

interface CategoryManagerProps {
  categories: readonly DrinkCategory[]
  drinks: readonly Drink[]
  entryCounts: Readonly<Record<string, number>>
  busy: boolean
  error: string
  onCreate: (name: string) => Promise<boolean>
  onRename: (id: DrinkCategoryId, name: string) => Promise<boolean>
  onDelete: (id: DrinkCategoryId, destinationId?: DrinkCategoryId) => Promise<boolean>
  onForceDelete: (id: DrinkCategoryId) => Promise<boolean>
  onReorder: (ids: DrinkCategoryId[]) => Promise<boolean>
  onClearError: () => void
}

type Panel = { kind: 'add' } | { kind: 'manage' | 'delete'; id: DrinkCategoryId; category?: DrinkCategory } | null

export function CategoryManager({ categories, drinks, entryCounts, busy, error, onCreate, onRename, onDelete, onForceDelete, onReorder, onClearError }: CategoryManagerProps) {
  const id = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const writePending = useRef(false)
  const focusReturn = useRef<DrinkCategoryId | 'add' | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const panelHistory = useRef<string | null>(null)
  const panelClosing = useRef(false)
  useEffect(() => {
    const sync = () => {
      if (panelHistory.current && window.history.state?.categoryPanel !== panelHistory.current) {
        panelHistory.current = null
        panelClosing.current = false
        setPanel(null)
      } else if (panelHistory.current) {
        setPanel(previous => previous && previous.kind !== 'add' ? { ...previous, kind: window.history.state?.categoryPanelStep === 'delete' ? 'delete' : 'manage' } : previous)
      }
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
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
    if (panel || !focusReturn.current) return
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
    if (disabled || drag.drag || panelClosing.current) return
    drag.cancel()
    setActionError('')
    setAnnouncement('')
    setPendingReorder(null)
    onClearError()
    if (next?.kind === 'manage' && panel?.kind === 'delete' && window.history.state?.categoryPanelStep === 'delete') {
      window.history.back()
      return
    }
    if (next && !panelHistory.current) {
      panelHistory.current = crypto.randomUUID()
      window.history.pushState({ ...window.history.state, categoryPanel: panelHistory.current }, '', location.href)
    } else if (next?.kind === 'delete' && panel?.kind !== 'delete') {
      window.history.pushState({ ...window.history.state, categoryPanelStep: 'delete' }, '', location.href)
    }
    if (!next) { closePanel(); return }
    setPanel('id' in next ? { ...next, category: categories.find(category => category.id === next.id) } : next)
  }

  function closePanel() {
    if (disabled || writePending.current || panelClosing.current) return
    if (panelHistory.current && window.history.state?.categoryPanel === panelHistory.current) { panelClosing.current = true; window.history.go(window.history.state?.categoryPanelStep === 'delete' ? -2 : -1) }
    else setPanel(null)
  }

  function finish(message: string, returnTo: DrinkCategoryId | 'add') {
    if (!mounted.current) return
    setAnnouncement(message)
    focusReturn.current = returnTo
    // Finish the child flow, including a delete-confirmation step, at the list.
    if (panelHistory.current && window.history.state?.categoryPanel === panelHistory.current) { panelClosing.current = true; window.history.go(window.history.state?.categoryPanelStep === 'delete' ? -2 : -1) }
    else setPanel(null)
  }

  const selectedCategory = panel && 'id' in panel ? categories.find(category => category.id === panel.id) ?? panel.category : undefined
  const panelTitle = panel?.kind === 'add' ? '새 카테고리' : panel?.kind === 'delete' ? '카테고리 삭제' : `${selectedCategory?.name ?? ''} 관리`

  return <div className="category-manager" aria-busy={disabled}>
    <div ref={scrollRef} className="category-manager-scroll">
      <p id={`${id}-instructions`} className="category-manager-hint category-manager-intro">카테고리를 길게 눌러 순서를 바꿔요.<br />오른쪽 설정 버튼에서 이름 변경과 삭제를 할 수 있어요.</p>
      <span id={`${id}-keyboard`} className="sr-only">스페이스로 순서 이동을 시작하고 위아래 방향키로 이동해요. 스페이스 또는 엔터로 저장하고 Esc로 취소해요.</span>
      {(error || actionError) && <p className="field-error category-manager-error" role="alert">{error || actionError}</p>}
      {pendingReorder && <button type="button" className="button-secondary category-manager-retry" disabled={disabled} onClick={() => void saveOrder(pendingReorder.ids).then(saved => { if (saved && mounted.current) setAnnouncement('카테고리 순서를 저장했어요.') })}>순서 다시 저장</button>}
      {categories.length === 0 && panel?.kind !== 'add' && <p className="category-manager-empty">카테고리를 추가해 음료를 모아 보세요.</p>}
      <ul className={`category-manager-list${drag.drag ? " is-reordering" : ""}`} aria-label="음료 카테고리">
        {categories.map((category, index) => {
          const count = drinks.filter(drink => drink.categoryId === category.id).length
          const activePanel = panel && 'id' in panel && panel.id === category.id ? panel.kind : null
          const isDragging = drag.drag?.id === category.id
          const dropBefore = drag.drag && drag.drag.targetIndex !== drag.drag.sourceIndex && drag.drag.targetIndex < drag.drag.sourceIndex && index === drag.drag.targetIndex
          const dropAfter = drag.drag && drag.drag.targetIndex !== drag.drag.sourceIndex && drag.drag.targetIndex > drag.drag.sourceIndex && index === drag.drag.targetIndex
          return <li key={category.id} data-category-row={category.id} className={`category-manager-item${isDragging ? ' is-dragging' : ''}${dropBefore ? ' drop-before' : ''}${dropAfter ? ' drop-after' : ''}`}>
            <div className={`category-manager-row${activePanel ? ' is-open' : ''}`} {...drag.rowProps(category.id)} style={drag.rowStyle(index)}>
              <button type="button" className="category-manager-details category-manager-reorder" aria-label={`${category.name} 카테고리 순서 이동`} aria-describedby={`${id}-keyboard`} aria-pressed={isDragging} disabled={disabled || panel !== null || categories.length < 2} {...drag.handleProps(category.id)}><span className="category-manager-name">{category.name}</span><span className="category-manager-count">음료 {count}개</span></button>
              <button type="button" className="category-manager-manage" data-category-manage={category.id} aria-label={`${category.name} 카테고리 관리`} aria-expanded={Boolean(activePanel)} aria-haspopup="dialog" disabled={disabled || Boolean(drag.drag)} onClick={() => { focusReturn.current = category.id; openPanel({ kind: 'manage', id: category.id }) }}><Settings size={22} strokeWidth={1.7} aria-hidden="true" /></button>
            </div>
          </li>
        })}
      </ul>
    </div>
    <div className="category-manager-footer"><button type="button" className="button-primary" data-category-manage="add" disabled={disabled || Boolean(drag.drag)} aria-expanded={panel?.kind === 'add'} aria-haspopup="dialog" onClick={() => { focusReturn.current = 'add'; openPanel({ kind: 'add' }) }}><Plus size={20} aria-hidden="true" />카테고리 추가</button></div>
    {panel && (panel.kind === 'add' || selectedCategory) && <BottomSheet title={panelTitle} className="category-action-sheet" onClose={closePanel} onBack={panel.kind === 'delete' ? () => selectedCategory && openPanel({ kind: 'manage', id: selectedCategory.id }) : closePanel} backLabel={panel.kind === 'delete' ? '카테고리 수정으로 돌아가기' : '카테고리 목록으로 돌아가기'}>
      <div className="category-action-content">
        {(error || actionError) && <p className="field-error" role="alert">{error || actionError}</p>}
        {panel.kind === 'add' && <CategoryNameForm categories={categories} busy={disabled} title="새 카테고리" submitLabel="추가" onSave={name => write(() => onCreate(name), '카테고리를 추가하지 못했어요. 다시 시도해 주세요.')} onDone={name => finish(`${name} 카테고리를 추가했어요.`, 'add')} onCancel={closePanel} />}
        {selectedCategory && <div className="category-manager-editor" hidden={panel.kind !== 'manage'}>
          <CategoryNameForm categories={categories} category={selectedCategory} busy={disabled} title="카테고리 이름 변경" submitLabel="저장" onSave={name => write(() => onRename(selectedCategory.id, name), '이름을 저장하지 못했어요. 다시 시도해 주세요.')} onDone={name => finish(`${name}으로 이름을 변경했어요.`, selectedCategory.id)} onDelete={() => openPanel({ kind: 'delete', id: selectedCategory.id })} />
        </div>}
        {selectedCategory && panel.kind === 'delete' && <CategoryDeleteForm category={selectedCategory} categories={categories} drinkCount={drinks.filter(drink => drink.categoryId === selectedCategory.id).length} entryCount={entryCounts[selectedCategory.id] ?? 0} busy={disabled} onCreate={name => write(() => onCreate(name), '카테고리를 추가하지 못했어요. 다시 시도해 주세요.')} onDelete={destinationId => write(() => onDelete(selectedCategory.id, destinationId), '카테고리를 삭제하지 못했어요. 다시 시도해 주세요.')} onForceDelete={() => write(() => onForceDelete(selectedCategory.id), '음료와 기록을 삭제하지 못했어요. 다시 시도해 주세요.')} onDone={() => finish(`${selectedCategory.name} 카테고리를 삭제했어요.`, 'add')} onCancel={() => openPanel({ kind: 'manage', id: selectedCategory.id })} />}
      </div>
    </BottomSheet>}
    <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement || drag.announcement}</p>
  </div>
}
