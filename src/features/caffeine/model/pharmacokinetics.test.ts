import { describe, expect, it } from 'vitest'
import { oralCaffeineEstimate, uniformOralCaffeineEstimate } from './pharmacokinetics'

// Independent numerical solution of dG/dt = -ka G and dA/dt = ka G - ke A.
// RK4 checks the analytic production solver without repeating its expression.
function integrateDose(dose: number, hours: number, absorption: number, elimination: number) {
  let gut = dose
  let systemic = 0
  const steps = Math.ceil(hours * 2000)
  const dt = hours / steps
  const derivative = (g: number, a: number) => [-absorption * g, absorption * g - elimination * a]
  for (let i = 0; i < steps; i++) {
    const k1 = derivative(gut, systemic)
    const k2 = derivative(gut + k1[0] * dt / 2, systemic + k1[1] * dt / 2)
    const k3 = derivative(gut + k2[0] * dt / 2, systemic + k2[1] * dt / 2)
    const k4 = derivative(gut + k3[0] * dt, systemic + k3[1] * dt)
    gut += dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6
    systemic += dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6
  }
  return { remainingMg: systemic, absorbingMg: gut }
}

describe('oralCaffeineEstimate', () => {
  it.each([0, 0.005, 0.25, 0.8, 2, 5, 16, 48])('matches an independent compartment integration at %s hours', (hours) => {
    const estimate = oralCaffeineEstimate(150, hours)
    const numerical = integrateDose(150, hours, 4.54, Math.log(2) / 4.5)
    expect(estimate.remainingMg).toBeCloseTo(numerical.remainingMg, 8)
    expect(estimate.absorbingMg).toBeCloseTo(numerical.absorbingMg, 8)
  })

  it.each([1.2, 1.2 - 1e-12, 1.2 + 1e-12, 1.2 - 1e-8, 1.2 + 1e-8])('handles equal and near-equal absorption and elimination rates (%s)', (absorptionRate) => {
    const estimate = oralCaffeineEstimate(200, 1.5, Math.log(2) / 1.2, absorptionRate)
    const numerical = integrateDose(200, 1.5, absorptionRate, 1.2)
    expect(estimate.remainingMg).toBeCloseTo(numerical.remainingMg, 8)
    expect(estimate.absorbingMg).toBeCloseTo(numerical.absorbingMg, 8)
  })

  it('keeps both compartments nonnegative and never creates more caffeine than was consumed', () => {
    for (const hours of [0, 1e-12, 0.001, 0.1, 0.5, 1, 5, 24, 1e10]) {
      const { remainingMg, absorbingMg } = oralCaffeineEstimate(200, hours)
      expect(remainingMg).toBeGreaterThanOrEqual(0)
      expect(absorbingMg).toBeGreaterThanOrEqual(0)
      expect(remainingMg + absorbingMg).toBeLessThanOrEqual(200)
    }
  })

  it('keeps the initial oral dose outside the systemic compartment even with extreme positive rates', () => {
    expect(oralCaffeineEstimate(200, 0, Number.MIN_VALUE)).toEqual({ remainingMg: 0, absorbingMg: 200 })
    expect(oralCaffeineEstimate(200, 0, 5, Number.MAX_VALUE)).toEqual({ remainingMg: 0, absorbingMg: 200 })
  })

  it('underflows to zero without NaN for long elapsed times or extremely fast elimination', () => {
    expect(oralCaffeineEstimate(200, 1e10)).toEqual({ remainingMg: 0, absorbingMg: 0 })
    expect(oralCaffeineEstimate(200, 1e10, Math.log(2) / 4.54)).toEqual({ remainingMg: 0, absorbingMg: 0 })
    expect(oralCaffeineEstimate(200, 1, Number.MIN_VALUE).remainingMg).toBe(0)
  })

  it.each([-1, Number.NaN, Infinity])('ignores invalid dose %s', (dose) => {
    expect(oralCaffeineEstimate(dose, 1)).toEqual({ remainingMg: 0, absorbingMg: 0 })
  })

  it.each([-1, Number.NaN, Infinity])('ignores invalid or future elapsed time %s', (hours) => {
    expect(oralCaffeineEstimate(150, hours)).toEqual({ remainingMg: 0, absorbingMg: 0 })
  })
})

// Integrate a constant oral input until the drink is finished, then no input.
// Splitting at the finish avoids a numerical step spanning the rate discontinuity.
function integrateSlowDose(dose: number, hours: number, duration: number, absorption = 4.54, elimination = Math.log(2) / 4.5) {
  let gut = 0
  let systemic = 0
  const phases = [
    { hours: Math.min(hours, duration), input: dose / duration },
    { hours: Math.max(0, hours - duration), input: 0 },
  ]
  for (const phase of phases) {
    const steps = Math.ceil(phase.hours * 2000)
    const dt = phase.hours / steps
    const derivative = (g: number, a: number) => [phase.input - absorption * g, absorption * g - elimination * a]
    for (let i = 0; i < steps; i++) {
      const k1 = derivative(gut, systemic)
      const k2 = derivative(gut + k1[0] * dt / 2, systemic + k1[1] * dt / 2)
      const k3 = derivative(gut + k2[0] * dt / 2, systemic + k2[1] * dt / 2)
      const k4 = derivative(gut + k3[0] * dt, systemic + k3[1] * dt)
      gut += dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6
      systemic += dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6
    }
  }
  return { remainingMg: systemic, absorbingMg: gut }
}

