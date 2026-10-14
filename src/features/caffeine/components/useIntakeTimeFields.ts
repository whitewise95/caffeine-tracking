import { useRef, useState } from 'react'
import { formatTime, localDateKey } from '../model/caffeine'
import type { CaffeineIntakeTiming } from '../model/caffeine.types'
import type { IntakeTimeTarget } from './IntakeTimePicker'

export function localDateTimeInput(date: Date) {
  return `${localDateKey(date)}T${formatTime(date)}`
}

const DEFAULT_DURATION_MS = 30 * 60_000

export interface IntakeTimeDraft {
  slow: boolean
  start: string
  end: string
  endManuallyChanged: boolean
}

export function parseLocalDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && localDateTimeInput(date) === value ? date : null
}

export function useIntakeTimeFields(initial?: CaffeineIntakeTiming) {
  const original = useRef<CaffeineIntakeTiming>(initial ?? { consumedAt: new Date().toISOString() })
  const picked = useRef(new Set<IntakeTimeTarget>())
  const [draft, updateDraft] = useState<IntakeTimeDraft>(() => {
    const end = new Date(original.current.consumedAt)
    return {
      slow: Boolean(initial?.startedAt),
      start: localDateTimeInput(original.current.startedAt ? new Date(original.current.startedAt) : end),
      end: localDateTimeInput(end),
      endManuallyChanged: false,
    }
  })

  function setDraft(next: IntakeTimeDraft) {
    // This flag belongs to the current form session, not the stored record.
    // Keep it sticky even if the user later restores the original finish.
    next = { ...next, endManuallyChanged: draft.endManuallyChanged || (draft.slow && next.slow && next.end !== draft.end) }
    if (next.slow && !draft.slow) {
      const end = parseLocalDateTime(next.end)
      updateDraft(end ? { ...next, start: localDateTimeInput(new Date(end.getTime() - DEFAULT_DURATION_MS)) } : next)
      return
    }
    if (next.slow && next.start !== draft.start) {
      picked.current.add('start')
      const start = parseLocalDateTime(next.start)
      if (start && !next.endManuallyChanged) {
        const now = new Date()
        const suggestedEnd = start.getTime() + DEFAULT_DURATION_MS
        const end = start.getTime() <= now.getTime() ? Math.min(suggestedEnd, now.getTime()) : suggestedEnd
        picked.current.add('end')
        updateDraft({ ...next, end: localDateTimeInput(new Date(end)) })
        return
      }
    }
    if (next.end !== draft.end) picked.current.add('end')
    updateDraft(next.slow ? next : { ...next, start: next.end })
  }

  function pickTime(target: IntakeTimeTarget, time: string) {
    setDraft({ ...draft, [target]: `${draft[target].split('T')[0]}T${time}` })
    picked.current.add(target)
  }

  function refreshDefault() {
    if (initial || draft.slow || picked.current.size > 0) return
    const previous = localDateTimeInput(new Date(original.current.consumedAt))
    if (draft.start !== previous || draft.end !== previous) return
    const now = new Date()
    original.current = { consumedAt: now.toISOString() }
    updateDraft({ slow: false, start: localDateTimeInput(now), end: localDateTimeInput(now), endManuallyChanged: false })
  }

  function resolveTiming(now = new Date()): { timing: CaffeineIntakeTiming; error?: never } | { error: string; timing?: never } {
    // Retain stored seconds until the user confirms a new minute in the picker.
    const originalEnd = new Date(original.current.consumedAt)
    const end = draft.end === localDateTimeInput(originalEnd) && !picked.current.has('end') ? originalEnd : parseLocalDateTime(draft.end)
    if (!end || end.getTime() > now.getTime()) {
      return { error: draft.slow ? '마신 마지막 시각을 현재 또는 과거로 입력해 주세요.' : '현재 또는 과거의 섭취 시각을 입력해 주세요.' }
    }
    if (!draft.slow) return { timing: { consumedAt: end.toISOString(), startedAt: undefined } }
    const originalStart = original.current.startedAt ? new Date(original.current.startedAt) : originalEnd
    const start = draft.start === localDateTimeInput(originalStart) && !picked.current.has('start') ? originalStart : parseLocalDateTime(draft.start)
    if (!start) return { error: '마시기 시작한 시각을 입력해 주세요.' }
    const unchangedInterval = original.current.startedAt && draft.start === localDateTimeInput(originalStart) && draft.end === localDateTimeInput(originalEnd) && picked.current.size === 0
    if (draft.start === draft.end && !unchangedInterval) return { timing: { consumedAt: end.toISOString(), startedAt: undefined } }
    if (start.getTime() > end.getTime()) return { error: '시작 시각은 마지막 시각보다 늦을 수 없어요.' }
    if (start.getTime() === end.getTime()) return { timing: { consumedAt: end.toISOString(), startedAt: undefined } }
    return { timing: { consumedAt: end.toISOString(), startedAt: start.toISOString() } }
  }

  return { draft, setDraft, pickTime, refreshDefault, resolveTiming }
}
