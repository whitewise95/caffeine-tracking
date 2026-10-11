import type { DrinkIconType } from '../model/caffeine.types'

export const DRINK_ICON_OPTIONS: ReadonlyArray<{ icon: DrinkIconType; label: string }> = [
  { icon: 'coffee', label: '커피잔' },
  { icon: 'cup', label: '테이크아웃 컵' },
  { icon: 'tea', label: '차' },
  { icon: 'bottle', label: '병' },
  { icon: 'bolt', label: '카페인 샷' },
  { icon: 'can', label: '캔' },
]
