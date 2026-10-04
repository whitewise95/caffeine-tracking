import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, MessageCircle, X } from 'lucide-react';
import type { CheckInCandidate, FeedbackAnswer, FeedbackInput, FeedbackRecord } from '../model/types';
import { SUBJECTIVE_POLICY } from '../model/policy';
import { formatInterval, formatMoment, formatTargetDate, toLocalDateTime } from './format';
import './personalization.css';

interface CheckInCardProps {
  candidate: CheckInCandidate;
  now: Date;
  busy: boolean;
  onSubmit: (input: FeedbackInput) => Promise<boolean>;
  onSkip: () => Promise<boolean>;
  initialFeedback?: FeedbackRecord;
  error?: string;
}

const comparisons: { value: FeedbackAnswer; label: string }[] = [
  { value: 'earlier', label: '예상보다 일찍 줄었어요' },
  { value: 'similar', label: '대체로 비슷했어요' },
  { value: 'later', label: '예상보다 오래 갔어요' },
  { value: 'unknown', label: '잘 모르겠어요' },
];
const contexts = [
  { value: 'sleep-deprivation', label: '수면 부족' },
  { value: 'stress', label: '스트레스' },
  { value: 'alcohol', label: '음주' },
  { value: 'missing-intake', label: '기록하지 않은 카페인 섭취' },
];

