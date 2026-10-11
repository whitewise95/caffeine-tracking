import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { DrinkIcon } from '../../../components/icons/DrinkIcon'
import { DRINK_ICON_OPTIONS } from '../data/drinkIcons'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { Drink, DrinkEditDraft } from '../model/caffeine.types'
import { CaffeineDoseControl } from './CaffeineDoseControl'
import { DrinkPhotoInput } from './DrinkPhotoInput'

export function DrinkEditForm({ drink, drinks, busy, error, onSave, onCancel }: {
  drink: Drink
  drinks: readonly Drink[]
  busy: boolean
  error: string
  onSave: (draft: DrinkEditDraft) => Promise<boolean>
  onCancel: () => void
}) {
  const id = useId()
  const mounted = useRef(true)
  const pending = useRef(false)
  const nameInput = useRef<HTMLInputElement>(null)
  const amountInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(drink.name)
  const [amount, setAmount] = useState(String(drink.caffeineMg))
  const [icon, setIcon] = useState(drink.icon)
  const [photoDataUrl, setPhotoDataUrl] = useState(drink.photoDataUrl)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [nameError, setNameError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [saveError, setSaveError] = useState('')
  const disabled = busy || photoProcessing
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  function validateName() {
    const cleaned = name.normalize('NFC').trim()
    if (!cleaned || cleaned.length > 30) return '메뉴명을 1~30자로 입력해 주세요.'
    if (drinks.some(item => item.id !== drink.id && item.categoryId === drink.categoryId && item.name.normalize('NFC') === cleaned)) return '같은 카테고리에 이미 있는 이름이에요. 다른 이름을 입력해 주세요.'
    return ''
  }
  function validateAmount() {
    const mg = Number(amount)
    return amount.trim() === '' || !Number.isInteger(mg) || mg < 0 || mg > MAX_CAFFEINE_MG
      ? `카페인량을 0~${MAX_CAFFEINE_MG} 사이의 정수로 입력해 주세요.` : ''
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || pending.current) return
    const invalidName = validateName()
    const invalidAmount = validateAmount()
    setNameError(invalidName)
    setAmountError(invalidAmount)
    setSaveError('')
    if (invalidName || invalidAmount) { (invalidName ? nameInput : amountInput).current?.focus(); return }
    pending.current = true
    try {
      const saved = await onSave({ name: name.normalize('NFC').trim(), caffeineMg: Number(amount), icon, ...(photoDataUrl ? { photoDataUrl } : {}) })
      if (mounted.current && !saved) setSaveError('음료를 저장하지 못했어요. 다시 시도해 주세요.')
    } catch {
      if (mounted.current) setSaveError('음료를 저장하지 못했어요. 다시 시도해 주세요.')
    } finally { pending.current = false }
  }

  return <form className="drink-edit-form" onSubmit={event => void submit(event)} noValidate>
    <fieldset className="sheet-icon-field" disabled={disabled}>
      <legend>아이콘</legend>
      <div className="sheet-icon-options">
        {DRINK_ICON_OPTIONS.map(option => <button key={option.icon} type="button" className={`sheet-icon-option${!photoDataUrl && icon === option.icon ? ' is-selected' : ''}`} aria-label={option.label} aria-pressed={!photoDataUrl && icon === option.icon} onClick={() => { setIcon(option.icon); setPhotoDataUrl(undefined); setSaveError('') }}>
          <DrinkIcon type={option.icon} size={21} />
          {!photoDataUrl && icon === option.icon && <Check className="drink-edit-icon-check" size={11} aria-hidden="true" />}
        </button>)}
        {drink.isCustom && <DrinkPhotoInput photoDataUrl={photoDataUrl} disabled={disabled} onChange={setPhotoDataUrl} onProcessingChange={setPhotoProcessing} />}
      </div>
    </fieldset>
    <label className="sheet-field-label" htmlFor={`${id}-name`}>메뉴명</label>
    <input ref={nameInput} id={`${id}-name`} className="field" value={name} onChange={event => { setName(event.target.value); setNameError(''); setSaveError('') }} onBlur={() => setNameError(validateName())} maxLength={30} disabled={disabled} autoComplete="off" enterKeyHint="next" required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? `${id}-name-error` : undefined} />
    {nameError && <p id={`${id}-name-error`} className="field-error" role="alert">{nameError}</p>}
    <label className="sheet-field-label drink-edit-dose-label" htmlFor={`${id}-amount`}>카페인량 <span>mg</span></label>
    <div onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAmountError(validateAmount()) }}>
      <CaffeineDoseControl value={amount} disabled={disabled} onChange={value => { setAmount(value); setAmountError(''); setSaveError('') }} inputId={`${id}-amount`} inputRef={amountInput} invalid={Boolean(amountError)} describedBy={amountError ? `${id}-amount-error` : `${id}-hint`} />
    </div>
    {amountError && <p id={`${id}-amount-error`} className="field-error" role="alert">{amountError}</p>}
    <p id={`${id}-hint`} className="catalog-action-hint">변경 내용은 이후 기록부터 적용해요. 기존 기록은 유지돼요.</p>
    {saveError && <p className="field-error" role="alert">{error || saveError}</p>}
    <div className="drink-edit-actions">
      <button type="button" className="button-secondary" disabled={disabled} onClick={() => { if (!pending.current) onCancel() }}>취소</button>
      <button type="submit" className="button-primary" disabled={disabled}>{busy ? '저장하는 중…' : photoProcessing ? '사진 준비 중…' : '변경 저장'}</button>
    </div>
  </form>
}
