import { GLASSES_COLLECTION_ITEMS } from '../data/collections/glassesCollection';
import { GlassesCollectionGraphic } from '../graphics/collections/GlassesCollection';
import { SHOE_COLLECTION_ITEMS } from '../data/collections/shoeCollection';
import { ShoeCollectionGraphic } from '../graphics/collections/ShoeCollection';
import type { ComponentType } from 'react';
import { TOP_COLLECTION_ITEMS } from '../data/collections/topCollection';
import { TopCollectionGraphic } from '../graphics/collections/TopCollection';
import { BOTTOM_COLLECTION_ITEMS } from '../data/collections/bottomCollection';
import { BottomCollectionGraphic } from '../graphics/collections/BottomCollection';
import { HAT_COLLECTION_ITEMS } from '../data/collections/hatCollection';
import { HatCollectionGraphic } from '../graphics/collections/HatCollection';
import { ACCESSORY_COLLECTION_ITEMS } from '../data/collections/accessoryCollection';
import { AccessoryCollectionGraphic } from '../graphics/collections/AccessoryCollection';
import { HeadItemGraphic } from '../graphics/HeadItems';
import { ClothingItemGraphic } from '../graphics/ClothingItems';
import type { AvatarOutfit, AvatarSlot } from '../model/avatar.types';

export type OutfitLayer = 'back' | 'body' | 'front' | 'sleeve';

// Clothes cover the waist before accessories; glasses always sit over the face.
type CollectionGraphicProps = { itemId: string; layer: OutfitLayer; drinking: boolean };
const collectionGraphics = new Map<string, ComponentType<CollectionGraphicProps>>([
  ...TOP_COLLECTION_ITEMS.map(item => [item.id, TopCollectionGraphic] as const),
  ...BOTTOM_COLLECTION_ITEMS.map(item => [item.id, BottomCollectionGraphic] as const),
  ...HAT_COLLECTION_ITEMS.map(item => [item.id, HatCollectionGraphic] as const),
  ...GLASSES_COLLECTION_ITEMS.map(item => [item.id, GlassesCollectionGraphic] as const),
  ...SHOE_COLLECTION_ITEMS.map(item => [item.id, ShoeCollectionGraphic] as const),
  ...ACCESSORY_COLLECTION_ITEMS.map(item => [item.id, AccessoryCollectionGraphic] as const),
]);

const frontOrder: readonly AvatarSlot[] = ['shoes', 'bottom', 'top', 'accessory', 'hat', 'glasses'];
// Backpack/cape fabric sits behind collars and waist rims, then the jelly
// separates those rear edges from the front garment panels.
const backOrder: readonly AvatarSlot[] = ['accessory', 'shoes', 'bottom', 'top', 'hat', 'glasses'];

export function AvatarItemGraphic({ itemId, slot, layer, drinking = false }: {
  itemId: string; slot: AvatarSlot; layer: OutfitLayer; drinking?: boolean;
}) {
  const CollectionGraphic = collectionGraphics.get(itemId);
  if (CollectionGraphic) return <CollectionGraphic itemId={itemId} layer={layer} drinking={drinking} />;
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
