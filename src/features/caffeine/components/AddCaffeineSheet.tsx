import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import type { AddCaffeineStep } from '../../../app/router'
import { BottomSheet } from '../../../components/BottomSheet'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { CaffeineIntakeTiming, CustomDrinkDraft, Drink, DrinkCategory, DrinkCategoryId } from '../model/caffeine.types'
import { CustomDrinkComposer } from './CustomDrinkComposer'
import { CategoryManager } from './CategoryManager'
import { DrinkCategorySection } from './DrinkCategorySection'
import { QuickAdjustBar } from './QuickAdjustBar'
import { IntakeTimePicker } from './IntakeTimePicker'
import { useIntakeTimeFields } from './useIntakeTimeFields'
import './sheet.css'

interface AddCaffeineSheetProps {
  drinks: Drink[]
  categories: readonly DrinkCategory[]
  busy: boolean
  error: string
  step: AddCaffeineStep
  onStepChange: (step: AddCaffeineStep, replace?: boolean) => void
  onBack: () => void
  onClose: () => void
  onRecord: (drink: Drink, caffeineMg: number, timing?: CaffeineIntakeTiming) => Promise<boolean>
  onCreateDrink: (drink: CustomDrinkDraft) => Promise<Drink | null>
  onDeleteDrink: (id: string) => Promise<boolean>
  onCreateCategory: (name: string) => Promise<boolean>
  onRenameCategory: (id: DrinkCategoryId, name: string) => Promise<boolean>
  onDeleteCategory: (id: DrinkCategoryId, destinationId?: DrinkCategoryId) => Promise<boolean>
  onReorderCategories: (ids: DrinkCategoryId[]) => Promise<boolean>
  onClearError: () => void
}

