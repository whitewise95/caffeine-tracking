import { useRef, useState } from 'react'
import { formatTime, localDateKey } from '../model/caffeine'
import type { CaffeineIntakeTiming } from '../model/caffeine.types'

export function localDateTimeInput(date: Date) {
  return `${localDateKey(date)}T${formatTime(date)}`
}

export interface IntakeTimeDraft {
  slow: boolean
  start: string
  end: string
}

export function parseLocalDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && localDateTimeInput(date) === value ? date : null
}

export function useIntakeTimeFields(initial?: CaffeineIntakeTiming) {
  const [draft, setDraft] = useState<IntakeTimeDraft>(() => {
    const end = initial ? new Date(initial.consumedAt) : new Date()
    return {
      slow: Boolean(initial?.startedAt),
      start: localDateTimeInput(initial?.startedAt ? new Date(initial.startedAt) : new Date(end.getTime() - 30 * 60_000)),
      end: localDateTimeInput(end),
    }
  })

  const hasOpenedSlowFields = useRef(Boolean(initial?.startedAt))

  function toggleSlow(slow: boolean) {
    if (slow && !hasOpenedSlowFields.current) {
      hasOpenedSlowFields.current = true
      setDraft(previous => {
        const end = initial ? parseLocalDateTime(previous.end) : new Date()
        if (!end) return { ...previous, slow }
        return { slow, start: localDateTimeInput(new Date(end.getTime() - 30 * 60_000)), end: localDateTimeInput(end) }
      })
      return
    }
    setDraft(previous => ({ ...previous, slow }))
  }

  function resolveTiming(now = new Date()): { timing: CaffeineIntakeTiming; error?: never } | { error: string; timing?: never } {
    const originalEnd = initial ? new Date(initial.consumedAt) : null
    const end = originalEnd && draft.end === localDateTimeInput(originalEnd) ? originalEnd : parseLocalDateTime(draft.end)
    if (!end || end.getTime() > now.getTime()) {
      return { error: draft.slow ? '마신 마지막 시각을 현재 또는 과거로 입력해 주세요.' : '현재 또는 과거의 섭취 시각을 입력해 주세요.' }
    }
    if (!draft.slow) return { timing: { consumedAt: end.toISOString(), startedAt: undefined } }
    const originalStart = initial?.startedAt ? new Date(initial.startedAt) : null
    const start = originalStart && draft.start === localDateTimeInput(originalStart) ? originalStart : parseLocalDateTime(draft.start)
    if (!start) return { error: '마시기 시작한 시각을 입력해 주세요.' }
    if (start.getTime() >= end.getTime()) return { error: '시작 시각은 마지막 시각보다 빨라야 해요.' }
    return { timing: { consumedAt: end.toISOString(), startedAt: start.toISOString() } }
  }

  return { draft, setDraft, toggleSlow, resolveTiming }
}
