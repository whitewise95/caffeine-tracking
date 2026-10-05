import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check } from 'lucide-react'
import { DrinkPhotoInput } from './DrinkPhotoInput'
import { CaffeineDoseControl } from './CaffeineDoseControl'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import { categoryNameKey, isValidCategoryName, MAX_CATEGORY_NAME_LENGTH } from '../model/drinkCategories'
import type { CustomDrinkDraft, DrinkCategory, DrinkCategoryId, DrinkIconType } from '../model/caffeine.types'

const ICON_OPTIONS: ReadonlyArray<{ icon: DrinkIconType; label: string }> = [
  { icon: 'coffee', label: '커피잔' },
  { icon: 'cup', label: '테이크아웃 컵' },
  { icon: 'tea', label: '차' },
  { icon: 'bottle', label: '병' },
  { icon: 'bolt', label: '카페인 샷' },
  { icon: 'can', label: '캔' },
]

const CATEGORY_ICONS: Partial<Record<DrinkCategoryId, DrinkIconType>> = {
  coffee: 'coffee', tea: 'tea', energy: 'bolt', other: 'can', misc: 'cup',
}

interface CustomDrinkComposerProps {
  categoryId: DrinkCategoryId
  categories: readonly DrinkCategory[]
  busy: boolean
  onManageCategories: () => void
  onSave: (drink: CustomDrinkDraft) => Promise<boolean>
}

