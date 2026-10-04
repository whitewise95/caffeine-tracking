import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './modal.css';

export function Modal({ title, description, onClose, busy = false, children }: {
  title: string;
  description: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    titleRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (focused?.isConnected) focused.focus();
    };
  }, []);

  return <dialog ref={dialogRef} className="popup-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="popup-heading">
      <span className="popup-eyebrow">DAILY CHECK-IN</span>
      <button type="button" className="icon-button" aria-label="닫기" disabled={busy} onClick={onClose}><X size={20} aria-hidden="true" /></button>
    </header>
    <h2 ref={titleRef} id={`${id}-title`} tabIndex={-1}>{title}</h2>
    <p id={`${id}-description`} className="popup-description">{description}</p>
    {children}
  </dialog>;
}
