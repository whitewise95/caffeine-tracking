/**
 * Population defaults, not an individual's measured parameters.
 * The app uses the fixed default elimination half-life.
 * Terziivanov et al. (2003), PMID 14674790: ka = 4.54/h, ke = 0.139/h.
 * The app's fixed 4.5 h elimination half-life is a modelling assumption,
 * separate from the study's elimination rate; oral bioavailability is assumed 1.
 */
export const DEFAULT_CAFFEINE_HALF_LIFE_HOURS = 4.5
export const DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR = 4.54
export const CAFFEINE_PK_MODEL_VERSION = 'oral-uniform-intake-v2'

export type CaffeineEstimate = {
  /** Absorbed caffeine still present in the systemic compartment, in mg. */
  remainingMg: number
  /** Caffeine not yet absorbed from the oral dose, in mg. Excluded from remainingMg. */
  absorbingMg: number
}

function positiveOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/**
 * Oral one-compartment model with first-order absorption and elimination (F = 1).
 * It estimates amounts, not blood concentrations or subjective effects.
 */
export function oralCaffeineEstimate(
  doseMg: number,
  elapsedHours: number,
  halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_HOURS,
  absorptionRatePerHour = DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR,
): CaffeineEstimate {
  if (!Number.isFinite(doseMg) || doseMg <= 0 || !Number.isFinite(elapsedHours) || elapsedHours < 0) {
    return { remainingMg: 0, absorbingMg: 0 }
  }

  if (elapsedHours === 0) return { remainingMg: 0, absorbingMg: doseMg }

  const ka = positiveOrDefault(absorptionRatePerHour, DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR)
  const halfLife = positiveOrDefault(halfLifeHours, DEFAULT_CAFFEINE_HALF_LIFE_HOURS)
  const ke = Math.LN2 / halfLife
  const absorbingMg = doseMg * Math.exp(-ka * elapsedHours)
  const rateGap = Math.abs(ka - ke)
  let absorbedFraction: number

  if (rateGap === 0) {
    // Continuous limit of the Bateman function when ka equals ke.
    const exposure = ka * elapsedHours
    absorbedFraction = Number.isFinite(exposure) ? exposure * Math.exp(-exposure) : 0
  } else {
    // Factor out the slower exponential. expm1 avoids cancellation for close
    // rates or recent doses; its argument stays nonpositive to avoid overflow.
    const slowerDecay = Math.exp(-Math.min(ka, ke) * elapsedHours)
    absorbedFraction = (ka / rateGap) * slowerDecay * -Math.expm1(-rateGap * elapsedHours)
  }

  // Bound floating-point rounding by the amount that has left the gut.
  const remainingMg = Math.max(0, Math.min(doseMg - absorbingMg, doseMg * absorbedFraction))
  return { remainingMg, absorbingMg }
}

/** Mean exp(-x*u) over 0 <= u <= 1, evaluated without cancellation near zero. */
function meanExponential(x: number): number {
  return x === 0 ? 1 : -Math.expm1(-x) / x
}

/** Integral of u^order * exp(-x*u) over 0 <= u <= 1, for 0 <= x < 1. */
function exponentialMoment(x: number, order: 1 | 3): number {
  let sum = 0
  let coefficient = 1
  for (let n = 0; n < 24; n++) {
    sum += coefficient / (n + order + 1)
    coefficient *= -x / (n + 1)
  }
  return sum
}

/** Average Bateman response during a constant oral input; x=ka*t, y=ke*t. */
function uniformSystemicFraction(x: number, y: number): number {
  if (!Number.isFinite(y)) return 0
  if (!Number.isFinite(x)) return meanExponential(y)

  if (Math.max(x, y) < 0.5) {
    // Divided power series avoids subtracting two near-one exponentials for
    // very recent input. (x^n-y^n)/(x-y) is expanded, including the x=y limit.
    let sum = 0
    let dividedPower = 1
    let yPower = 1
    let coefficient = 0.5
    for (let n = 1; n <= 20; n++) {
      sum += coefficient * dividedPower
      yPower *= y
      dividedPower = x * dividedPower + yPower
      coefficient *= -1 / (n + 2)
    }
    return x * sum
  }

  const gap = x - y
  if (Math.abs(gap) <= Math.max(x, y) * 1e-4) {
    // Symmetric expansion of the analytic divided difference. Its omitted
    // fourth-order term is at floating-point precision at this threshold.
    const midpoint = x / 2 + y / 2
    if (midpoint >= 1) {
      const decay = Math.exp(-midpoint)
      const firstTail = midpoint > 50 ? 0 : decay * (1 + midpoint)
      const thirdTail = midpoint > 50 ? 0 : decay * (1 + midpoint + midpoint * midpoint / 2 + midpoint * midpoint * midpoint / 6)
      // Scale before multiplying so enormous, finite rates do not overflow.
      return (x / midpoint) / midpoint * (1 - firstTail + Math.pow(gap / midpoint, 2) / 4 * (1 - thirdTail))
    }
    return x * (exponentialMoment(midpoint, 1) + gap * gap / 24 * exponentialMoment(midpoint, 3))
  }
  return x / gap * (meanExponential(y) - meanExponential(x))
}

/**
 * Convolution of the oral one-compartment response with a uniform oral input.
 * doseMg is the TOTAL drink dose over intakeDurationHours; elapsedHours starts
 * at the first sip. Before the finish, only the fraction already drunk enters
 * the gut. Constant sipping is an input assumption, not a measured sip pattern.
 *
 * Solve dG/dt = dose/duration - ka*G, dA/dt = ka*G - ke*A while drinking;
 * after the finish, propagate both compartments with zero further input.
 */
export function uniformOralCaffeineEstimate(
  doseMg: number,
  elapsedHours: number,
  intakeDurationHours: number,
  halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_HOURS,
  absorptionRatePerHour = DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR,
): CaffeineEstimate {
  if (!Number.isFinite(doseMg) || doseMg <= 0
    || !Number.isFinite(elapsedHours) || elapsedHours <= 0
    || !Number.isFinite(intakeDurationHours) || intakeDurationHours <= 0) {
    return { remainingMg: 0, absorbingMg: 0 }
  }

  const ka = positiveOrDefault(absorptionRatePerHour, DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR)
  const halfLife = positiveOrDefault(halfLifeHours, DEFAULT_CAFFEINE_HALF_LIFE_HOURS)
  const ke = Math.LN2 / halfLife
  const inputHours = Math.min(elapsedHours, intakeDurationHours)
  const consumedMg = doseMg * (inputHours / intakeDurationHours)
  const x = ka * inputHours
  const y = ke * inputHours
  const gutAtInputEnd = consumedMg * meanExponential(x)
  const systemicAtInputEnd = Math.max(0, Math.min(
    consumedMg - gutAtInputEnd,
    consumedMg * uniformSystemicFraction(x, y),
  ))
  const afterInputHours = elapsedHours - inputHours
  if (afterInputHours === 0) return { remainingMg: systemicAtInputEnd, absorbingMg: gutAtInputEnd }

  const gut = oralCaffeineEstimate(gutAtInputEnd, afterInputHours, halfLife, ka)
  return {
    remainingMg: Math.min(consumedMg - gut.absorbingMg, systemicAtInputEnd * Math.exp(-ke * afterInputHours) + gut.remainingMg),
    absorbingMg: gut.absorbingMg,
  }
}