export function CheckInCard({ candidate, now, busy, onSubmit, onSkip, initialFeedback, error }: CheckInCardProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(Boolean(initialFeedback));
  const initiallyComparing = Boolean(candidate.prediction && initialFeedback && ['earlier', 'similar', 'later'].includes(initialFeedback.answer));
  const [mode, setMode] = useState<'interval' | 'comparison'>(initiallyComparing ? 'comparison' : 'interval');
  const [comparisonRevealed, setComparisonRevealed] = useState(initiallyComparing);
  const [start, setStart] = useState(initialFeedback?.observedInterval ? toLocalDateTime(initialFeedback.observedInterval.start) : '');
  const [end, setEnd] = useState(initialFeedback?.observedInterval ? toLocalDateTime(initialFeedback.observedInterval.end) : '');
  const [answer, setAnswer] = useState<FeedbackAnswer | ''>(initialFeedback?.answer === 'skipped' ? '' : initialFeedback?.answer ?? '');
  const [confounders, setConfounders] = useState<string[]>(initialFeedback?.confounders ?? []);
  const [localError, setLocalError] = useState('');
  const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const locked = busy || saving;
  useEffect(() => {
    if (initialFeedback) cardRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [initialFeedback]);

  function showError(message: string) {
    setLocalError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function save(unknown = false) {
    if (locked) return;
    setLocalError('');
    const selectedAnswer = unknown ? 'unknown' : mode === 'interval' ? 'interval' : answer;
    if (!selectedAnswer) { showError('체감에 가장 가까운 답을 선택해 주세요.'); return; }
    let observedInterval: FeedbackInput['observedInterval'];
    if (selectedAnswer === 'interval') {
      const from = new Date(start).getTime();
      const to = new Date(end).getTime();
      if (!start || !end || !Number.isFinite(from) || !Number.isFinite(to)) { showError('각성감이 줄었다고 느낀 시간 범위를 입력해 주세요.'); return; }
      if (from > to) { showError('끝 시각은 시작 시각과 같거나 더 늦어야 해요.'); return; }
      if (from < Date.parse(candidate.lastIntakeAt)) { showError('마지막 섭취 이후의 시간 범위를 입력해 주세요.'); return; }
      if (to > now.getTime()) { showError('체감 시각은 현재보다 늦을 수 없어요.'); return; }
      if (to - from > SUBJECTIVE_POLICY.maximumIntervalWidthHours * 3_600_000) { showError(`시간 범위를 ${SUBJECTIVE_POLICY.maximumIntervalWidthHours}시간 이내로 좁혀 주세요. 기억나지 않으면 잘 모르겠어요를 선택해요.`); return; }
      if (to - Date.parse(candidate.lastIntakeAt) > SUBJECTIVE_POLICY.maximumObservationHours * 3_600_000) { showError(`이 체크인은 마지막 섭취 후 ${SUBJECTIVE_POLICY.maximumObservationHours}시간 이내의 체감만 기록할 수 있어요. 범위를 고르기 어렵다면 잘 모르겠어요를 선택해요.`); return; }
      observedInterval = { start: new Date(from).toISOString(), end: new Date(to).toISOString() };
    }
    setSaving(true);
    try {
      const saved = await onSubmit({
        targetDate: candidate.targetDate, lastIntakeAt: candidate.lastIntakeAt, timeZone: candidate.timeZone,
        predictionId: candidate.prediction?.id, answer: selectedAnswer, observedInterval, confounders,
        ...(selectedAnswer === 'interval' ? { observedWithoutComparison: !comparisonRevealed } : {}),
      });
      if (!saved) showError('저장하지 못했어요. 입력한 내용은 그대로 있으니 다시 시도해 주세요.');
    } catch { showError('저장하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
    finally { setSaving(false); }
  }

  async function skip() {
    if (locked) return;
    setSaving(true);
    setLocalError('');
    try { if (!await onSkip()) { setExpanded(true); showError('응답 상태를 저장하지 못했어요. 다시 시도해 주세요.'); } }
    catch { setExpanded(true); showError('응답 상태를 저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { setSaving(false); }
  }

  return <section ref={cardRef} className="personal-card check-in-card" aria-labelledby={`${id}-title`}>
    <div className="personal-card-heading">
      <div className="personal-heading-label"><MessageCircle size={18} aria-hidden="true" /><h2 id={`${id}-title`}>{initialFeedback ? '체감 응답 수정' : '어제 카페인, 어땠나요?'}</h2></div>
      <span className="personal-badge">선택 사항</span>
    </div>
    {!expanded ? <>
      <p className="personal-copy">짧은 기록으로 나의 체감 패턴을 알아가요.</p>
      <div className="personal-actions">
        <button type="button" className="personal-button" aria-expanded="false" aria-controls={`${id}-form`} disabled={locked} onClick={() => setExpanded(true)}>체감 남기기<ChevronDown size={16} aria-hidden="true" /></button>
        <button type="button" className="personal-text-button" disabled={locked} onClick={() => void skip()}>건너뛰기</button>
      </div>
    </> : <form id={`${id}-form`} className="personal-form" onSubmit={event => { event.preventDefault(); void save(); }} noValidate>
      <p className="personal-copy"><strong>{formatTargetDate(candidate.targetDate)} 섭취 기록</strong><br />마지막 섭취 {formatMoment(candidate.lastIntakeAt, candidate.timeZone)}</p>
      <fieldset disabled={locked} className="personal-fieldset">
        {mode === 'interval' ? <>
          <legend>각성감이 줄었다고 느낀 때는 언제인가요?</legend>
          <p className="personal-help">정확하지 않아도 괜찮아요. 대략적인 시간 범위를 남겨 주세요. 자정이 지났다면 다음 날짜를 선택해요.</p>
          <label className="personal-field" htmlFor={`${id}-start`}>체감 시각 범위 시작<input type="datetime-local" id={`${id}-start`} value={start} min={toLocalDateTime(candidate.lastIntakeAt)} max={toLocalDateTime(now)} onChange={event => setStart(event.target.value)} aria-describedby={`${id}-error`} /></label>
          <label className="personal-field" htmlFor={`${id}-end`}>체감 시각 범위 끝<input type="datetime-local" id={`${id}-end`} value={end} min={start || toLocalDateTime(candidate.lastIntakeAt)} max={toLocalDateTime(now)} onChange={event => setEnd(event.target.value)} aria-describedby={`${id}-error`} /></label>
          {candidate.prediction && <button type="button" className="personal-text-button personal-disclosure" onClick={() => { setMode('comparison'); setComparisonRevealed(true); setAnswer(''); setLocalError(''); }}>예측과 비교해 답하기<ChevronDown size={16} aria-hidden="true" /></button>}
        </> : <>
          <legend>당시 예측한 시간과 비교하면 어땠나요?</legend>
          {candidate.prediction && <div className="personal-prediction-reference"><span>당시 확인한 예측 구간</span><strong>{formatInterval(candidate.prediction.interval, candidate.timeZone)}</strong></div>}
          <div className="personal-answer-list">{comparisons.map(option => <label key={option.value} className={`personal-answer${answer === option.value ? ' is-selected' : ''}`}>
            <input type="radio" name={`${id}-comparison`} checked={answer === option.value} value={option.value} onChange={() => setAnswer(option.value)} /><span>{option.label}</span>{answer === option.value && <Check size={16} aria-hidden="true" />}
          </label>)}</div>
          <button type="button" className="personal-text-button" onClick={() => { setMode('interval'); setLocalError(''); }}>시간 범위로 답하기</button>
        </>}
        <details className="personal-context"><summary>함께 기억할 상황 <span>선택</span></summary><p className="personal-help">이런 상황이 있었다면 응답만 보관하고 학습에는 사용하지 않아요.</p><div className="personal-context-list">{contexts.map(context => <label key={context.value}><input type="checkbox" checked={confounders.includes(context.value)} onChange={event => setConfounders(previous => event.target.checked ? [...previous, context.value] : previous.filter(value => value !== context.value))} /><span>{context.label}</span></label>)}</div></details>
      </fieldset>
      {(localError || error) && <p className="personal-error" role="alert" ref={errorRef} tabIndex={-1} id={`${id}-error`}>{localError || error}</p>}
      <div className="personal-actions"><button type="submit" className="personal-button" disabled={locked}>{saving ? '저장 중…' : initialFeedback ? '응답 수정 저장' : '체감 기록 저장'}</button>{mode === 'interval' && <button type="button" className="personal-text-button" disabled={locked} onClick={() => void save(true)}>잘 모르겠어요</button>}</div>
      <div className="personal-form-footer"><p className="personal-help">체감 응답은 몸속 잔존 mg 추정치를 바꾸지 않아요.</p><button type="button" className="personal-text-button" disabled={locked} onClick={() => void skip()}><X size={14} aria-hidden="true" />{initialFeedback ? '수정 취소' : '건너뛰기'}</button></div>
    </form>}
  </section>;
}
