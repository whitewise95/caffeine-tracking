/** Visual proportions only; these are not medical or recommended intake limits. */
export const DEFAULT_AVATAR_CAPACITY_MG = 300;
export type AvatarState = 'empty' | 'waking' | 'active' | 'full' | 'high';

export function liquidAvatarState(caffeineMg: number, maxCaffeineMg = DEFAULT_AVATAR_CAPACITY_MG) {
  const mg = Number.isFinite(caffeineMg) ? Math.max(0, caffeineMg) : 0;
  const capacity = Number.isFinite(maxCaffeineMg) && maxCaffeineMg > 0 ? maxCaffeineMg : DEFAULT_AVATAR_CAPACITY_MG;
  const fill = Math.min(mg / capacity, 1);
  const state: AvatarState = mg <= 20 ? 'empty' : mg < 80 ? 'waking' : mg < 160 ? 'active' : mg < 300 ? 'full' : 'high';
  const fullness = Math.min(mg / 220, 1);
  return {
    mg, fill, state,
    // Change the outline subtly, without growing indefinitely for large values.
    scaleX: 1 + fullness * .035,
    scaleY: .89 + fullness * .11,
    tilt: -3 * (1 - Math.min(mg / 100, 1)),
    liquidY: 298 - fill * 238,
    bubbles: mg === 0 ? 0 : Math.min(9, 2 + Math.floor(mg / 35)),
    label: ({ empty: '잔존량이 거의 없어요', waking: '조금 남아 있어요', active: '카페인이 남아 있어요', full: '많이 차 있어요', high: '높게 차 있어요' })[state],
  };
}
