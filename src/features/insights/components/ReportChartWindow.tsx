import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const VISIBLE_BARS = 7;

export function ReportChartWindow({ count, selected, initialIndex, label, valueText, helpId, rangeLabels, onSelect, children }: {
  count: number;
  selected: number;
  initialIndex: number;
  label: string;
  valueText: string;
  helpId: string;
  rangeLabels: string[];
  onSelect: (index: number) => void;
  children: ReactNode;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [initialStart] = useState(() => Math.max(0, Math.min(count - VISIBLE_BARS, initialIndex - 3)));
  const [start, setStart] = useState(initialStart);
  const drag = useRef<{ x: number; y: number; left: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const visible = Math.min(VISIBLE_BARS, count);
  const maximumStart = Math.max(0, count - visible);

  useLayoutEffect(() => {
    const element = viewport.current!;
    let width = element.clientWidth;
    element.scrollLeft = initialStart * width / visible;
    const observer = new ResizeObserver(() => {
      const nextWidth = element.clientWidth;
      if (nextWidth !== width && width > 0) element.scrollLeft *= nextWidth / width;
      width = nextWidth;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [initialStart, visible]);

  function select(index: number) {
    const element = viewport.current!;
    const slot = element.clientWidth / visible;
    const left = index * slot;
    if (left < element.scrollLeft) element.scrollLeft = left;
    else if (left + slot > element.scrollLeft + element.clientWidth) element.scrollLeft = left + slot - element.clientWidth;
    onSelect(index);
  }

  function moveWindow(direction: number) {
    const element = viewport.current!;
    const next = Math.max(0, Math.min(maximumStart, Math.round(element.scrollLeft / element.clientWidth * visible) + direction * visible));
    element.scrollLeft = next * element.clientWidth / visible;
  }

  return <div className="report-chart-window">
    <div ref={viewport} className="report-chart-viewport" role="slider" tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={count - 1} aria-valuenow={selected} aria-valuetext={valueText} aria-describedby={helpId}
      onScroll={event => setStart(Math.max(0, Math.min(maximumStart, Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth * visible))))}
      onClick={event => {
        if (skipClick.current) { skipClick.current = false; return; }
        const element = event.currentTarget;
        const x = event.clientX - element.getBoundingClientRect().left + element.scrollLeft;
        onSelect(Math.max(0, Math.min(count - 1, Math.floor(x / (element.clientWidth / visible)))));
      }}
      onKeyDown={event => {
        const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
        if (!delta && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        select(event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : Math.max(0, Math.min(count - 1, selected + delta)));
      }}
      onPointerDown={event => {
        skipClick.current = false;
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={event => {
        const gesture = drag.current;
        if (!gesture) return;
        if (event.buttons !== 1) { drag.current = null; return; }
        const dx = event.clientX - gesture.x;
        if (!gesture.moved && (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - gesture.y))) return;
        if (!gesture.moved) { gesture.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
        event.preventDefault();
        event.currentTarget.scrollLeft = gesture.left - dx;
      }}
      onPointerUp={() => { skipClick.current = drag.current?.moved ?? false; drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}>
      <div className="report-chart-scroll-content" style={{ width: `${count / visible * 100}%` }}>{children}</div>
    </div>
    {count > visible && <div className="report-chart-navigation">
      <button type="button" aria-label="이전 구간 보기" disabled={start === 0} onClick={() => moveWindow(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
      <span>{rangeLabels[start]}–{rangeLabels[Math.min(count - 1, start + visible - 1)]}</span>
      <button type="button" aria-label="다음 구간 보기" disabled={start === maximumStart} onClick={() => moveWindow(1)}><ChevronRight size={18} aria-hidden="true" /></button>
    </div>}
  </div>;
}
