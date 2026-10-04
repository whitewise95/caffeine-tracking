import { useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { CATEGORIES } from '../data/defaultDrinks'
import { MAX_CAFFEINE_MG } from '../model/caffeine'
import type { Drink, DrinkCategoryId } from '../model/caffeine.types'
import { CustomDrinkComposer } from './CustomDrinkComposer'
import { DrinkCategorySection } from './DrinkCategorySection'
import { QuickAdjustBar } from './QuickAdjustBar'
import './sheet.css'

interface AddCaffeineSheetProps {
  drinks: Drink[]
  busy: boolean
  onRecord: (drink: Drink, caffeineMg: number) => Promise<boolean>
  onCreateDrink: (drink: Omit<Drink, 'id' | 'isCustom' | 'sourceType'>) => Promise<Drink | null>
}

export function AddCaffeineSheet({ drinks, busy, onRecord, onCreateDrink }: AddCaffeineSheetProps) {
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null)
  const [caffeineMg, setCaffeineMg] = useState(0)
  const [composerCategory, setComposerCategory] = useState<DrinkCategoryId | null>(null)
  const [working, setWorking] = useState(false)
  const [recordError, setRecordError] = useState('')
  const writeInProgress = useRef(false)
  const isBusy = busy || working

  function selectDrink(drink: Drink) {
    if (isBusy) return
    setSelectedDrink(drink)
    setCaffeineMg(drink.caffeineMg)
    setComposerCategory(null)
    setRecordError('')
  }

  async function recordDrink() {
    if (!selectedDrink || isBusy || writeInProgress.current) return
    if (!Number.isFinite(caffeineMg) || caffeineMg <= 0 || caffeineMg > MAX_CAFFEINE_MG) {
      setRecordError(`카페인량을 0mg보다 크고 ${MAX_CAFFEINE_MG}mg 이하로 조절해 주세요.`)
      return
    }
    writeInProgress.current = true
    setWorking(true)
    setRecordError('')
    try {
      const saved = await onRecord(selectedDrink, caffeineMg)
      if (!saved) setRecordError('기록을 저장하지 못했어요. 다시 시도해 주세요.')
    } catch {
      setRecordError('기록을 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      writeInProgress.current = false
      setWorking(false)
    }
  }

  async function createDrink(draft: Omit<Drink, 'id' | 'isCustom' | 'sourceType'>) {
    if (isBusy || writeInProgress.current) return false
    writeInProgress.current = true
    setWorking(true)
    try {
      const drink = await onCreateDrink(draft)
      if (!drink) return false
      setSelectedDrink(drink)
      setCaffeineMg(drink.caffeineMg)
      setComposerCategory(null)
      setRecordError('')
      return true
    } catch {
      return false
    } finally {
      writeInProgress.current = false
      setWorking(false)
    }
  }

  return (
    <>
      <div className="sheet-scroll">
        <p className="sheet-description">오늘 마신 한 잔, 가볍게 남겨요.</p>
        {CATEGORIES.map((category) => (
          <DrinkCategorySection
            key={category.id}
            category={category}
            drinks={drinks.filter((drink) => drink.categoryId === category.id)}
            selectedId={selectedDrink?.id}
            disabled={isBusy}
            composerOpen={composerCategory === category.id}
            onSelect={selectDrink}
            onAdd={() => setComposerCategory(composerCategory === category.id ? null : category.id)}
          >
            {composerCategory === category.id && <CustomDrinkComposer key={category.id} categoryId={category.id} busy={isBusy} onSave={createDrink} onCancel={() => setComposerCategory(null)} />}
          </DrinkCategorySection>
        ))}
        <div className="sheet-data-note"><Info size={15} aria-hidden="true" /><p>기본 카페인량은 참고용 추정치예요.<br />브랜드와 용량에 따라 다를 수 있어요.</p></div>
      </div>
      {selectedDrink && !composerCategory ? (
        <QuickAdjustBar drink={selectedDrink} caffeineMg={caffeineMg} busy={isBusy} error={recordError} onChange={(value) => { setCaffeineMg(value); setRecordError('') }} onRecord={() => void recordDrink()} />
      ) : !composerCategory ? (
        <div className="sheet-empty-footer">마신 음료를 선택해 주세요</div>
      ) : null}
    </>
  )
}
