import type { AvatarItem, AvatarSlot } from '../model/avatar.types';
import { AvatarItemGraphic, type OutfitLayer } from './AvatarOutfitLayers';

const boxes: Record<AvatarSlot, string> = {
  hat: '86 2 150 112', glasses: '100 89 120 61', top: '58 118 210 143',
  bottom: '75 225 171 92', shoes: '85 260 155 63', accessory: '64 112 200 160',
};
const layers: readonly OutfitLayer[] = ['back', 'body', 'front', 'sleeve'];

/** Shares wearable artwork without mounting a character, animation or sensor hook. */
export function AvatarItemThumbnail({ item }: { item: AvatarItem }) {
  return <svg className="wardrobe-thumbnail" viewBox={boxes[item.slot]} aria-hidden="true" focusable="false">
    {layers.map(layer => <AvatarItemGraphic key={layer} itemId={item.id} slot={item.slot} layer={layer} />)}
  </svg>;
}
