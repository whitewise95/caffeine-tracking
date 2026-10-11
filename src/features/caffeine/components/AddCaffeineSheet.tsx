import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AddCaffeineStep } from '../../../app/router'
import { BottomSheet } from '../../../components/BottomSheet'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { CaffeineIntakeTiming, CustomDrinkDraft, Drink, DrinkCategory, DrinkCategoryId, DrinkEditDraft } from '../model/caffeine.types'
import { CustomDrinkComposer } from './CustomDrinkComposer'
import { CategoryManager } from './CategoryManager'
import { CatalogLayoutEditor } from './CatalogLayoutEditor'
import { QuickAdjustBar } from './QuickAdjustBar'
import { IntakeTimePicker } from './IntakeTimePicker'
import { useIntakeTimeFields } from './useIntakeTimeFields'
import { normalizeIntakeNote } from '../model/intakeNote'
import './sheet.css'

interface AddCaffeineSheetProps {
  drinks: Drink[]
  categoryEntryCounts: Readonly<Record<string, number>>
  categories: readonly DrinkCategory[]
  busy: boolean
  error: string
  step: AddCaffeineStep
  initialConsumedAt?: string
  onStepChange: (step: AddCaffeineStep, replace?: boolean) => void
  onBack: () => void
  onClose: () => void
  onRecord: (drink: Drink, caffeineMg: number, timing?: CaffeineIntakeTiming, note?: string) => Promise<boolean>
  onCreateDrink: (drink: CustomDrinkDraft) => Promise<Drink | null>
  onUpdateDrink: (id: string, draft: DrinkEditDraft) => Promise<boolean>
  onDeleteDrink: (id: string) => Promise<boolean>
  onCreateCategory: (name: string) => Promise<boolean>
  onRenameCategory: (id: DrinkCategoryId, name: string) => Promise<boolean>
  onDeleteCategory: (id: DrinkCategoryId, destinationId?: DrinkCategoryId) => Promise<boolean>
  onForceDeleteCategory: (id: DrinkCategoryId) => Promise<boolean>
  onReorderCategories: (ids: DrinkCategoryId[]) => Promise<boolean>
  onMoveDrink: (id: string, categoryId: DrinkCategoryId, beforeDrinkId?: string) => Promise<boolean>
  onClearError: () => void
}

