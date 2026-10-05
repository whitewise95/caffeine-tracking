import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RemainingDrinks } from '../features/caffeine/components/RemainingDrinks';
import { caffeineEstimate } from '../features/caffeine/model/caffeine';
import type { CaffeineEntry, Drink } from '../features/caffeine/model/caffeine.types';
import './remaining-caffeine.css';

export function RemainingCaffeinePage({ entries, drinks, now, halfLifeHours, onBack }: {
  entries: CaffeineEntry[];
  drinks: readonly Drink[];
  now: Date;
  halfLifeHours: number;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const estimate = caffeineEstimate(entries, now, halfLifeHours);
  return <main className="page remaining-page" id="main-content">
    <header className="page-header">
      <button className="icon-button" aria-label="홈으로 돌아가기" onClick={onBack}><ArrowLeft size={22} aria-hidden="true" /></button>
      <h1 className="page-title" ref={heading} tabIndex={-1}>음료별 잔존 카페인</h1>
    </header>
    <div className="remaining-total">
      <span className="estimate-label">현재 추정 잔존 카페인</span>
      <p><strong data-testid="remaining-mg">{Math.round(estimate.remainingMg)}</strong><span>mg</span></p>
    </div>
    <RemainingDrinks entries={entries} drinks={drinks} now={now} halfLifeHours={halfLifeHours} />
  </main>;
}
