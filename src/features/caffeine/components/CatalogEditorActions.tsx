import { BottomSheet } from '../../../components/BottomSheet'
import type { Drink, DrinkCategory, DrinkCategoryId, DrinkEditDraft } from '../model/caffeine.types'
import { CategoryNameForm } from './CategoryNameForm'
import { DrinkDeleteDialog } from './DrinkDeleteDialog'
import { CategoryDeleteDialog } from './CategoryDeleteDialog'
import { DrinkEditForm } from './DrinkEditForm'
import './category-manager.css'

export type CatalogPanel = { kind: 'add-category' }
  | { kind: 'category' | 'delete-category'; category: DrinkCategory }
  | { kind: 'drink' | 'delete-drink'; drink: Drink }

export interface CatalogOperations {
  onCreateCategory: (name: string) => Promise<boolean>
  onRenameCategory: (id: DrinkCategoryId, name: string) => Promise<boolean>
  onDeleteCategory: (id: DrinkCategoryId, destinationId?: DrinkCategoryId) => Promise<boolean>
  onForceDeleteCategory: (id: DrinkCategoryId) => Promise<boolean>
  onReorderCategories: (ids: DrinkCategoryId[]) => Promise<boolean>
  onMoveDrink: (id: string, categoryId: DrinkCategoryId, beforeDrinkId?: string) => Promise<boolean>
  onUpdateDrink: (id: string, draft: DrinkEditDraft) => Promise<boolean>
  onDeleteDrink: (id: string) => Promise<boolean>
}

interface CatalogEditorActionsProps extends CatalogOperations {
  panel: CatalogPanel
  categories: readonly DrinkCategory[]
  drinks: Drink[]
  entryCounts: Readonly<Record<string, number>>
  busy: boolean
  error: string
  onClose: () => void
}

export function CatalogEditorActions({ panel, categories, drinks, entryCounts, busy, error, onClose, ...operations }: CatalogEditorActionsProps) {
  const category = 'category' in panel ? categories.find(item => item.id === panel.category.id) ?? panel.category : null
  const drink = 'drink' in panel ? drinks.find(item => item.id === panel.drink.id) ?? panel.drink : null
  if (drink && panel.kind === 'delete-drink') return <DrinkDeleteDialog drink={drink} busy={busy} error={error} onDelete={() => operations.onDeleteDrink(drink.id)} onClose={onClose} />
  if (category && panel.kind === 'delete-category') return <CategoryDeleteDialog category={category} categories={categories} drinkCount={drinks.filter(item => item.categoryId === category.id).length} entryCount={entryCounts[category.id] ?? 0} busy={busy} onCreate={operations.onCreateCategory} onDelete={destinationId => operations.onDeleteCategory(category.id, destinationId)} onForceDelete={() => operations.onForceDeleteCategory(category.id)} onClose={onClose} />
  const title = panel.kind === 'add-category' ? '새 카테고리' : '음료 수정'
  return <BottomSheet title={title} className="category-action-sheet catalog-action-sheet" onClose={onClose} onBack={onClose} backLabel="음료 편집으로 돌아가기">
    <div className="category-action-content">
      {panel.kind === 'add-category' && <CategoryNameForm categories={categories} busy={busy} title="새 카테고리" submitLabel="추가" onSave={operations.onCreateCategory} onDone={onClose} onCancel={onClose} />}
      {drink && panel.kind === 'drink' && <DrinkEditForm key={drink.id} drink={drink} drinks={drinks} busy={busy} error={error} onSave={async draft => { const saved = await operations.onUpdateDrink(drink.id, draft); if (saved) onClose(); return saved }} onCancel={onClose} />}
    </div>
  </BottomSheet>
}
