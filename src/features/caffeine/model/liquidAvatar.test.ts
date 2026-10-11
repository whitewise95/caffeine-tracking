import { describe, expect, it } from 'vitest';
import { liquidAvatarState } from './liquidAvatar';

describe('liquid avatar visual mapping', () => {
  it.each([[0, 'empty'], [20, 'empty'], [21, 'waking'], [79, 'waking'], [80, 'active'], [120, 'active'], [160, 'full'], [220, 'full'], [299, 'full'], [300, 'high']])('maps %s mg to %s', (mg, state) => {
    expect(liquidAvatarState(Number(mg)).state).toBe(state);
  });
  it('fills to the supplied visual capacity and caps growth without capping the amount', () => {
    expect(liquidAvatarState(142, 225).fill).toBeCloseTo(142 / 225);
    const high = liquidAvatarState(5000);
    expect(high.fill).toBe(1);
    expect(high.mg).toBe(5000);
    expect(high.scaleX).toBe(liquidAvatarState(300).scaleX);
    expect(high.scaleY).toBe(liquidAvatarState(300).scaleY);
    expect(high.bubbles).toBeLessThanOrEqual(9);
  });
  it('handles empty, invalid and negative inputs without a false liquid level', () => {
    for (const mg of [0, -1, NaN, Infinity]) {
      expect(liquidAvatarState(mg).fill).toBe(0);
      expect(liquidAvatarState(mg).bubbles).toBe(0);
    }
    for (const capacity of [0, -1, NaN, Infinity]) {
      expect(liquidAvatarState(150, capacity).fill).toBe(.5);
    }
  });
  it('changes volume and height continuously while caffeine falls', () => {
    const before = liquidAvatarState(120);
    const after = liquidAvatarState(119.9);
    expect(after.liquidY).toBeGreaterThan(before.liquidY);
    expect(Math.abs(before.scaleY - after.scaleY)).toBeLessThan(.001);
  });
});
