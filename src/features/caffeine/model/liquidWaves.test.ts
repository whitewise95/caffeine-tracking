import { describe, expect, it } from 'vitest';
import { liquidWaveAmplitude, liquidWaveHeight } from './liquidWaves';

describe('ambient liquid waves', () => {
  it('has visible rolling crests within the avatar instead of an almost flat surface', () => {
    for (const phase of [0, 1, 3, 5, 8]) {
      const heights = Array.from({ length: 81 }, (_, i) => liquidWaveHeight(80 + i * 2, phase, liquidWaveAmplitude(170)));
      expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(7);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(16);
    }
  });

  it('changes smoothly between 30fps frames and travels rather than merely shifting the whole level', () => {
    for (let phase = 0; phase < 8; phase += .1) {
      for (let x = 80; x <= 240; x += 8) {
        expect(Math.abs(liquidWaveHeight(x, phase + .85 / 30, 6.5) - liquidWaveHeight(x, phase, 6.5))).toBeLessThan(.35);
      }
    }
    const leftChange = liquidWaveHeight(100, 1, 6.5) - liquidWaveHeight(100, 0, 6.5);
    const rightChange = liquidWaveHeight(220, 1, 6.5) - liquidWaveHeight(220, 0, 6.5);
    expect(Math.abs(leftChange - rightChange)).toBeGreaterThan(2);
  });

  it('contains waves within shallow and nearly full liquid, with stronger waves during slosh', () => {
    expect(liquidWaveAmplitude(170, 5)).toBeGreaterThan(liquidWaveAmplitude(170));
    expect(liquidWaveAmplitude(298)).toBe(0);
    for (const level of [60, 100, 170, 290, 297]) {
      for (let phase = 0; phase < 7; phase += .5) {
        for (let x = 80; x <= 240; x += 8) {
          const height = liquidWaveHeight(x, phase, liquidWaveAmplitude(level, 5.5));
          expect(level + height).toBeGreaterThan(53);
          expect(level + height).toBeLessThan(298);
        }
      }
    }
  });
});
