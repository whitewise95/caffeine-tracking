import { Minus, Plus } from 'lucide-react'
import type { RefObject } from 'react'
import { DrinkBadgeContent } from './DrinkBadge'
import type { Drink, DrinkCategory } from '../model/caffeine.types'

function DrinkPreview({ drink }: { drink: Drink }) {
  return <div className="catalog-drink">
    <div className="catalog-drink-surface">
      <span className="drink-badge catalog-drink-details"><DrinkBadgeContent drink={drink} /></span>
      <span className="catalog-remove"><Minus size={13} /></span>
    </div>
  </div>
}

interface CatalogDragPreviewProps {
  previewRef: RefObject<HTMLDivElement>
  drag: { kind: 'category' | 'drink'; id: string; x: number; y: number; width: number; offsetX: number; offsetY: number; viewportLeft: number; viewportRight: number; settling: boolean }
  categories: readonly DrinkCategory[]
  drinks: readonly Drink[]
}

/** Mirror the grabbed item at its original size without duplicating interactive controls. */
export function CatalogDragPreview({ previewRef, drag, categories, drinks }: CatalogDragPreviewProps) {
  if (drag.settling) return null
  const drink = drag.kind === 'drink' ? drinks.find(item => item.id === drag.id) : undefined
  const category = drag.kind === 'category' ? categories.find(item => item.id === drag.id) : undefined
  const categoryDrinks = category ? drinks.filter(item => item.categoryId === category.id) : []
  const left = Math.max(drag.viewportLeft + 4, Math.min(drag.viewportRight - drag.width - 4, drag.x - drag.offsetX))
  return <div ref={previewRef} className={`catalog-drag-preview catalog-drag-preview--${drag.kind}`} aria-hidden="true" style={{ transform: `translate3d(${left}px, ${drag.y - drag.offsetY}px, 0)`, width: drag.width }}>
    {drink && <DrinkPreview drink={drink} />}
    {category && <div className="catalog-category-surface">
      <div className="catalog-category-heading"><h3>{category.name}<span>{categoryDrinks.length}</span></h3><span className="catalog-remove catalog-category-remove"><Minus size={13} /></span></div>
      <div className="sheet-badges catalog-badges">
        {categoryDrinks.map(item => <DrinkPreview key={item.id} drink={item} />)}
        <span className="drink-badge drink-badge-add catalog-add-drink"><Plus size={19} /></span>
      </div>
    </div>}
  </div>
}