export function AddCaffeineSheet({ drinks, categories, busy, error, step, onStepChange, onBack, onClose, onRecord, onCreateDrink, onDeleteDrink, onCreateCategory, onRenameCategory, onDeleteCategory, onReorderCategories, onClearError }: AddCaffeineSheetProps) {
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null)
  const [caffeineMg, setCaffeineMg] = useState(0)
  const [composerCategory, setComposerCategory] = useState<DrinkCategoryId | null>(null)
  const [working, setWorking] = useState(false)
  const [recordError, setRecordError] = useState('')
  const intakeTime = useIntakeTimeFields()
  const writeInProgress = useRef(false)
  const isBusy = busy || working
  const listRef = useRef<HTMLDivElement>(null)
  const focusDrinkId = useRef<string | null>(null)
  const listScroll = useRef(0)
  const previousStep = useRef(step)
  const returnFocus = useRef<string | null>(null)
  const recordRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const returningFromCategories = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  // History can restore an old input screen after the modal has been closed.
  const visibleStep = ((step === 'record' || step === 'time-start' || step === 'time-end') && !selectedDrink) || (step === 'compose' && !composerCategory) ? 'select' : step

  useLayoutEffect(() => {
    // Both the modal arrow and browser/Toss back arrive at this list step.
    if (step === 'select' && previousStep.current !== 'select') {
      setSelectedDrink(null)
      setCaffeineMg(0)
      setRecordError('')
    }
    previousStep.current = step
    if (visibleStep === 'compose' && returningFromCategories.current) {
      composerRef.current?.querySelector<HTMLButtonElement>('[aria-label="카테고리 관리"]')?.focus({ preventScroll: true })
      returningFromCategories.current = false
    }
    if (visibleStep !== step) onStepChange('select', true)
    if (visibleStep === 'record' && returnFocus.current) {
      const trigger = recordRef.current?.querySelector<HTMLButtonElement>(`[aria-label="${returnFocus.current}"]`)
      trigger?.focus({ preventScroll: true })
      trigger?.scrollIntoView({ block: 'nearest' })
      returnFocus.current = null
    }
    if (visibleStep !== 'select' || !listRef.current) return
    listRef.current.scrollTop = listScroll.current
    const badge = Array.from(listRef.current.querySelectorAll<HTMLButtonElement>('.drink-badge')).find(element => element.dataset.drinkId === focusDrinkId.current)
    badge?.focus({ preventScroll: true })
  }, [step, visibleStep, onStepChange])

  function selectDrink(drink: Drink) {
    if (isBusy) return
    focusDrinkId.current = drink.id
    setSelectedDrink(drink)
    setCaffeineMg(drink.caffeineMg)
    setRecordError('')
    onStepChange('record')
  }

  async function recordDrink() {
    if (!selectedDrink || isBusy || writeInProgress.current) return
    if (!Number.isFinite(caffeineMg) || caffeineMg <= 0 || caffeineMg > MAX_CAFFEINE_MG) {
      setRecordError(`카페인량을 0mg보다 크고 ${MAX_CAFFEINE_MG}mg 이하로 조절해 주세요.`)
      return
    }
    const timing = intakeTime.draft.slow ? intakeTime.resolveTiming() : undefined
    if (timing && !timing.timing) { setRecordError(timing.error); return }
    writeInProgress.current = true
    setWorking(true)
    setRecordError('')
    try {
      const saved = await onRecord(selectedDrink, caffeineMg, timing?.timing)
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
      if (previousStep.current !== 'compose') return true
      setSelectedDrink(drink)
      focusDrinkId.current = drink.id
      setCaffeineMg(drink.caffeineMg)
      setRecordError('')
      // Creation replaces its screen, so back always returns to the drink list.
      onStepChange('record', true)
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
  const target = visibleStep === 'time-start' ? 'start' : 'end'
  const title = isPicker ? (target === 'start' ? '시작 시간 선택' : '종료 시간 선택') : visibleStep === 'categories' ? '카테고리 관리' : visibleStep === 'record' ? '카페인 기록하기' : visibleStep === 'compose' ? '내 음료 추가' : '어떤 카페인을 마셨나요?'
  return (
    <BottomSheet backLabel={isPicker ? '기록 화면으로 돌아가기' : visibleStep === 'categories' && composerCategory ? '음료 작성으로 돌아가기' : undefined} onCancel={isPicker || visibleStep === 'categories' ? onBack : undefined} title={title} onClose={onClose} onBack={visibleStep === 'select' ? undefined : onBack} className="sheet-dialog--add">
      {error && visibleStep !== 'categories' && <div className="error-message" role="alert">{error}</div>}
      <div ref={recordRef} className={`sheet-step sheet-step--${visibleStep}`}>
        {visibleStep === 'select' && <>
          <div ref={listRef} className="sheet-scroll" onScroll={event => { listScroll.current = event.currentTarget.scrollTop }}>
            <p className="sheet-description">오늘 마신 한 잔, 가볍게 남겨요.</p>
            {categories.length === 0 && <div className="empty-state"><p>음료를 담을 카테고리를 먼저 만들어 주세요.</p><button type="button" className="button-secondary" onClick={() => { setComposerCategory(null); onClearError(); onStepChange('categories') }}>카테고리 관리</button></div>}
            {categories.map(category => (
              <DrinkCategorySection key={category.id} category={category} drinks={drinks.filter(drink => drink.categoryId === category.id)} selectedId={selectedDrink?.id} disabled={isBusy} onSelect={selectDrink} onAdd={() => { setComposerCategory(category.id); onStepChange('compose') }} />
            ))}
            <div className="sheet-data-note">
              <Info size={15} aria-hidden="true" />
              <div>
                <p>브랜드 공식 홈페이지에서 마신 음료와 용량에 맞는 카페인량을 확인해 보세요. 예를 들어 100~150mg으로 안내돼 있다면, 중간값인 125mg이나 최댓값인 150mg으로 기록해 카페인을 관리해보세요.</p>
              </div>
            </div>
          </div>
          <div className="sheet-empty-footer">마신 음료를 선택해 주세요</div>
        </>}
        {visibleStep === 'record' && selectedDrink && <QuickAdjustBar onDelete={() => void deleteDrink()} onPickTime={target => { returnFocus.current = target === 'start' ? '마시기 시작한 시각' : '마신 마지막 시각'; onStepChange(target === 'start' ? 'time-start' : 'time-end') }} drink={selectedDrink} caffeineMg={caffeineMg} busy={isBusy} error={recordError} onChange={value => { setCaffeineMg(value); setRecordError('') }} onRecord={() => void recordDrink()} timingDraft={intakeTime.draft} onTimingChange={draft => { intakeTime.setDraft(draft); setRecordError('') }} onTimingToggle={slow => { intakeTime.toggleSlow(slow); setRecordError('') }} />}
        {isPicker && <IntakeTimePicker value={intakeTime.draft[target].split('T')[1] ?? ''} onCancel={onBack} onDone={time => { intakeTime.setDraft(previous => ({ ...previous, [target]: `${previous[target].split('T')[0]}T${time}` })); setRecordError(''); onBack() }} />}
        {(visibleStep === 'compose' || visibleStep === 'categories') && composerCategory && <div ref={composerRef} className="sheet-scroll sheet-composer-scroll" hidden={visibleStep !== 'compose'}>
          <p className="sheet-description">내가 마시는 음료를 목록에 더해요.</p>
          <CustomDrinkComposer key={composerCategory} categoryId={composerCategory} categories={categories} busy={isBusy} onSave={createDrink} onManageCategories={() => { returningFromCategories.current = true; onClearError(); onStepChange('categories') }} />
        </div>}
        {visibleStep === 'categories' && <CategoryManager categories={[...categories]} drinks={drinks} busy={isBusy} error={error} onCreate={onCreateCategory} onRename={onRenameCategory} onDelete={onDeleteCategory} onReorder={onReorderCategories} onClearError={onClearError} />}
      </div>
    </BottomSheet>
  )
}
