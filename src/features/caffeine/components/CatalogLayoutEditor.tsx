import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Minus, Plus, SlidersHorizontal } from 'lucide-react'
import { DrinkBadgeContent } from './DrinkBadge'
import type { Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { CatalogEditorActions, type CatalogOperations, type CatalogPanel } from './CatalogEditorActions'
import { useCatalogDrag } from './useCatalogDrag'
import { CatalogDragPreview } from './CatalogDragPreview'
import { CategoryNameForm } from './CategoryNameForm'
import { useCatalogLayoutMotion } from './useCatalogLayoutMotion'
import './catalog-layout.css'

interface CatalogLayoutEditorProps extends CatalogOperations {
  categories: readonly DrinkCategory[]
  drinks: Drink[]
  entryCounts: Readonly<Record<string, number>>
  busy: boolean
  error: string
  onClearError: () => void
  onAddDrink: (categoryId: DrinkCategoryId) => void
  initialScrollTop: number
  onScrollPositionChange: (top: number) => void
  focusDrinkId?: string | null
  editing: boolean
  description: string
  onToggleEdit: () => void
  onSelectDrink: (drink: Drink) => void
}

export function CatalogLayoutEditor({ categories, drinks, entryCounts, busy, error, onClearError, onAddDrink, initialScrollTop, onScrollPositionChange, focusDrinkId, editing, description, onToggleEdit, onSelectDrink, ...operations }: CatalogLayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<CatalogPanel | null>(null)
  const [working, setWorking] = useState(false)
  const [actionError, setActionError] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const mounted = useRef(true)
  const pending = useRef(false)
  const panelKey = useRef<string | null>(null)
  const closing = useRef(false)
  const returnFocus = useRef<string | null>(null)
  const newCategoryName = useRef<string | null>(null)
  const disabled = busy || working

  useEffect(() => {
    mounted.current = true
    const sync = () => {
      if (panelKey.current && window.history.state?.catalogPanel !== panelKey.current) {
        panelKey.current = null
        closing.current = false
        setPanel(null)
      }
    }
    window.addEventListener('popstate', sync)
    return () => { mounted.current = false; window.removeEventListener('popstate', sync) }
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = initialScrollTop
    if (focusDrinkId) {
      const control = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-catalog-control]')).find(item => item.dataset.catalogControl === `drink:${focusDrinkId}`)
      control?.focus({ preventScroll: true })
      control?.scrollIntoView({ block: 'nearest' })
    }
    // Restore the editor only on mount; subsequent drags keep their scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (panel || !returnFocus.current) return
    const controls = Array.from(containerRef.current?.parentElement?.querySelectorAll<HTMLButtonElement>('[data-catalog-control]') ?? [])
    const createdCategory = categories.find(item => item.name === newCategoryName.current)
    const focusKey = createdCategory ? `category:${createdCategory.id}` : returnFocus.current
    const control = controls.find(item => item.dataset.catalogControl === focusKey) ?? controls.find(item => item.dataset.catalogControl === 'add')
    control?.focus({ preventScroll: true })
    if (createdCategory) control?.scrollIntoView({ block: 'nearest' })
    newCategoryName.current = null
    returnFocus.current = null
  }, [panel, categories])

  async function write(operation: () => Promise<boolean>, message: string): Promise<boolean> {
    if (disabled || pending.current) return false
    pending.current = true
    setWorking(true)
    setActionError('')
    setAnnouncement('')
    onClearError()
    try {
      const saved = await operation()
      if (mounted.current) {
        if (saved) setAnnouncement('변경 내용을 저장했어요.')
        else setActionError(message)
      }
      return saved
    } catch {
      if (mounted.current) setActionError(message)
      return false
    } finally {
      pending.current = false
      if (mounted.current) setWorking(false)
    }
  }

  const actions: CatalogOperations = {
    onCreateCategory: async name => {
      const saved = await write(() => operations.onCreateCategory(name), '카테고리를 추가하지 못했어요. 다시 시도해 주세요.')
      if (saved) newCategoryName.current = name.trim().normalize('NFC')
      return saved
    },
    onRenameCategory: (id, name) => write(() => operations.onRenameCategory(id, name), '이름을 저장하지 못했어요. 다시 시도해 주세요.'),
    onDeleteCategory: (id, destination) => write(() => operations.onDeleteCategory(id, destination), '카테고리를 삭제하지 못했어요. 다시 시도해 주세요.'),
    onForceDeleteCategory: id => write(() => operations.onForceDeleteCategory(id), '카테고리를 삭제하지 못했어요. 다시 시도해 주세요.'),
    onReorderCategories: ids => write(() => operations.onReorderCategories(ids), '순서를 저장하지 못했어요. 다시 시도해 주세요.'),
    onMoveDrink: (id, destination, before) => write(() => operations.onMoveDrink(id, destination, before), '음료 위치를 저장하지 못했어요. 다시 시도해 주세요.'),
    onDeleteDrink: id => write(() => operations.onDeleteDrink(id), '음료를 삭제하지 못했어요. 다시 시도해 주세요.'),
    onUpdateDrink: (id, draft) => write(() => operations.onUpdateDrink(id, draft), '음료를 저장하지 못했어요. 다시 시도해 주세요.'),
  }
  const drag = useCatalogDrag({ containerRef, categories, drinks, disabled: !editing || disabled || panel !== null, onReorderCategories: actions.onReorderCategories, onMoveDrink: actions.onMoveDrink })
  const layout = JSON.stringify([drag.previewCategories.map(category => category.id), drag.previewDrinks.map(drink => [drink.id, drink.categoryId])])
  useCatalogLayoutMotion(containerRef, layout, drag.drag?.kind, drag.drag?.id, drag.drag?.settling)
  const controlsDisabled = disabled || Boolean(drag.drag) || panel !== null

  function openPanel(next: CatalogPanel, focusKey: string) {
    if (disabled || drag.drag || panel || closing.current) return
    drag.cancel()
    setActionError('')
    onClearError()
    returnFocus.current = focusKey
    panelKey.current = crypto.randomUUID()
    window.history.pushState({ ...window.history.state, catalogPanel: panelKey.current }, '', location.href)
    setPanel(next)
  }

  function closePanel() {
    if (!mounted.current || closing.current || !panelKey.current) return
    if (window.history.state?.catalogPanel === panelKey.current) {
      closing.current = true
      window.history.back()
    } else { panelKey.current = null; setPanel(null) }
  }

  return <div className={`catalog-editor${editing ? ' is-editing' : ''}${panel?.kind === 'category' ? ' is-renaming' : ''}${drag.drag ? ' is-arranging' : ''}${drag.drag?.settling ? ' is-settling' : ''}`} aria-busy={disabled}>
    <div ref={containerRef} className="sheet-scroll catalog-editor-scroll" onScroll={event => onScrollPositionChange(event.currentTarget.scrollTop)}>
      <div className="sheet-list-toolbar">
        <p className="sheet-description">{description}</p>
        <button type="button" className={`catalog-edit-button${editing ? ' is-editing' : ''}`} aria-pressed={editing} disabled={controlsDisabled} onClick={onToggleEdit}>
          {editing ? <Check size={15} aria-hidden="true" /> : <SlidersHorizontal size={15} aria-hidden="true" />}{editing ? '완료' : '편집'}
        </button>
      </div>
      {(error || actionError) && !panel && <p className="field-error" role="alert">{error || actionError}</p>}
      {categories.length === 0 && <div className="empty-state"><p>음료를 담을 카테고리를 먼저 만들어 주세요.</p>{!editing && <button type="button" className="button-secondary" onClick={onToggleEdit}>카테고리 추가</button>}</div>}
      {drag.previewCategories.map(category => {
        const categoryDrinks = drag.previewDrinks.filter(drink => drink.categoryId === category.id)
        const draggingCategory = drag.drag?.kind === 'category' && drag.drag.id === category.id
        const renaming = panel?.kind === 'category' && panel.category.id === category.id
        return <section key={category.id} data-layout-category={category.id} className={`sheet-category catalog-category${draggingCategory ? ' is-dragging' : ''}`} aria-labelledby={`layout-category-${category.id}`}>
          <div className="catalog-category-surface">
          <div data-layout-heading={category.id}>
          <div className="catalog-category-heading">
            {renaming ? <><span id={`layout-category-${category.id}`} className="sr-only">{category.name}</span><CategoryNameForm inline category={category} categories={categories} busy={disabled} title="카테고리 이름 변경" submitLabel="저장" onSave={name => actions.onRenameCategory(category.id, name)} onDone={closePanel} onCancel={closePanel} /></> : <>
              <h3 id={`layout-category-${category.id}`}>{category.name}{editing && <span>{categoryDrinks.length}</span>}</h3>
              {editing && <><button type="button" className="catalog-grip catalog-category-move" data-catalog-control={`category:${category.id}`} aria-label={`${category.name} 카테고리 이름 변경`} aria-pressed={draggingCategory} disabled={controlsDisabled} {...drag.getHandleProps('category', category.id)} onClick={() => openPanel({ kind: 'category', category }, `category:${category.id}`)} />
              <button type="button" className="catalog-remove catalog-category-remove" data-catalog-control={`category-delete:${category.id}`} aria-label={`${category.name} 카테고리 삭제`} disabled={controlsDisabled} onClick={() => openPanel({ kind: 'delete-category', category }, `category-delete:${category.id}`)}><Minus size={13} aria-hidden="true" /></button></>}
            </>}
          </div>
          </div>
          <div data-layout-dropzone={category.id} className="sheet-badges catalog-badges">
            {categoryDrinks.map(drink => {
              const draggingDrink = drag.drag?.kind === 'drink' && drag.drag.id === drink.id
              return <div key={drink.id} data-layout-drink={drink.id} className={`catalog-drink${draggingDrink ? ' is-dragging' : ''}`}>
                <div className="catalog-drink-surface" {...(editing ? drag.getCardProps(drink.id) : {})}>
                <button type="button" className="drink-badge catalog-drink-details" data-drink-id={drink.id} data-catalog-control={`drink:${drink.id}`} aria-label={editing ? `${drink.name} 음료 편집` : undefined} aria-pressed={editing ? draggingDrink : false} disabled={controlsDisabled} onClick={() => editing ? openPanel({ kind: 'drink', drink }, `drink:${drink.id}`) : onSelectDrink(drink)}>
                  <DrinkBadgeContent drink={drink} />
                </button>
                {editing && <button type="button" className="catalog-remove" data-catalog-no-drag aria-label={`${drink.name} 음료 삭제`} disabled={controlsDisabled} onClick={() => openPanel({ kind: 'delete-drink', drink }, `drink:${drink.id}`)}><Minus size={13} aria-hidden="true" /></button>}
                </div>
              </div>
            })}
            <div className="catalog-add-slot" data-layout-add={category.id}><button type="button" className="drink-badge drink-badge-add catalog-add-drink" disabled={controlsDisabled} aria-label={`${category.name}에 내 음료 추가`} onClick={() => onAddDrink(category.id)}><Plus size={19} strokeWidth={1.8} aria-hidden="true" /></button></div>
          </div>
          </div>
        </section>
      })}
    </div>
    <div className={`sheet-empty-footer${editing ? ' catalog-editor-footer' : ''}`}>
      {editing ? <><button type="button" className="text-button" data-catalog-control="add" disabled={controlsDisabled} onClick={() => openPanel({ kind: 'add-category' }, 'add')}><Plus size={17} aria-hidden="true" />카테고리 추가</button><button type="button" className="text-button" data-catalog-control="arrange" disabled={controlsDisabled || categories.length === 0} onClick={() => openPanel({ kind: 'arrange' }, 'arrange')}>배치 변경</button></> : '마신 음료를 선택해 주세요'}
    </div>
    {drag.drag && <CatalogDragPreview drag={drag.drag} categories={categories} drinks={drinks} />}
    {panel && panel.kind !== 'category' && <CatalogEditorActions panel={panel} categories={categories} drinks={drinks} entryCounts={entryCounts} busy={disabled} error={error || actionError} onClose={closePanel} {...actions} />}
    {editing && <><span role="status" className="sr-only" aria-live="polite">{announcement}</span>
    <span role="status" className="sr-only" aria-live="polite">{drag.announcement}</span></>}
  </div>
}
