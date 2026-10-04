import type { Drink, DrinkCategoryId } from '../model/caffeine.types'

export const CATEGORIES: ReadonlyArray<{ id: DrinkCategoryId; name: string }> = [
  { id: 'coffee', name: '커피' },
  { id: 'tea', name: '차' },
  { id: 'energy', name: '에너지·기능성' },
  { id: 'other', name: '탄산·기타' },
]

// Generic starting values only. Actual caffeine varies by product, recipe, and serving size.
// These are not manufacturer-verified measurements.
export const DEFAULT_DRINKS: readonly Drink[] = [
  { id: 'americano', categoryId: 'coffee', name: '아메리카노', caffeineMg: 150, icon: 'coffee', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'cold-brew', categoryId: 'coffee', name: '콜드브루', caffeineMg: 200, icon: 'cup', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'caffe-latte', categoryId: 'coffee', name: '카페라떼', caffeineMg: 100, icon: 'coffee', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'espresso', categoryId: 'coffee', name: '에스프레소', caffeineMg: 65, icon: 'coffee', servingMl: 30, sourceType: 'sample', isCustom: false },
  { id: 'dutch-coffee', categoryId: 'coffee', name: '더치커피', caffeineMg: 160, icon: 'bottle', servingMl: 300, sourceType: 'sample', isCustom: false },
  { id: 'green-tea', categoryId: 'tea', name: '녹차', caffeineMg: 30, icon: 'tea', servingMl: 240, sourceType: 'sample', isCustom: false },
  { id: 'earl-grey', categoryId: 'tea', name: '얼그레이', caffeineMg: 45, icon: 'tea', servingMl: 240, sourceType: 'sample', isCustom: false },
  { id: 'matcha-latte', categoryId: 'tea', name: '말차라떼', caffeineMg: 70, icon: 'cup', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'oolong-tea', categoryId: 'tea', name: '우롱차', caffeineMg: 35, icon: 'tea', servingMl: 240, sourceType: 'sample', isCustom: false },
  { id: 'energy-drink', categoryId: 'energy', name: '에너지드링크', caffeineMg: 100, icon: 'can', servingMl: 250, sourceType: 'sample', isCustom: false },
  { id: 'caffeine-shot', categoryId: 'energy', name: '카페인 샷', caffeineMg: 150, icon: 'bolt', servingMl: 60, sourceType: 'sample', isCustom: false },
  { id: 'cola', categoryId: 'other', name: '콜라', caffeineMg: 35, icon: 'can', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'kombucha', categoryId: 'other', name: '콤부차', caffeineMg: 15, icon: 'bottle', servingMl: 250, sourceType: 'sample', isCustom: false },
]
