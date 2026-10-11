export type Point = { x: number; y: number };
/** Degrees and degrees/second. Keep angle unwrapped between frames. */
export type SpringState = { angle: number; velocity: number };

export const LIQUID_CENTER_X = 160;
export const LIQUID_CENTER_Y = 180;
const DEGREES_TO_RADIANS = Math.PI / 180;

function wrapDegrees(angle: number) {
  return ((angle % 360) + 540) % 360 - 180;
}

/** Select a rank without sorting every interior sample on each animation frame. */
function selectRank(values: number[], rank: number) {
  let left = 0;
  let right = values.length - 1;
  while (left < right) {
    const pivot = values[Math.floor((left + right) / 2)];
    let low = left;
    let high = right;
    while (low <= high) {
      while (values[low] < pivot) low += 1;
      while (values[high] > pivot) high -= 1;
      if (low <= high) {
        [values[low], values[high]] = [values[high], values[low]];
        low += 1;
        high -= 1;
      }
    }
    if (rank <= high) right = high;
    else if (rank >= low) left = low;
    else break;
  }
  return values[rank];
}

/**
 * Offset from (160,180) along (-sin(angle), cos(angle)); liquid occupies the
 * greater-projection side. Equal-area interior samples approximate body volume.
 * Matching their upright submerged count keeps that volume through a full turn.
 */
export function liquidSurfaceOffset(points: readonly Point[], uprightY: number, angle: number, waveHeight?: (x: number) => number): number {
  const surfaceY = Number.isFinite(uprightY) ? uprightY : LIQUID_CENTER_Y;
  const uprightOffset = surfaceY - LIQUID_CENTER_Y;
  const rotation = Number.isFinite(angle) ? wrapDegrees(angle) : 0;
  if (points.length === 0 || (rotation === 0 && !waveHeight)) return uprightOffset;

  const radians = rotation * DEGREES_TO_RADIANS;
  const normalX = -Math.sin(radians);
  const normalY = Math.cos(radians);
  const projections: number[] = [];
  let dryCount = 0;
  let lowerUprightY = -Infinity;
  let upperUprightY = Infinity;
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const { x, y } of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const surfaceX = LIQUID_CENTER_X + (x - LIQUID_CENTER_X) * normalY - (y - LIQUID_CENTER_Y) * normalX;
    const projection = (x - LIQUID_CENTER_X) * normalX + (y - LIQUID_CENTER_Y) * normalY - (waveHeight?.(surfaceX) ?? 0);
    projections.push(projection);
    minimum = Math.min(minimum, projection);
    maximum = Math.max(maximum, projection);
    if (y < surfaceY) {
      dryCount += 1;
      lowerUprightY = Math.max(lowerUprightY, y);
    } else {
      upperUprightY = Math.min(upperUprightY, y);
    }
  }
  if (projections.length === 0) return uprightOffset;
  if (dryCount === 0) return minimum - 1;
  if (dryCount === projections.length) return maximum + 1;

  const upper = selectRank(projections, dryCount);
  let lower = -Infinity;
  for (let index = 0; index < dryCount; index += 1) lower = Math.max(lower, projections[index]);

  // Preserve the position within a sample-row gap, avoiding a small height snap
  // when an exactly upright liquid surface starts rotating.
  const fraction = (surfaceY - lowerUprightY) / (upperUprightY - lowerUprightY);
  if (upper - lower > 1e-9) return lower + (upper - lower) * fraction;

  // Cardinal angles can put a whole grid row on one plane. Include or exclude
  // that tied boundary according to which gives the closest sampled area.
  let below = 0;
  let at = 0;
  for (const projection of projections) {
    if (projection < upper - 1e-9) below += 1;
    else if (Math.abs(projection - upper) <= 1e-9) at += 1;
  }
  return upper + (dryCount - below > at / 2 ? 1e-7 : -1e-7);
}

/**
 * W3C intrinsic Z-X'-Y'' rotation projects downward gravity into the natural
 * screen as (cos(beta)*sin(gamma), sin(beta)) after flipping device y to SVG y.
 * https://www.w3.org/TR/orientation-event/#device-orientation-model
 * Screen angles are counter-clockwise; subtract to express gravity in the
 * current viewport. https://www.w3.org/TR/screen-orientation/#concepts
 */
export function gravityAngle(beta: number | null, gamma: number | null, screenAngle: number): number | null {
  if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma) || !Number.isFinite(screenAngle)) return null;
  const betaRadians = beta * DEGREES_TO_RADIANS;
  const gammaRadians = gamma * DEGREES_TO_RADIANS;
  const downX = Math.cos(betaRadians) * Math.sin(gammaRadians);
  const downY = Math.sin(betaRadians);
  // Nearly flat devices have no reliable gravity direction within the screen.
  if (Math.hypot(downX, downY) < .02) return null;
  return wrapDegrees(Math.atan2(-downX, downY) / DEGREES_TO_RADIANS - screenAngle);
}

const NATURAL_FREQUENCY = 9;
const DAMPING_RATIO = .6;
const DECAY = NATURAL_FREQUENCY * DAMPING_RATIO;
const DAMPED_FREQUENCY = NATURAL_FREQUENCY * Math.sqrt(1 - DAMPING_RATIO ** 2);
const MAX_STEP_SECONDS = .1;

/** An exact damped-spring step: slight slosh, then rest in roughly 1–2 seconds. */
export function stepLiquidSpring(state: SpringState, targetAngle: number, dtSeconds: number): SpringState {
  const angle = Number.isFinite(state.angle) ? state.angle : Number.isFinite(targetAngle) ? targetAngle : 0;
  const velocity = Number.isFinite(state.velocity) ? state.velocity : 0;
  if (!Number.isFinite(targetAngle) || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return { angle, velocity };

  const dt = Math.min(dtSeconds, MAX_STEP_SECONDS);
  const delta = wrapDegrees(wrapDegrees(targetAngle) - wrapDegrees(angle));
  const displacement = -delta;
  const decay = Math.exp(-DECAY * dt);
  const sine = Math.sin(DAMPED_FREQUENCY * dt);
  const cosine = Math.cos(DAMPED_FREQUENCY * dt);
  const nextDisplacement = decay * (displacement * cosine + (velocity + DECAY * displacement) / DAMPED_FREQUENCY * sine);
  const nextVelocity = decay * (velocity * cosine - (DECAY * velocity + NATURAL_FREQUENCY ** 2 * displacement) / DAMPED_FREQUENCY * sine);
  return { angle: angle + delta + nextDisplacement, velocity: nextVelocity };
}
