import { describe, expect, it } from 'vitest'
import { limitIntakeNote, normalizeIntakeNote, noteLength } from './intakeNote'

describe('intake notes', () => {
  it('trims surrounding whitespace and omits blank notes', () => {
    expect(normalizeIntakeNote('  점심 후 마셨어요\n')).toBe('점심 후 마셨어요')
    expect(normalizeIntakeNote(' \n ')).toBeUndefined()
    expect(normalizeIntakeNote(undefined)).toBeUndefined()
  })
  it('accepts 100 Korean characters or emoji and rejects 101', () => {
    expect(normalizeIntakeNote('가'.repeat(100))).toBe('가'.repeat(100))
    expect(normalizeIntakeNote('☕'.repeat(100))).toBe('☕'.repeat(100))
    expect(normalizeIntakeNote('😀'.repeat(100))).toBe('😀'.repeat(100))
    expect(() => normalizeIntakeNote('가'.repeat(101))).toThrow('100자')
    expect(() => normalizeIntakeNote('😀'.repeat(101))).toThrow('100자')
  })
  it('limits pasted notes without splitting a supplementary Unicode character', () => {
    const note = limitIntakeNote('가'.repeat(99) + '😀끝')
    expect(note).toBe('가'.repeat(99) + '😀')
    expect(noteLength(note)).toBe(100)
  })
})
