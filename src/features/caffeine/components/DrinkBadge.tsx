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
      <DrinkBadgeContent drink={drink} />
    </button>
  )
}

export function DrinkBadgeContent({ drink }: { drink: Drink }) {
  return <>
    <span className={`drink-badge-icon${drink.photoDataUrl ? ' has-photo' : ''}`}><DrinkIcon photoDataUrl={drink.photoDataUrl} type={drink.icon} size={18} /></span>
    <span className="drink-badge-name">{drink.name}</span>
    <span className="drink-badge-dose">{drink.caffeineMg}<span>mg</span></span>
  </>
}
