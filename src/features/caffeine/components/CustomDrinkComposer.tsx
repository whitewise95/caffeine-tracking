import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { Drink, DrinkCategoryId, DrinkIconType } from '../model/caffeine.types'

type DrinkDraft = Omit<Drink, 'id' | 'isCustom' | 'sourceType'>

const ICON_OPTIONS: ReadonlyArray<{ icon: DrinkIconType; label: string }> = [
  { icon: 'coffee', label: '커피잔' },
  { icon: 'cup', label: '테이크아웃 컵' },
  { icon: 'tea', label: '차' },
  { icon: 'bottle', label: '병' },
  { icon: 'bolt', label: '카페인 샷' },
  { icon: 'can', label: '캔' },
]

const CATEGORY_ICONS: Record<DrinkCategoryId, DrinkIconType> = {
  coffee: 'coffee', tea: 'tea', energy: 'bolt', other: 'can',
}

interface CustomDrinkComposerProps {
  categoryId: DrinkCategoryId
  busy: boolean
  onSave: (drink: DrinkDraft) => Promise<boolean>
  onCancel: () => void
}

export function CustomDrinkComposer({ categoryId, busy, onSave, onCancel }: CustomDrinkComposerProps) {
  const fieldId = useId()
  const composer = useRef<HTMLFormElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const amountInput = useRef<HTMLInputElement>(null)
  const [icon, setIcon] = useState<DrinkIconType>(CATEGORY_ICONS[categoryId])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [nameError, setNameError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    composer.current?.scrollIntoView({ block: 'nearest' })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const cleanedName = name.trim()
    const caffeineMg = Number(amount)
    const invalidName = !cleanedName || cleanedName.length > 30
    const invalidAmount = amount.trim() === '' || !Number.isFinite(caffeineMg) || !Number.isInteger(caffeineMg) || caffeineMg < 0 || caffeineMg > MAX_CAFFEINE_MG
    setNameError(invalidName ? '메뉴명을 1~30자로 입력해 주세요.' : '')
    setAmountError(invalidAmount ? `카페인량을 0~${MAX_CAFFEINE_MG} 사이의 정수로 입력해 주세요.` : '')
    setSaveError('')
    if (invalidName || invalidAmount) {
      if (invalidName) nameInput.current?.focus()
      else amountInput.current?.focus()
      return
    }
    const saved = await onSave({ categoryId, name: cleanedName, caffeineMg, icon })
    if (!saved) setSaveError('음료를 저장하지 못했어요. 다시 시도해 주세요.')
  }

  return (
    <form ref={composer} className="sheet-composer" id={`sheet-composer-${categoryId}`} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="sheet-composer-heading">
        <h4>내 음료 추가</h4>
        <button type="button" className="icon-button" aria-label="내 음료 추가 취소" onClick={onCancel} disabled={busy}>
          <X size={19} aria-hidden="true" />
        </button>
      </div>
      <fieldset className="sheet-icon-field" disabled={busy}>
        <legend>아이콘</legend>
        <div className="sheet-icon-options">
          {ICON_OPTIONS.map((option) => (
            <button key={option.icon} type="button" className={`sheet-icon-option${icon === option.icon ? ' is-selected' : ''}`} aria-label={option.label} aria-pressed={icon === option.icon} onClick={() => setIcon(option.icon)}>
              <DrinkIcon type={option.icon} size={21} />
              {icon === option.icon && <Check size={10} strokeWidth={2.5} className="sheet-icon-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="sheet-field-label" htmlFor={`${fieldId}-name`}>메뉴명</label>
      <input ref={nameInput} id={`${fieldId}-name`} className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 나의 디카페인 라떼" maxLength={30} disabled={busy} autoComplete="off" required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? `${fieldId}-name-error` : undefined} />
      {nameError && <p id={`${fieldId}-name-error`} className="field-error" role="alert">{nameError}</p>}
      <label className="sheet-field-label" htmlFor={`${fieldId}-amount`}>카페인량 <span>mg</span></label>
      <input ref={amountInput} id={`${fieldId}-amount`} className="field" type="number" inputMode="numeric" min={0} max={MAX_CAFFEINE_MG} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" disabled={busy} required aria-invalid={Boolean(amountError)} aria-describedby={amountError ? `${fieldId}-amount-error` : `${fieldId}-hint`} />
      {amountError && <p id={`${fieldId}-amount-error`} className="field-error" role="alert">{amountError}</p>}
      <p id={`${fieldId}-hint`} className="sheet-composer-hint">제품에 표시된 카페인량을 입력해 주세요.</p>
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
      <button type="submit" className="button-secondary sheet-composer-save" disabled={busy}>{busy ? '저장하는 중…' : '음료 저장'}</button>
    </form>
  )
}
