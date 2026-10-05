import { Check } from 'lucide-react'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import type { Drink } from '../model/caffeine.types'

interface DrinkBadgeProps {
  drink: Drink
  selected: boolean
  disabled: boolean
  onSelect: (drink: Drink) => void
}

export function DrinkBadge({ drink, selected, disabled, onSelect }: DrinkBadgeProps) {
  return (
    <button
      type="button"
      data-drink-id={drink.id}
      className={`drink-badge${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(drink)}
    >
      <DrinkIcon photoDataUrl={drink.photoDataUrl} type={drink.icon} size={18} />
      <span className="drink-badge-name">{drink.name}</span>
      <span className="drink-badge-dose">{drink.caffeineMg}<span>mg</span></span>
      {selected && <Check size={14} strokeWidth={2} aria-hidden="true" className="drink-badge-check" />}
    </button>
  )
}
