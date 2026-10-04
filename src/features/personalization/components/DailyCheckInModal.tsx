import { useId, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Minus } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import type { CheckInCandidate, FeedbackInput, FeedbackRecord } from '../model';
import './personalization.css';

type DailyAnswer = 'later' | 'similar' | 'earlier';
const options = [
  { answer: 'later', label: '오래 갔어요', icon: ArrowUpRight },
  { answer: 'similar', label: '비슷했어요', icon: Minus },
  { answer: 'earlier', label: '빨리 줄었어요', icon: ArrowDownRight },
] as const;

export function DailyCheckInModal({ candidate, busy, onSubmit, onClose, initialFeedback }: {
  candidate: CheckInCandidate;
  busy: boolean;
  onSubmit: (input: FeedbackInput) => Promise<boolean>;
  onClose: () => void;
  initialFeedback?: FeedbackRecord;
}) {
  const id = useId();
  const [answer, setAnswer] = useState<DailyAnswer | null>(() => {
    const value = initialFeedback?.answer;
    return value === 'later' || value === 'similar' || value === 'earlier' ? value : null;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const locked = busy || saving;

  async function submit() {
    if (!answer || locked || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const saved = await onSubmit({
        targetDate: candidate.targetDate, lastIntakeAt: candidate.lastIntakeAt, timeZone: candidate.timeZone,
        responseKind: 'daily-feeling', answer, confounders: [],
      });
      if (!saved) throw new Error('save-failed');
    } catch {
      setError('저장하지 못했어요. 선택한 답변으로 다시 시도해 주세요.');
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <Modal title={initialFeedback ? '체감 응답 수정' : '어제 카페인, 어땠나요?'} description="나의 카페인 체감 패턴을 알아보기 위해 물어봐요." onClose={onClose} busy={locked}>
    <form className="daily-check-in-form" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset className="daily-check-in-choices" disabled={locked}>
        <legend>평소와 비교하면 어땠나요?</legend>
        <div className="daily-check-in-options">{options.map(({ answer: value, label, icon: Icon }) => <label key={value} className={`daily-check-in-option${answer === value ? ' is-selected' : ''}`}>
          <input type="radio" name={`${id}-feeling`} value={value} checked={answer === value} onChange={() => setAnswer(value)} />
          <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
          <span>{label}</span>
          <span className="daily-check-in-mark" aria-hidden="true">{answer === value && <Check size={18} strokeWidth={2} />}</span>
        </label>)}</div>
      </fieldset>
      {error && <p className="personal-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
      <button type="submit" className="button-primary" disabled={!answer || locked}>{saving ? '저장 중…' : '답변 저장'}</button>
      <button type="button" className="daily-check-in-dismiss" disabled={locked} onClick={onClose}>{initialFeedback ? '수정 취소' : '나중에 답하기'}</button>
    </form>
  </Modal>;
}
