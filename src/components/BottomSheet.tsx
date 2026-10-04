import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
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
  return <dialog ref={ref} className="sheet-dialog" aria-labelledby="sheet-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right) onClose();
    } }}>
    <div className="sheet-handle" aria-hidden="true" />
    <div className="sheet-header"><h2 id="sheet-title">{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={22} /></button></div>
    {children}
  </dialog>;
}