describe('uniformOralCaffeineEstimate', () => {
  it.each([0, 0.005, 0.25, 0.8, 1, 2, 5, 24])('matches independent oral input integration at %s hours for a one-hour drink', hours => {
    const estimate = uniformOralCaffeineEstimate(150, hours, 1)
    const numerical = integrateSlowDose(150, hours, 1)
    expect(estimate.remainingMg).toBeCloseTo(numerical.remainingMg, 8)
    expect(estimate.absorbingMg).toBeCloseTo(numerical.absorbingMg, 8)
  })

  it.each([1.2, 1.2 - 1e-12, 1.2 + 1e-12, 1.2 - 1e-6, 1.2 + 1e-6, 1.2 - 0.001, 1.2 + 0.001])('handles equal and near-equal absorption and elimination rates (%s)', absorption => {
    for (const hours of [0.25, 1, 3]) {
      const estimate = uniformOralCaffeineEstimate(200, hours, 1, Math.log(2) / 1.2, absorption)
      const numerical = integrateSlowDose(200, hours, 1, absorption, 1.2)
      expect(estimate.remainingMg).toBeCloseTo(numerical.remainingMg, 8)
      expect(estimate.absorbingMg).toBeCloseTo(numerical.absorbingMg, 8)
    }
  })

  it('only includes caffeine actually consumed by the calculation time', () => {
    for (const duration of [1e-12, 0.001, 0.5, 1, 24, 10000]) {
      for (const fraction of [0, 1e-12, 0.01, 0.5, 1, 2]) {
        const estimate = uniformOralCaffeineEstimate(200, duration * fraction, duration)
        const consumed = 200 * Math.min(1, fraction)
        expect(estimate.remainingMg).toBeGreaterThanOrEqual(0)
        expect(estimate.absorbingMg).toBeGreaterThanOrEqual(0)
        expect(estimate.remainingMg + estimate.absorbingMg).toBeLessThanOrEqual(consumed + 1e-12)
      }
    }
  })

  it('is continuous at both the start and finish of the drink', () => {
    expect(uniformOralCaffeineEstimate(150, 0, 1)).toEqual({ remainingMg: 0, absorbingMg: 0 })
    expect(uniformOralCaffeineEstimate(150, 1e-9, 1).absorbingMg).toBeLessThan(1e-6)
    const before = uniformOralCaffeineEstimate(150, 1 - 1e-9, 1)
    const after = uniformOralCaffeineEstimate(150, 1 + 1e-9, 1)
    expect(before.remainingMg).toBeCloseTo(after.remainingMg, 6)
    expect(before.absorbingMg).toBeCloseTo(after.absorbingMg, 6)
  })

  it('converges to the existing instantaneous model as intake duration approaches zero', () => {
    for (const hours of [0.1, 1, 5, 24]) {
      const slow = uniformOralCaffeineEstimate(150, hours, 1e-12)
      const instant = oralCaffeineEstimate(150, hours)
      expect(slow.remainingMg).toBeCloseTo(instant.remainingMg, 8)
      expect(slow.absorbingMg).toBeCloseTo(instant.absorbingMg, 8)
    }
  })

  it('preserves the same input rate when dose and duration scale together', () => {
    expect(uniformOralCaffeineEstimate(300, 0.5, 2)).toEqual(uniformOralCaffeineEstimate(150, 0.5, 1))
  })

  it('handles extremely slow and fast rates and long elapsed times without nonfinite values', () => {
    for (const halfLife of [5, Number.MIN_VALUE, Number.MAX_VALUE]) {
      for (const absorption of [4.54, Number.MIN_VALUE, Number.MAX_VALUE]) {
        for (const hours of [0, 1e-12, 0.5, 1, 1e10]) {
          const estimate = uniformOralCaffeineEstimate(150, hours, 1, halfLife, absorption)
          expect(Number.isFinite(estimate.remainingMg)).toBe(true)
          expect(Number.isFinite(estimate.absorbingMg)).toBe(true)
          expect(estimate.remainingMg).toBeGreaterThanOrEqual(0)
          expect(estimate.absorbingMg).toBeGreaterThanOrEqual(0)
          expect(estimate.remainingMg + estimate.absorbingMg).toBeLessThanOrEqual(150)
        }
      }
    }
  })

  it('keeps equal enormous finite rates well-defined without overflow in the continuous limit', () => {
    const estimate = uniformOralCaffeineEstimate(150, 1, 1, Math.log(2) / 1e200, 1e200)
    expect(estimate.remainingMg).toBeGreaterThan(0)
    expect(estimate.remainingMg / 1e-198).toBeCloseTo(1.5, 8)
    expect(estimate.absorbingMg / 1e-198).toBeCloseTo(1.5, 8)
  })

  it.each([0, -1, Number.NaN, Infinity])('rejects a nonpositive or invalid duration (%s)', duration => {
    expect(uniformOralCaffeineEstimate(150, 1, duration)).toEqual({ remainingMg: 0, absorbingMg: 0 })
  })

  it.each([-1, Number.NaN, Infinity])('rejects an invalid elapsed time (%s)', hours => {
    expect(uniformOralCaffeineEstimate(150, hours, 1)).toEqual({ remainingMg: 0, absorbingMg: 0 })
  })

  it.each([0, -1, Number.NaN, Infinity])('rejects an invalid dose (%s)', dose => {
    expect(uniformOralCaffeineEstimate(dose, 1, 1)).toEqual({ remainingMg: 0, absorbingMg: 0 })
  })
})
