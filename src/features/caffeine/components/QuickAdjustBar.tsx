import { Clock3, Minus, Plus } from 'lucide-react'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { Drink } from '../model/caffeine.types'

interface QuickAdjustBarProps {
  drink: Drink
  caffeineMg: number
  busy: boolean
  error: string
  onChange: (value: number) => void
  onRecord: () => void
}

export function QuickAdjustBar({ drink, caffeineMg, busy, error, onChange, onRecord }: QuickAdjustBarProps) {
  return (
    <div className="quick-adjust">
      <div className="quick-adjust-heading">
        <div className="quick-adjust-drink">
          <span className="quick-adjust-icon"><DrinkIcon type={drink.icon} size={21} /></span>
          <div>
            <h3>{drink.name}</h3>
            <p>{drink.isCustom ? '내 음료' : drink.sourceType === 'official' ? '공식 정보' : '참고용 기본값'}{drink.servingMl ? ` · ${drink.servingMl}ml` : ''}</p>
          </div>
        </div>
        <span className="quick-adjust-time"><Clock3 size={13} aria-hidden="true" /> 지금</span>
      </div>
      <div className="quick-adjust-controls">
        <button type="button" className="quick-adjust-step" aria-label="카페인 5mg 줄이기" disabled={busy || caffeineMg <= 0} onClick={() => onChange(Math.max(0, caffeineMg - 5))}>
          <Minus size={22} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <div className="quick-adjust-amount" aria-live="polite" aria-atomic="true">
          <strong>{caffeineMg}</strong><span>mg</span>
        </div>
        <button type="button" className="quick-adjust-step" aria-label="카페인 5mg 늘리기" disabled={busy || caffeineMg >= MAX_CAFFEINE_MG} onClick={() => onChange(Math.min(MAX_CAFFEINE_MG, caffeineMg + 5))}>
          <Plus size={22} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <p className="quick-adjust-hint">{caffeineMg === 0 ? '기록하려면 카페인량을 0mg보다 크게 조절해 주세요.' : '5mg씩 조절할 수 있어요'}</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="button" className="button-primary quick-adjust-record" disabled={busy || caffeineMg <= 0} onClick={onRecord}>
        {busy ? '기록하는 중…' : '지금 기록'}
      </button>
    </div>
  )
}
