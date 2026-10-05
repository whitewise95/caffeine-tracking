import type { Drink, DrinkCategory } from '../model/caffeine.types'

export const CATEGORIES: readonly DrinkCategory[] = [
  { id: 'coffee', name: '커피' },
  { id: 'tea', name: '차' },
  { id: 'energy', name: '에너지음료' },
  // Keep the old combined category ID for existing carbonated drink records.
  { id: 'other', name: '탄산' },
]

// Generic starting values only. Actual caffeine varies by product, recipe, and serving size.
// These are not manufacturer-verified measurements.
export const DEFAULT_DRINKS: readonly Drink[] = [
  { id: 'americano', categoryId: 'coffee', name: '아메리카노', caffeineMg: 150, icon: 'coffee', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'cold-brew', categoryId: 'coffee', name: '콜드브루', caffeineMg: 200, icon: 'cup', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'caffe-latte', categoryId: 'coffee', name: '카페라떼', caffeineMg: 100, icon: 'coffee', servingMl: 355, sourceType: 'sample', isCustom: false },
  { id: 'green-tea', categoryId: 'tea', name: '녹차', caffeineMg: 30, icon: 'tea', servingMl: 240, sourceType: 'sample', isCustom: false },
  { id: 'earl-grey', categoryId: 'tea', name: '얼그레이', caffeineMg: 45, icon: 'tea', servingMl: 240, sourceType: 'sample', isCustom: false },
  { id: 'oolong-tea', categoryId: 'tea', name: '우롱차', caffeineMg: 35, icon: 'tea', servingMl: 240, sourceType: 'sample', isCustom: false },
  { id: 'energy-drink', categoryId: 'energy', name: '에너지드링크', caffeineMg: 100, icon: 'can', servingMl: 250, sourceType: 'sample', isCustom: false },
  { id: 'cola', categoryId: 'other', name: '콜라', caffeineMg: 35, icon: 'can', servingMl: 355, sourceType: 'sample', isCustom: false },
]
