import { useEffect, useRef, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { isTossRuntime } from '../../../integrations/toss/toss'
import { pickTossAlbumPhoto } from '../../../integrations/toss/album'
import { createDrinkPhoto } from '../media/drinkPhoto'

export function DrinkPhotoInput({ photoDataUrl, disabled, onChange, onProcessingChange }: {
  photoDataUrl?: string
  disabled: boolean
  onChange: (photo: string) => void
  onProcessingChange: (processing: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const active = useRef(true)
  const inProgress = useRef(false)
  const request = useRef(0)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  useEffect(() => {
    active.current = true
    return () => { active.current = false; request.current += 1 }
  }, [])
  useEffect(() => { setError('') }, [photoDataUrl])
  async function process(getSource: () => Promise<File | string | null>) {
    if (disabled || inProgress.current) return
    inProgress.current = true
    const id = ++request.current
    setError('')
    setProcessing(true)
    onProcessingChange(true)
    try {
      const source = await getSource()
      if (!source || !active.current || id !== request.current) return
      const thumbnail = await createDrinkPhoto(source)
      if (active.current && id === request.current) onChange(thumbnail)
    } catch (cause) {
      if (active.current && id === request.current) setError(cause instanceof Error ? cause.message : '사진을 처리하지 못했어요. 다시 시도해 주세요.')
    } finally {
      inProgress.current = false
      if (active.current && id === request.current) { setProcessing(false); onProcessingChange(false) }
    }
  }
  return <>
    <button type="button" className={`sheet-icon-option sheet-photo-option${photoDataUrl ? ' is-selected' : ''}`} disabled={disabled || processing}
      aria-label={photoDataUrl ? '앨범 사진 변경' : '앨범 사진 추가'} aria-pressed={Boolean(photoDataUrl)}
      onClick={() => { if (isTossRuntime()) void process(pickTossAlbumPhoto); else input.current?.click() }}>
      {photoDataUrl ? <><img src={photoDataUrl} alt="" width={44} height={44} /><Check size={10} className="sheet-icon-check" aria-hidden="true" /></> : <Plus size={21} aria-hidden="true" />}
    </button>
    <input ref={input} className="sheet-photo-file" type="file" accept="image/*" tabIndex={-1} aria-hidden="true" disabled={disabled} onChange={event => {
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = ''
      if (file) void process(async () => file)
    }} />
    {processing && <p className="sheet-photo-status" role="status">사진을 준비하고 있어요…</p>}
    {error && <p className="sheet-photo-status field-error" role="alert">{error}</p>}
  </>
}
