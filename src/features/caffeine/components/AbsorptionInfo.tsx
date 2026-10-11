import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CircleAlert, X } from 'lucide-react';
import { ExternalLink } from '../../../components/ExternalLink';
import { MIN_VISIBLE_REMAINING_MG } from '../model/remainingIntakes';
import './absorption-info.css';

export function AbsorptionInfo({ count }: { count: number }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ above: true, height: 400 });

  function closeAndFocus() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const bounds = trigger.current?.getBoundingClientRect();
      if (!bounds) return;
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const above = bounds.top - top - 20;
      const below = bottom - bounds.bottom - 20;
      const useAbove = above >= 240 || above >= below;
      setPlacement({ above: useAbove, height: Math.max(80, useAbove ? above : below) });
    }
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus({ preventScroll: true });
    function dismissOutside(event: Event) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeAndFocus();
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return <div className="absorption-info" ref={root}>
    <button ref={trigger} className="absorption-info-trigger" aria-label={`흡수 중 ${count}잔 설명`} aria-expanded={open} aria-controls={open ? `${id}-bubble` : undefined} aria-haspopup="dialog" onClick={() => setOpen(value => !value)}>
      <span>흡수 중 <strong>{count}잔</strong></span><CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
    {open && <div id={`${id}-bubble`} className="absorption-info-bubble" data-side={placement.above ? 'above' : 'below'} role="dialog" aria-labelledby={`${id}-title`} style={{ maxHeight: placement.height }}>
      <div className="absorption-info-content">
        <div className="absorption-info-heading">
          <h2 id={`${id}-title`}>흡수 중이란?</h2>
          <button ref={closeButton} className="absorption-info-close" aria-label="흡수 설명 닫기" onClick={closeAndFocus}><X size={18} aria-hidden="true" /></button>
        </div>
        <p>카페인은 서서히 흡수돼요. 혈중 농도는 보통 섭취 <strong>30~120분 후</strong> 가장 높아지지만 개인차가 있어요. 흡수와 분해는 동시에 진행돼요.</p>
        <p>앱에서는 기록한 시각과 양을 바탕으로, 아직 흡수되지 않은 카페인이 <strong>{MIN_VISIBLE_REMAINING_MG}mg 이상</strong>으로 추정되는 음료를 세어요. 실제 흡수 상태를 측정한 값은 아니에요.</p>
        <div className="absorption-info-sources" aria-label="참고 논문">
          <ExternalLink href="https://pubmed.ncbi.nlm.nih.gov/14674790/">흡수·분해 연구 <span>Terziivanov 외, 2003 ↗</span></ExternalLink>
          <ExternalLink href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6247400/">약동학 문헌 검토 <span>Willson, 2018 ↗</span></ExternalLink>
        </div>
      </div>
    </div>}
  </div>;
}
