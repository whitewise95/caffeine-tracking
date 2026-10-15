import { HeadItemGraphic } from '../graphics/HeadItems';
import { ClothingItemGraphic } from '../graphics/ClothingItems';
import type { AvatarOutfit, AvatarSlot } from '../model/avatar.types';

export type OutfitLayer = 'back' | 'body' | 'front' | 'sleeve';

// Clothes cover the waist before accessories; glasses always sit over the face.
const frontOrder: readonly AvatarSlot[] = ['shoes', 'bottom', 'top', 'accessory', 'hat', 'glasses'];
// Backpack/cape fabric sits behind collars and waist rims, then the jelly
// separates those rear edges from the front garment panels.
const backOrder: readonly AvatarSlot[] = ['accessory', 'shoes', 'bottom', 'top', 'hat', 'glasses'];

export function AvatarItemGraphic({ itemId, slot, layer, drinking = false }: {
  itemId: string; slot: AvatarSlot; layer: OutfitLayer; drinking?: boolean;
}) {
  if (slot === 'top' || slot === 'bottom' || slot === 'shoes') {
    return <ClothingItemGraphic itemId={itemId} layer={layer} drinking={drinking} />;
  }
  return layer === 'sleeve' ? null : <HeadItemGraphic itemId={itemId} layer={layer} drinking={drinking} />;
}

export function AvatarOutfitLayers({ outfit, layer, drinking }: {
  outfit?: AvatarOutfit; layer: OutfitLayer; drinking: boolean;
}) {
  if (!outfit) return null;
  return <g className={`avatar-outfit avatar-outfit--${layer}`} aria-hidden="true">
    {(layer === 'back' ? backOrder : frontOrder).map(slot => outfit[slot] && <g key={slot} data-avatar-slot={slot} data-avatar-item={outfit[slot]} data-outfit-layer={layer}>
      <AvatarItemGraphic itemId={outfit[slot]} slot={slot} layer={layer} drinking={drinking} />
    </g>)}
  </g>;
}
