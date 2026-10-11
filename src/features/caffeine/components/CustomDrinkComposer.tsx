import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { DRINK_ICON_OPTIONS } from '../data/drinkIcons'
import { DrinkPhotoInput } from './DrinkPhotoInput'
import { CaffeineDoseControl } from './CaffeineDoseControl'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { CustomDrinkDraft, DrinkCategory, DrinkCategoryId, DrinkIconType } from '../model/caffeine.types'

const CATEGORY_ICONS: Partial<Record<DrinkCategoryId, DrinkIconType>> = {
  coffee: 'coffee', tea: 'tea', energy: 'bolt', other: 'can', misc: 'cup',
}

interface CustomDrinkComposerProps {
  categoryId: DrinkCategoryId
  categories: readonly DrinkCategory[]
  stage: 'details' | 'dose'
  busy: boolean
  onNext: () => void
  onSave: (drink: CustomDrinkDraft) => Promise<boolean>
}

export function CustomDrinkComposer({ categoryId, categories, stage, busy, onSave, onNext }: CustomDrinkComposerProps) {
  const fieldId = useId()
  const category = categories.find(item => item.id === categoryId)
  const nameInput = useRef<HTMLInputElement>(null)
  const amountInput = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>()
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const disabled = busy || photoProcessing
  const [icon, setIcon] = useState<DrinkIconType>(CATEGORY_ICONS[categoryId] ?? 'cup')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [nameError, setNameError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [saveError, setSaveError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || submitting.current) return
    const cleanedName = name.trim()
    const invalidName = !cleanedName || cleanedName.length > 30
    setNameError(invalidName ? '메뉴명을 1~30자로 입력해 주세요.' : '')
    setSaveError('')
    if (invalidName) { nameInput.current?.focus(); return }
    if (stage === 'details') { onNext(); return }
    if (!category) { setSaveError('선택한 카테고리가 없어요. 음료 목록에서 다시 추가해 주세요.'); return }
    const caffeineMg = Number(amount)
    const invalidAmount = amount.trim() === '' || !Number.isFinite(caffeineMg) || !Number.isInteger(caffeineMg) || caffeineMg < 0 || caffeineMg > MAX_CAFFEINE_MG
    setAmountError(invalidAmount ? `카페인량을 0~${MAX_CAFFEINE_MG} 사이의 정수로 입력해 주세요.` : '')
    if (invalidAmount) { amountInput.current?.focus(); return }
    submitting.current = true
    try {
      const saved = await onSave({ categoryId, categoryName: category.name, name: cleanedName, caffeineMg, icon, ...(photoDataUrl ? { photoDataUrl } : {}) })
      if (!saved) setSaveError('음료를 저장하지 못했어요. 다시 시도해 주세요.')
    } catch {
      setSaveError('음료를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      submitting.current = false
    }
  }

  return (
    <form className="sheet-composer" id={`sheet-composer-${categoryId}`} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <ol className="sheet-composer-progress" aria-label="음료 추가 단계">
        <li aria-current={stage === 'details' ? 'step' : undefined}><span aria-hidden="true">1</span>아이콘·메뉴명</li>
        <li aria-current={stage === 'dose' ? 'step' : undefined}><span aria-hidden="true">2</span>카페인량</li>
      </ol>
      <div hidden={stage !== 'details'}>
        <p className="sheet-description">음료를 알아볼 아이콘과 이름을 정해 주세요.</p>
        <fieldset className="sheet-icon-field" disabled={disabled}>
          <legend>아이콘</legend>
          <div className="sheet-icon-options">
            {DRINK_ICON_OPTIONS.map((option) => (
              <button key={option.icon} type="button" className={`sheet-icon-option${!photoDataUrl && icon === option.icon ? ' is-selected' : ''}`} aria-label={option.label} aria-pressed={!photoDataUrl && icon === option.icon} onClick={() => { setIcon(option.icon); setPhotoDataUrl(undefined) }}>
                <DrinkIcon type={option.icon} size={21} />
              </button>
            ))}
            <DrinkPhotoInput photoDataUrl={photoDataUrl} disabled={disabled} onChange={setPhotoDataUrl} onProcessingChange={setPhotoProcessing} />
          </div>
        </fieldset>
        <label className="sheet-field-label" htmlFor={`${fieldId}-name`}>메뉴명</label>
        <input ref={nameInput} id={`${fieldId}-name`} className="field" value={name} onChange={(event) => { setName(event.target.value); setNameError('') }} placeholder="예: 나의 디카페인 라떼" maxLength={30} disabled={disabled} autoComplete="off" enterKeyHint="next" required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? `${fieldId}-name-error` : undefined} />
        {nameError && <p id={`${fieldId}-name-error`} className="field-error" role="alert">{nameError}</p>}
      </div>
      <div hidden={stage !== 'dose'}>
        <div className="sheet-composer-preview">
          <span className="sheet-composer-preview-icon">{photoDataUrl ? <img src={photoDataUrl} alt="" className="drink-photo" /> : <DrinkIcon type={icon} size={24} />}</span>
          <strong>{name.trim()}</strong>
        </div>
        <p className="sheet-description">제품에 표시된 카페인량을 입력해 주세요.</p>
        <label className="sheet-field-label" htmlFor={`${fieldId}-amount`}>카페인량 <span>mg</span></label>
        <CaffeineDoseControl value={amount} disabled={disabled || stage !== 'dose'} onChange={value => { setAmount(value); setAmountError('') }} inputId={`${fieldId}-amount`} inputRef={amountInput} invalid={Boolean(amountError)} describedBy={amountError ? `${fieldId}-amount-error` : undefined} />
        {amountError && <p id={`${fieldId}-amount-error`} className="field-error" role="alert">{amountError}</p>}
      </div>
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
      <button type="submit" className="button-primary sheet-composer-save" disabled={disabled}>{photoProcessing ? '사진을 준비하는 중…' : busy ? '저장하는 중…' : stage === 'details' ? '다음' : '음료 저장'}</button>
    </form>
  )
}
