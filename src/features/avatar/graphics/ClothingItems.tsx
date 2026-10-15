import type { ReactNode } from 'react';
import { TopItem } from './clothing/TopItems';
import { BottomItem } from './clothing/BottomItems';
import { ShoeItem } from './clothing/ShoeItems';

export type ClothingLayer = 'back' | 'body' | 'front' | 'sleeve';

/** All garments use the jelly's own 320 × 366 coordinate space. */
export function ClothingItemGraphic({ itemId, layer, drinking }: {
  itemId: string;
  layer: ClothingLayer;
  drinking: boolean;
}): ReactNode {
  if (itemId.startsWith('top-')) return <TopItem itemId={itemId} layer={layer} drinking={drinking} />;
  if (itemId.startsWith('bottom-')) return <BottomItem itemId={itemId} layer={layer} />;
  if (layer !== 'body') return null;
  if (itemId.startsWith('shoes-')) return <ShoeItem itemId={itemId} />;
  return null;
}
