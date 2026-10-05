import { Coffee, Plus, ArrowUpRight, ChevronRight } from 'lucide-react';
import { CaffeineHero } from '../features/caffeine/components/CaffeineHero';
import { CaffeineSummary } from '../features/caffeine/components/CaffeineSummary';
import { CaffeineForecast } from '../features/caffeine/components/CaffeineForecast';
import { caffeineEstimate, todayIntake } from '../features/caffeine/model/caffeine';
import type { CaffeineState } from '../features/caffeine/model/caffeine.types';
import './home.css';

export function HomePage({ state, halfLifeHours, now, onAdd, onHistory, onRemaining }: { state: CaffeineState; halfLifeHours: number; now: Date; onAdd: () => void; onHistory: () => void; onRemaining: () => void }) {
  const last = state.entries.filter(entry => new Date(entry.consumedAt) <= now).sort((a, b) => Date.parse(b.consumedAt) - Date.parse(a.consumedAt))[0];
  const estimate = caffeineEstimate(state.entries, now, halfLifeHours);
  return <main className="page home-page" id="main-content">
    <header className="page-header"><div className="brand"><span className="brand-mark"><Coffee size={17} strokeWidth={1.65} /></span>카페인 트래커</div><span className="header-date">{now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span></header>
    <CaffeineHero remaining={estimate.remainingMg} />
    <button id="remaining-details-button" className="remaining-details-button" onClick={onRemaining}>아직 남아 있는 카페인 보기<ChevronRight size={16} aria-hidden="true" /></button>
    <CaffeineSummary today={todayIntake(state.entries, now)} last={last}>
      <CaffeineForecast entries={state.entries} halfLifeHours={halfLifeHours} now={now} />
    </CaffeineSummary>
    <div className="home-cta"><button className="button-primary full-width add-caffeine-button" onClick={onAdd}><Plus size={19} />카페인 추가</button></div>
    <div className="home-bottom-note"><span>한 잔의 기록, 나를 아는 습관</span><button className="text-button" onClick={onHistory}>기록 보기<ArrowUpRight size={14} /></button></div>
  </main>;
}
