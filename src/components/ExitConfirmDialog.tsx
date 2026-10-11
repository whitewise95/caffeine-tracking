import { useId, useLayoutEffect, useRef, useState } from 'react';
import { closeTossApp } from '../integrations/toss/toss';
import './exit-confirm-dialog.css';

export function ExitConfirmDialog({ onCancel, onClosingChange }: { onCancel: () => void; onClosingChange: (closing: boolean) => void }) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  useLayoutEffect(() => {
    const dialog = ref.current;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      focused?.focus({ preventScroll: true });
    };
  }, []);
  function cancel() { if (!pending.current) onCancel(); }
  async function confirm() {
    if (pending.current) return;
    pending.current = true;
    setClosing(true);
    onClosingChange(true);
    setError('');
    try {
      await closeTossApp();
    } catch {
      pending.current = false;
      setClosing(false);
      onClosingChange(false);
      setError('앱을 종료하지 못했어요. 다시 시도해 주세요.');
    }
  }
  return <dialog ref={ref} role="alertdialog" className="exit-confirm-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); cancel(); }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } }}>
    <h2 id={`${id}-title`}>앱을 나가시겠습니까?</h2>
    <p id={`${id}-description`}>저장한 기록은 다음에 들어와도 그대로 있어요.</p>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="exit-confirm-actions">
      <button type="button" className="button-secondary" disabled={closing} onClick={cancel} autoFocus>취소</button>
      <button type="button" className="button-primary" disabled={closing} onClick={() => void confirm()}>{closing ? '나가는 중…' : '나가기'}</button>
    </div>
  </dialog>;
}
