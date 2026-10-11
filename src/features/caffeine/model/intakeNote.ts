export const MAX_INTAKE_NOTE_LENGTH = 100

/** Count Unicode code points so supplementary characters do not consume two slots. */
export function noteLength(note: string): number {
  return Array.from(note).length
}

export function limitIntakeNote(note: string): string {
  return Array.from(note).slice(0, MAX_INTAKE_NOTE_LENGTH).join('')
}

export function normalizeIntakeNote(note?: string): string | undefined {
  if (note === undefined) return undefined
  if (noteLength(note) > MAX_INTAKE_NOTE_LENGTH) throw new Error(`메모는 ${MAX_INTAKE_NOTE_LENGTH}자 이하로 입력해 주세요.`)
  return note.trim() || undefined
}