export function AddCaffeineSheet({ drinks, categories, categoryEntryCounts, busy, error, step, initialConsumedAt, onStepChange, onBack, onClose, onRecord, onCreateDrink, onUpdateDrink, onDeleteDrink, onCreateCategory, onRenameCategory, onDeleteCategory, onForceDeleteCategory, onReorderCategories, onMoveDrink, onClearError }: AddCaffeineSheetProps) {
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null)
  const [caffeineMg, setCaffeineMg] = useState(0)
  const [note, setNote] = useState('')
  const [composerCategory, setComposerCategory] = useState<DrinkCategoryId | null>(null)
  const [working, setWorking] = useState(false)
  const [recordError, setRecordError] = useState('')
  const intakeTime = useIntakeTimeFields(initialConsumedAt ? { consumedAt: initialConsumedAt } : undefined)
  const selectedDateLabel = initialConsumedAt ? new Date(initialConsumedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : null
  const writeInProgress = useRef(false)
  const isBusy = busy || working
  const focusDrinkId = useRef<string | null>(null)
  const listScroll = useRef(0)
  const previousStep = useRef(step)
  const returnFocus = useRef<string | null>(null)
  const recordRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const createdDrink = useRef<Drink | null>(null)
  const composerOrigin = useRef<'select' | 'layout'>('select')
  const layoutFocusDrink = useRef<string | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  // History can restore an old input screen after the modal has been closed.
  const visibleStep = ((step === 'record' || step === 'time-start' || step === 'time-end') && !selectedDrink) || ((step === 'compose' || step === 'compose-dose') && !composerCategory) ? 'select' : step

  useLayoutEffect(() => {
    // Both the modal arrow and browser/Toss back arrive at this list step.
    if ((step === 'select' || step === 'layout') && previousStep.current !== step) {
      setComposerCategory(null)
      setSelectedDrink(null)
      setCaffeineMg(0)
      setNote('')
      setRecordError('')
    }
    previousStep.current = step
    if (step === 'compose' && createdDrink.current) {
      // Consume the dose step, then replace the details step. Back from the
      // saved drink returns to the list instead of an already submitted draft.
      createdDrink.current = null
      if (composerOrigin.current === 'layout') onBack()
      else onStepChange('record', true)
    }
    if (visibleStep === 'compose' || visibleStep === 'compose-dose') composerRef.current?.scrollTo({ top: 0 })
    if (visibleStep !== step) onStepChange('select', true)
    if (visibleStep === 'record' && returnFocus.current) {
      const trigger = recordRef.current?.querySelector<HTMLButtonElement>(`[aria-label="${returnFocus.current}"]`)
      trigger?.focus({ preventScroll: true })
      trigger?.scrollIntoView({ block: 'nearest' })
      returnFocus.current = null
    }
  }, [step, visibleStep, onStepChange, onBack])

  function openComposer(categoryId: DrinkCategoryId, origin: 'select' | 'layout') {
    composerOrigin.current = origin
    layoutFocusDrink.current = null
    setComposerCategory(categoryId)
    onClearError()
    onStepChange('compose')
  }

  function selectDrink(drink: Drink) {
    if (isBusy) return
    focusDrinkId.current = drink.id
    setSelectedDrink(drink)
    setNote('')
    setCaffeineMg(Math.min(drink.caffeineMg, MAX_CAFFEINE_MG))
    setRecordError('')
    onStepChange('record')
  }

  async function recordDrink() {
    if (!selectedDrink || isBusy || writeInProgress.current) return
    if (!Number.isFinite(caffeineMg) || caffeineMg <= 0 || caffeineMg > MAX_CAFFEINE_MG) {
      setRecordError(`카페인량을 0mg보다 크고 ${MAX_CAFFEINE_MG}mg 이하로 조절해 주세요.`)
      return
    }
    const timing = initialConsumedAt || intakeTime.draft.slow ? intakeTime.resolveTiming() : undefined
    if (timing && !timing.timing) { setRecordError(timing.error); return }
    writeInProgress.current = true
    setWorking(true)
    setRecordError('')
    try {
      const saved = await onRecord(selectedDrink, caffeineMg, timing?.timing, normalizeIntakeNote(note))
      if (!saved) setRecordError('기록을 저장하지 못했어요. 다시 시도해 주세요.')
    } catch {
      setRecordError('기록을 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      writeInProgress.current = false
      setWorking(false)
    }
  }

  async function createDrink(draft: CustomDrinkDraft) {
    if (isBusy || writeInProgress.current) return false
    writeInProgress.current = true
    setWorking(true)
    try {
      const drink = await onCreateDrink(draft)
      if (!drink) return false
      // A drink can finish saving after back; keep the returned list unselected.
      if (!mounted.current || previousStep.current !== 'compose-dose') return true
      setSelectedDrink(drink)
      setNote('')
      focusDrinkId.current = drink.id
      setCaffeineMg(Math.min(drink.caffeineMg, MAX_CAFFEINE_MG))
      setRecordError('')
      if (composerOrigin.current === 'layout') layoutFocusDrink.current = drink.id
      createdDrink.current = drink
      onBack()
      return true
    } catch {
      return false
    } finally {
      writeInProgress.current = false
      setWorking(false)
    }
  }

  async function deleteDrink() {
    if (!selectedDrink || isBusy || writeInProgress.current) return
    writeInProgress.current = true
    setWorking(true)
    setRecordError('')
    try {
      const saved = await onDeleteDrink(selectedDrink.id)
      if (!saved) setRecordError('음료를 삭제하지 못했어요. 다시 시도해 주세요.')
      // Browser back can leave or dismiss the sheet during a pending write.
      else if (mounted.current && previousStep.current === 'record') onBack()
    } catch {
      setRecordError('음료를 삭제하지 못했어요. 다시 시도해 주세요.')
    } finally {
      writeInProgress.current = false
      setWorking(false)
    }
  }

  const isPicker = visibleStep === 'time-start' || visibleStep === 'time-end'
  const isCatalog = visibleStep === 'select' || visibleStep === 'layout'
  const target = visibleStep === 'time-start' ? 'start' : 'end'
  const title = isPicker ? (target === 'start' ? '시작 시간 선택' : '종료 시간 선택') : visibleStep === 'categories' ? '카테고리 관리' : visibleStep === 'record' ? '카페인 기록하기' : visibleStep === 'compose-dose' ? '카페인량 설정' : visibleStep === 'compose' ? '내 음료 추가' : '어떤 카페인을 마셨나요?'
  return (
    <BottomSheet backLabel={isPicker ? '기록 화면으로 돌아가기' : visibleStep === 'compose-dose' ? '아이콘과 메뉴명으로 돌아가기' : visibleStep === 'compose' && composerOrigin.current === 'layout' ? '음료 선택 화면으로 돌아가기' : undefined} onCancel={isPicker || visibleStep === 'layout' || visibleStep === 'categories' || visibleStep === 'compose-dose' ? onBack : undefined} title={title} onClose={onClose} onBack={isCatalog ? undefined : onBack} className={`sheet-dialog--add${isCatalog ? ' sheet-dialog--catalog' : ''}${visibleStep === 'layout' ? ' sheet-dialog--layout' : ''}`}>
      {error && visibleStep !== 'categories' && visibleStep !== 'layout' && <div className="error-message" role="alert">{error}</div>}
      <div ref={recordRef} className={`sheet-step sheet-step--${isCatalog ? 'select' : visibleStep}`}>
        {isCatalog && <CatalogLayoutEditor categories={categories} drinks={drinks} entryCounts={categoryEntryCounts} busy={isBusy} error={error} onClearError={onClearError} onCreateCategory={onCreateCategory} onRenameCategory={onRenameCategory} onDeleteCategory={onDeleteCategory} onForceDeleteCategory={onForceDeleteCategory} onReorderCategories={onReorderCategories} onMoveDrink={onMoveDrink} onDeleteDrink={onDeleteDrink} onUpdateDrink={onUpdateDrink} onAddDrink={categoryId => openComposer(categoryId, visibleStep === 'layout' ? 'layout' : 'select')} initialScrollTop={listScroll.current} onScrollPositionChange={top => { listScroll.current = top }} focusDrinkId={visibleStep === 'layout' ? layoutFocusDrink.current : focusDrinkId.current} editing={visibleStep === 'layout'} description={selectedDateLabel ? `${selectedDateLabel}에 마신 한 잔을 기록해요.` : '오늘 마신 한 잔, 가볍게 남겨요.'} onSelectDrink={selectDrink} onToggleEdit={() => { onClearError(); if (visibleStep === 'layout') onBack(); else { layoutFocusDrink.current = null; onStepChange('layout') } }} />}
        {visibleStep === 'record' && selectedDrink && <QuickAdjustBar note={note} onNoteChange={value => { setNote(value); setRecordError('') }} showInstantTime={Boolean(initialConsumedAt)} onDelete={() => void deleteDrink()} onPickTime={target => { returnFocus.current = target === 'start' ? '마시기 시작한 시각' : '마신 마지막 시각'; onStepChange(target === 'start' ? 'time-start' : 'time-end') }} drink={selectedDrink} caffeineMg={caffeineMg} busy={isBusy} error={recordError} onChange={value => { setCaffeineMg(value); setRecordError('') }} onRecord={() => void recordDrink()} timingDraft={intakeTime.draft} onTimingChange={draft => { intakeTime.setDraft(draft); setRecordError('') }} onTimingToggle={slow => { intakeTime.toggleSlow(slow); setRecordError('') }} />}
        {isPicker && <IntakeTimePicker value={intakeTime.draft[target].split('T')[1] ?? ''} onCancel={onBack} onDone={time => { intakeTime.pickTime(target, time, !initialConsumedAt); setRecordError(''); onBack() }} />}
        {(visibleStep === 'compose' || visibleStep === 'compose-dose') && composerCategory && <div ref={composerRef} className="sheet-scroll sheet-composer-scroll">
          <CustomDrinkComposer key={composerCategory} categoryId={composerCategory} categories={categories} stage={visibleStep === 'compose-dose' ? 'dose' : 'details'} busy={isBusy} onSave={createDrink} onNext={() => onStepChange('compose-dose')} />
        </div>}
        {visibleStep === 'categories' && <CategoryManager categories={[...categories]} drinks={drinks} entryCounts={categoryEntryCounts} busy={isBusy} error={error} onCreate={onCreateCategory} onRename={onRenameCategory} onDelete={onDeleteCategory} onForceDelete={onForceDeleteCategory} onReorder={onReorderCategories} onClearError={onClearError} />}
      </div>
    </BottomSheet>
  )
}
