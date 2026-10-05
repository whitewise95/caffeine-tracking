import { Plus } from 'lucide-react'
import type { Drink, DrinkCategoryId } from '../model/caffeine.types'
import { DrinkBadge } from './DrinkBadge'

interface DrinkCategorySectionProps {
  category: { id: DrinkCategoryId; name: string }
  drinks: Drink[]
  selectedId?: string
  disabled: boolean
  onSelect: (drink: Drink) => void
  onAdd: () => void
}

export function DrinkCategorySection({ category, drinks, selectedId, disabled, onSelect, onAdd }: DrinkCategorySectionProps) {
  return (
    <section className="sheet-category" aria-labelledby={`sheet-category-${category.id}`}>
      <h3 id={`sheet-category-${category.id}`}>{category.name}</h3>
      <div className="sheet-badges">
        {drinks.map((drink) => (
          <DrinkBadge key={drink.id} drink={drink} selected={selectedId === drink.id} disabled={disabled} onSelect={onSelect} />
        ))}
        <button
          type="button"
          className="drink-badge drink-badge-add"
          aria-label={`${category.name}에 내 음료 추가`}
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
