import { describe, expect, it } from 'vitest';
import { gravityAngle, liquidSurfaceOffset, stepLiquidSpring, type Point, type SpringState } from './liquidGravity';
import { liquidWaveAmplitude, liquidWaveHeight } from './liquidWaves';

// An irregular, upright body with a wide middle and narrower head/legs. A plain
// rectangle would hide the area change caused by rotating around a fixed height.
const bodyPoints: Point[] = [];
for (let y = 42; y <= 314; y += 2) {
  for (let x = 58; x <= 262; x += 2) {
    const head = (x - 160) ** 2 + (y - 78) ** 2 <= 36 ** 2;
    const torso = y >= 110 && y <= 240 && Math.abs(x - 160) < 48;
    const arms = y >= 132 && y <= 210 && Math.abs(x - 160) < 92;
    const legs = y >= 220 && Math.abs(x - 160) < 42 && Math.abs(x - 160) > 9;
    if (head || torso || arms || legs) bodyPoints.push({ x, y });
  }
}

function submergedCount(points: readonly Point[], offset: number, angle: number) {
  const radians = angle * Math.PI / 180;
  return points.filter(({ x, y }) => -(x - 160) * Math.sin(radians) + (y - 180) * Math.cos(radians) >= offset).length;
}

describe('liquid surface area', () => {
  it('retains the sampled volume as rolling waves travel and rotate through an irregular outline', () => {
    for (const angle of [0, 55, 180]) {
      const radians = angle * Math.PI / 180;
      for (const level of [114, 177, 260]) {
        const expected = bodyPoints.filter(({ y }) => y >= level).length;
        for (const phase of [0, 1, 3, 6]) {
          const wave = (x: number) => liquidWaveHeight(x, phase, liquidWaveAmplitude(level, 5));
          const offset = liquidSurfaceOffset(bodyPoints, level, angle, wave);
          const actual = bodyPoints.filter(({ x, y }) => {
            const surfaceX = 160 + (x - 160) * Math.cos(radians) + (y - 180) * Math.sin(radians);
            return -(x - 160) * Math.sin(radians) + (y - 180) * Math.cos(radians) >= offset + wave(surfaceX);
          }).length;
          expect(Math.abs(actual - expected) / bodyPoints.length).toBeLessThan(.01);
        }
      }
    }
  });

  it('retains the exact original height when upright, without a grid sampling snap', () => {
    expect(liquidSurfaceOffset(bodyPoints, 177.3, 0)).toBeCloseTo(-2.7, 10);
    expect(liquidSurfaceOffset(bodyPoints, 177.3, 360)).toBeCloseTo(-2.7, 10);
  });

  it.each([0, -45, 45, -90, 90, 180, 450])('preserves sampled volume at %s degrees through an irregular outline', (angle) => {
    for (const uprightY of [114, 177, 260]) {
      const expectedCount = bodyPoints.filter(({ y }) => y >= uprightY).length;
      const offset = liquidSurfaceOffset(bodyPoints, uprightY, angle);
      const actualCount = submergedCount(bodyPoints, offset, angle);
      // At cardinal angles a grid row/column shares one projection. Its entire
      // boundary moves together; tolerance is below one percent of body area.
      expect(Math.abs(actualCount - expectedCount) / bodyPoints.length).toBeLessThan(.01);
    }
  });

  it('moves the surface toward the narrow side to preserve a small amount when inverted', () => {
    const offset = liquidSurfaceOffset(bodyPoints, 280, 180);
    expect(offset).toBeGreaterThan(65);
  });

  it.each([0, 45, 90, 180])('keeps empty and full amounts empty and full at %s degrees', (angle) => {
    expect(submergedCount(bodyPoints, liquidSurfaceOffset(bodyPoints, 400, angle), angle)).toBe(0);
    expect(submergedCount(bodyPoints, liquidSurfaceOffset(bodyPoints, 0, angle), angle)).toBe(bodyPoints.length);
  });

  it('provides a finite upright fallback before an outline can be sampled', () => {
    expect(liquidSurfaceOffset([], 230, 90)).toBe(50);
    expect(Number.isFinite(liquidSurfaceOffset([], NaN, NaN))).toBe(true);
  });
});

