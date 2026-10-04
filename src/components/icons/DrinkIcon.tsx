import { Coffee, CupSoda, Leaf, Milk, Zap, GlassWater } from 'lucide-react';
import type { DrinkIconType } from '../../features/caffeine/model/caffeine.types';

const icons = { coffee: Coffee, cup: GlassWater, tea: Leaf, bottle: Milk, bolt: Zap, can: CupSoda };
export function DrinkIcon({ type, size = 20 }: { type: DrinkIconType; size?: number }) {
  const Icon = icons[type] ?? Coffee;
  return <Icon size={size} strokeWidth={1.65} aria-hidden="true" />;
}
