import { useState } from 'react';
import { Coffee, CupSoda, Leaf, Milk, Zap, GlassWater } from 'lucide-react';
import type { DrinkIconType } from '../../features/caffeine/model/caffeine.types';

const icons = { coffee: Coffee, cup: GlassWater, tea: Leaf, bottle: Milk, bolt: Zap, can: CupSoda };
export function DrinkIcon({ type, size = 20, photoDataUrl }: { type: DrinkIconType; size?: number; photoDataUrl?: string }) {
  const [failedPhoto, setFailedPhoto] = useState<string>();
  if (photoDataUrl && photoDataUrl !== failedPhoto) return <img className="drink-photo" src={photoDataUrl} alt="" aria-hidden="true" width={size} height={size} decoding="async" onError={() => setFailedPhoto(photoDataUrl)} />;
  const Icon = icons[type] ?? Coffee;
  return <Icon size={size} strokeWidth={1.65} aria-hidden="true" />;
}