export function CustomDrinkComposer({ categoryId, categories, busy, onSave, onManageCategories }: CustomDrinkComposerProps) {
  const fieldId = useId()
  const categoryInput = useRef<HTMLInputElement>(null)
  const [categoryChoice, setCategoryChoice] = useState<{ id?: DrinkCategoryId; text: string; matchedName?: string }>(() => {
    const name = categories.find(category => category.id === categoryId)?.name ?? ''
    return { id: categoryId, text: name, matchedName: name }
  })
  // An existing choice follows its stable ID when management renames it. A
  // deleted choice becomes empty instead of recreating the deleted category.
  const chosenCategory = categories.find(category => category.id === categoryChoice.id)
  const categoryName = categoryChoice.id
    ? !chosenCategory ? '' : chosenCategory.name !== categoryChoice.matchedName ? chosenCategory.name : categoryChoice.text
    : categoryChoice.text
  function setCategoryName(text: string) {
    const category = categories.find(item => categoryNameKey(item.name) === categoryNameKey(text))
    setCategoryChoice({ id: category?.id, text, matchedName: category?.name })
  }
  const [categoryError, setCategoryError] = useState('')
  const matchedCategory = categories.find(category => categoryNameKey(category.name) === categoryNameKey(categoryName))
  const nameInput = useRef<HTMLInputElement>(null)
  const amountInput = useRef<HTMLInputElement>(null)
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
    if (disabled) return
    const cleanedName = name.trim()
    const caffeineMg = Number(amount)
    const invalidCategory = !isValidCategoryName(categoryName)
    setCategoryError(invalidCategory ? `카테고리를 1~${MAX_CATEGORY_NAME_LENGTH}자로 입력해 주세요.` : '')
    const invalidName = !cleanedName || cleanedName.length > 30
    const invalidAmount = amount.trim() === '' || !Number.isFinite(caffeineMg) || !Number.isInteger(caffeineMg) || caffeineMg < 0 || caffeineMg > MAX_CAFFEINE_MG
    setNameError(invalidName ? '메뉴명을 1~30자로 입력해 주세요.' : '')
    setAmountError(invalidAmount ? `카페인량을 0~${MAX_CAFFEINE_MG} 사이의 정수로 입력해 주세요.` : '')
    setSaveError('')
    if (invalidCategory || invalidName || invalidAmount) {
      if (invalidCategory) categoryInput.current?.focus()
      else if (invalidName) nameInput.current?.focus()
      else amountInput.current?.focus()
      return
    }
    const saved = await onSave({ categoryName, name: cleanedName, caffeineMg, icon, ...(photoDataUrl ? { photoDataUrl } : {}) })
    if (!saved) setSaveError('음료를 저장하지 못했어요. 다시 시도해 주세요.')
  }

  return (
    <form className="sheet-composer" id={`sheet-composer-${categoryId}`} onSubmit={(event) => void handleSubmit(event)} noValidate>
      <div className="sheet-category-label"><label className="sheet-field-label" htmlFor={`${fieldId}-category`}>카테고리</label><button type="button" className="text-button" aria-label="카테고리 관리" disabled={disabled} onClick={onManageCategories}>관리</button></div>
      <input ref={categoryInput} id={`${fieldId}-category`} className="field" value={categoryName} onChange={event => { setCategoryName(event.target.value); setCategoryError('') }} placeholder="예: 단백질 쉐이크" maxLength={MAX_CATEGORY_NAME_LENGTH} disabled={disabled} autoComplete="off" required aria-invalid={Boolean(categoryError)} aria-describedby={categoryError ? `${fieldId}-category-error` : `${fieldId}-category-hint`} />
      {categoryError && <p id={`${fieldId}-category-error`} className="field-error" role="alert">{categoryError}</p>}
      <div className="sheet-category-options" role="group" aria-label="기존 카테고리">
        {categories.map(category => <button key={category.id} type="button" className={`sheet-category-option${matchedCategory?.id === category.id ? ' is-selected' : ''}`} disabled={disabled} aria-pressed={matchedCategory?.id === category.id} onClick={() => { setCategoryName(category.name); setCategoryError('') }}>
          {category.name}{matchedCategory?.id === category.id && <Check size={13} aria-hidden="true" />}
        </button>)}
      </div>
      <p id={`${fieldId}-category-hint`} className="sheet-composer-hint">{matchedCategory ? '기존 카테고리를 사용해요.' : categoryChoice.id ? '선택했던 카테고리가 삭제됐어요. 다른 카테고리를 선택해 주세요.' : '새 이름을 입력하면 카테고리도 함께 추가돼요.'}</p>
      <fieldset className="sheet-icon-field" disabled={disabled}>
        <legend>아이콘</legend>
        <div className="sheet-icon-options">
          {ICON_OPTIONS.map((option) => (
            <button key={option.icon} type="button" className={`sheet-icon-option${!photoDataUrl && icon === option.icon ? ' is-selected' : ''}`} aria-label={option.label} aria-pressed={!photoDataUrl && icon === option.icon} onClick={() => { setIcon(option.icon); setPhotoDataUrl(undefined) }}>
              <DrinkIcon type={option.icon} size={21} />
              {!photoDataUrl && icon === option.icon && <Check size={10} strokeWidth={2.5} className="sheet-icon-check" aria-hidden="true" />}
            </button>
          ))}
          <DrinkPhotoInput photoDataUrl={photoDataUrl} disabled={disabled} onChange={setPhotoDataUrl} onProcessingChange={setPhotoProcessing} />
        </div>
      </fieldset>
      <label className="sheet-field-label" htmlFor={`${fieldId}-name`}>메뉴명</label>
      <input ref={nameInput} id={`${fieldId}-name`} className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 나의 디카페인 라떼" maxLength={30} disabled={disabled} autoComplete="off" required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? `${fieldId}-name-error` : undefined} />
      {nameError && <p id={`${fieldId}-name-error`} className="field-error" role="alert">{nameError}</p>}
      <label className="sheet-field-label" htmlFor={`${fieldId}-amount`}>카페인량 <span>mg</span></label>
      <CaffeineDoseControl value={amount} disabled={disabled} onChange={value => { setAmount(value); setAmountError('') }} inputId={`${fieldId}-amount`} inputRef={amountInput} invalid={Boolean(amountError)} describedBy={amountError ? `${fieldId}-amount-error` : `${fieldId}-hint`} />
      {amountError && <p id={`${fieldId}-amount-error`} className="field-error" role="alert">{amountError}</p>}
      <p id={`${fieldId}-hint`} className="sheet-composer-hint">제품에 표시된 카페인량을 입력해 주세요.</p>
      <p className="sheet-composer-hint">± 1mg · 길게 누르면 더 빠르게 조절돼요.</p>
      {saveError && <p className="field-error" role="alert">{saveError}</p>}
      <button type="submit" className="button-secondary sheet-composer-save" disabled={disabled}>{photoProcessing ? '사진을 준비하는 중…' : busy ? '저장하는 중…' : '음료 저장'}</button>
    </form>
  )
}
