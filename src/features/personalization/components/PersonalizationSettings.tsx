import { useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { FeedbackRecord, PersonalizationState } from '../model/types';
import { formatInterval, formatTargetDate } from './format';
import './personalization.css';

interface PersonalizationSettingsProps {
  state: PersonalizationState;
  busy: boolean;
  onToggle: (enabled: boolean) => Promise<boolean>;
  onClearLearning: () => Promise<boolean>;
  onDeleteFeedback: (id: string) => Promise<boolean>;
  onEditFeedback?: (feedback: FeedbackRecord) => void;
}

const answerLabels = { earlier: '예상보다 일찍 줄었어요', similar: '대체로 비슷했어요', later: '예상보다 오래 갔어요', unknown: '잘 모르겠어요', skipped: '건너뛰었어요', interval: '체감 시간 범위' };
const dailyAnswerLabels = { earlier: '빨리 줄었어요', similar: '비슷했어요', later: '오래 갔어요' };

export function PersonalizationSettings({ state, busy, onToggle, onClearLearning, onDeleteFeedback, onEditFeedback }: PersonalizationSettingsProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const locked = busy || saving;
  async function act(action: () => Promise<boolean>, after?: () => void) {
    if (locked) return;
    setSaving(true);
    setError('');
    try { if (await action()) after?.(); else setError('변경 내용을 저장하지 못했어요. 다시 시도해 주세요.'); }
    catch { setError('변경 내용을 저장하지 못했어요. 다시 시도해 주세요.'); }
    finally { setSaving(false); }
  }
  const feedback = state.feedback.filter(record => record.answer !== 'skipped').sort((a, b) => b.targetDate.localeCompare(a.targetDate) || b.respondedAt.localeCompare(a.respondedAt));
  return <section className="settings-section personal-settings" aria-labelledby="personalization-settings-title">
    <div className="section-heading"><MessageCircle size={18} aria-hidden="true" /><h2 id="personalization-settings-title">체감 기록</h2></div>
    <p className="personal-copy">전날 카페인이 어떻게 느껴졌는지 짧게 남겨요.</p>
    <label className="personal-switch-row"><span>다음 날 체감 질문 받기</span><input type="checkbox" role="switch" checked={state.enabled} disabled={locked} onChange={event => { const enabled = event.target.checked; void act(() => onToggle(enabled)); }} /><span className="personal-switch" aria-hidden="true" /></label>
    <details className="personal-context"><summary>체감 기록 관리</summary>
      <p className="personal-help">답변은 이 기기에 저장돼요. 질문을 꺼도 기존 답변은 보관해요.</p>
      <details className="personal-feedback"><summary>나의 체감 응답 {feedback.length}개</summary>{feedback.length === 0 ? <p className="personal-help">아직 남긴 체감 응답이 없어요.</p> : <ul>{feedback.map(record => {
        const label = record.responseKind === 'daily-feeling' && (record.answer === 'earlier' || record.answer === 'similar' || record.answer === 'later') ? dailyAnswerLabels[record.answer] : answerLabels[record.answer];
        return <li key={record.id}>
          <span className="personal-feedback-date">{formatTargetDate(record.targetDate)}</span><strong>{label}</strong>
          {record.observedInterval && <span>{formatInterval(record.observedInterval, record.timeZone)}</span>}
          {deleteId === record.id ? <div className="personal-confirm"><p>이 응답을 삭제할까요?</p><div className="personal-actions"><button type="button" className="personal-button danger-button" disabled={locked} onClick={() => void act(() => onDeleteFeedback(record.id), () => setDeleteId(null))}>응답 삭제하기</button><button type="button" className="personal-text-button" disabled={locked} onClick={() => setDeleteId(null)}>취소</button></div></div> : <div className="personal-actions">{onEditFeedback && <button type="button" className="personal-text-button" disabled={locked} aria-label={`${formatTargetDate(record.targetDate)} 체감 응답 수정`} onClick={() => onEditFeedback(record)}>수정</button>}<button type="button" className="personal-text-button danger-button" disabled={locked} aria-label={`${formatTargetDate(record.targetDate)} 체감 응답 삭제`} onClick={() => setDeleteId(record.id)}>삭제</button></div>}
        </li>;
      })}</ul>}</details>
      {!confirmClear ? <button type="button" className="personal-management-button danger-button" disabled={locked} onClick={() => setConfirmClear(true)}><Trash2 size={17} aria-hidden="true" /><span>체감 기록 모두 삭제</span></button> : <div className="personal-confirm"><p>체감 응답과 관련 데이터를 모두 삭제할까요? 음료와 섭취 기록은 유지돼요.</p><div className="personal-actions"><button type="button" className="personal-button danger-button" disabled={locked} onClick={() => void act(onClearLearning, () => setConfirmClear(false))}>체감 기록 삭제하기</button><button type="button" className="personal-text-button" disabled={locked} onClick={() => setConfirmClear(false)}>취소</button></div></div>}
    </details>
    {error && <p className="personal-error" role="alert">{error}</p>}
  </section>;
}