describe('gravity direction in SVG coordinates', () => {
  it.each([
    [90, 0, 0, 0],
    [45, 90, 0, -45],
    [45, -90, 0, 45],
    [135, 90, 0, 45],
    [135, -90, 0, -45],
    [0, -90, 90, 0],
    [0, 90, 270, 0],
    [-90, 0, 180, 0],
  ])('maps beta %s gamma %s screen %s to %s degrees', (beta, gamma, screenAngle, expected) => {
    const angle = gravityAngle(beta, gamma, screenAngle);
    expect(angle).not.toBeNull();
    expect(angle).toBeCloseTo(expected, 8);
  });

  it('points upward for an inverted portrait screen', () => {
    expect(Math.abs(gravityAngle(-90, 0, 0)!)).toBe(180);
  });

  it.each([[null, 30], [30, null], [NaN, 30], [30, Infinity], [0, 0], [180, 0], [.01, .01]])('does not invent gravity for unavailable or face-up/down readings %s, %s', (beta, gamma) => {
    expect(gravityAngle(beta, gamma, 0)).toBeNull();
  });

  it('rejects an invalid screen orientation', () => {
    expect(gravityAngle(90, 0, NaN)).toBeNull();
  });
});

describe('damped liquid movement', () => {
  it('slightly overshoots a new direction, then settles within two seconds', () => {
    let state: SpringState = { angle: 0, velocity: 0 };
    let furthestAngle = 0;
    for (let frame = 0; frame < 120; frame += 1) {
      state = stepLiquidSpring(state, 60, 1 / 60);
      furthestAngle = Math.max(furthestAngle, state.angle);
    }
    expect(furthestAngle).toBeGreaterThan(60.5);
    expect(furthestAngle).toBeLessThan(75);
    expect(state.angle).toBeCloseTo(60, 1);
    expect(Math.abs(state.velocity)).toBeLessThan(.2);
  });

  it.each([[179, -179, 181], [-179, 179, -181], [539, -179, 541]])('takes the shortest path from %s to %s without a discontinuity', (angle, target, expected) => {
    let state: SpringState = { angle, velocity: 0 };
    const initial = stepLiquidSpring(state, target, 1 / 60);
    expect(Math.abs(initial.angle - angle)).toBeLessThan(1);
    expect(Math.sign(initial.velocity)).toBe(Math.sign(expected - angle));
    for (let frame = 0; frame < 120; frame += 1) state = stepLiquidSpring(state, target, 1 / 60);
    expect(state.angle).toBeCloseTo(expected, 1);
  });

  it('advances nearly identically at 30 and 120 frames per second', () => {
    let slow: SpringState = { angle: 0, velocity: 0 };
    let fast: SpringState = { angle: 0, velocity: 0 };
    for (let frame = 0; frame < 15; frame += 1) slow = stepLiquidSpring(slow, -75, 1 / 30);
    for (let frame = 0; frame < 60; frame += 1) fast = stepLiquidSpring(fast, -75, 1 / 120);
    expect(slow.angle).toBeCloseTo(fast.angle, 3);
    expect(slow.velocity).toBeCloseTo(fast.velocity, 3);
  });

  it('limits the first frame after a long background pause', () => {
    const state = stepLiquidSpring({ angle: 0, velocity: 0 }, 90, 300);
    expect(state.angle).toBeGreaterThan(0);
    expect(state.angle).toBeLessThan(30);
    expect(Number.isFinite(state.velocity)).toBe(true);
  });

  it('ignores invalid time steps and recovers from invalid state', () => {
    const state = { angle: 32, velocity: 4 };
    for (const dt of [0, -1, NaN, Infinity]) expect(stepLiquidSpring(state, 90, dt)).toEqual(state);
    expect(stepLiquidSpring({ angle: NaN, velocity: Infinity }, 30, 1 / 60)).toEqual({ angle: 30, velocity: 0 });
    expect(stepLiquidSpring(state, NaN, 1 / 60)).toEqual(state);
  });
});
