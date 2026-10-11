const CENTER_X = 160;

/** Broad swell plus two slower/faster ripples; opposing directions avoid a rigid sine stripe. */
export function liquidWaveHeight(x: number, phase: number, amplitude: number): number {
  const localX = x - CENTER_X;
  const swell = localX / 26 - phase;
  return amplitude * (
    .7 * Math.sin(swell)
    + .22 * Math.sin(localX / 13 + phase * 1.37 + .9)
    + .12 * Math.sin(localX / 49 - phase * .61 + 1.8)
    + .08 * Math.sin(swell * 2 + .5)
  );
}

function liquidWaveSlope(x: number, phase: number, amplitude: number): number {
  const localX = x - CENTER_X;
  const swell = localX / 26 - phase;
  return amplitude * (
    .7 / 26 * Math.cos(swell)
    + .22 / 13 * Math.cos(localX / 13 + phase * 1.37 + .9)
    + .12 / 49 * Math.cos(localX / 49 - phase * .61 + 1.8)
    + .16 / 26 * Math.cos(swell * 2 + .5)
  );
}

/** Limit crests by liquid depth and space above the surface, including a nearly full avatar. */
export function liquidWaveAmplitude(level: number, slosh = 0): number {
  return Math.max(0, Math.min(6.5 + Math.max(0, Math.min(slosh, 5.5)), (298 - level) * .32, (level - 53) * .45));
}

// Wide enough to keep the liquid closed through a full phone rotation.
export function liquidSurfacePath(phase = 0, amplitude = 6.5): string {
  const height = (x: number) => liquidWaveHeight(x, phase, amplitude);
  const slope = (x: number) => liquidWaveSlope(x, phase, amplitude);
  const step = 20;
  let path = `M-480 ${height(-480).toFixed(2)}`;
  for (let x = -480; x < 800; x += step) {
    path += ` C${(x + step / 3).toFixed(1)} ${(height(x) + slope(x) * step / 3).toFixed(2)} ${(x + step * 2 / 3).toFixed(1)} ${(height(x + step) - slope(x + step) * step / 3).toFixed(2)} ${x + step} ${height(x + step).toFixed(2)}`;
  }
  return path;
}

export const closeLiquidSurface = (surface: string) => `${surface} V700 H-480 Z`;
