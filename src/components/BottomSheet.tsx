import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';

export function BottomSheet({ title, onClose, onBack, backLabel = '음료 목록으로 돌아가기', onCancel, className = '', children }: { title: string; onClose: () => void; onBack?: () => void; backLabel?: string; onCancel?: () => void; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      focused?.focus();
    };
  }, []);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  return <dialog ref={ref} className={`sheet-dialog ${className}`} aria-labelledby="sheet-title"
    onCancel={event => {
      // A file picker inside the sheet emits its own bubbling cancel event.
      // Only a cancellation of the dialog itself should dismiss or go back.
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      (onCancel ?? onClose)();
    }}
    onClick={event => { if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right) onClose();
    } }}>
    <div className="sheet-handle" aria-hidden="true" />
    <div className="sheet-header">{onBack && <button className="icon-button sheet-back" aria-label={backLabel} onClick={onBack}><ArrowLeft size={22} aria-hidden="true" /></button>}<h2 ref={heading} tabIndex={-1} id="sheet-title">{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={22} /></button></div>
    {children}
  </dialog>;
}
