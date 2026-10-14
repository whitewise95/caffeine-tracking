import './record-calendar.css';

export function RecordCountLegend({ className = '' }: { className?: string }) {
  return <div className={`record-count-legend ${className}`} role="group" aria-label="하루 기록 수별 색상">
    {[0, 1, 2, 3, 4].map(level => <span key={level}><i data-level={level} aria-hidden="true" />{level === 4 ? '4개 이상' : `${level}개`}</span>)}
  </div>;
}
