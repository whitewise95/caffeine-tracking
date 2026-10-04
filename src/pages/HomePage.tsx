import { Coffee, Plus, ArrowUpRight } from 'lucide-react';
import { CaffeineHero } from '../features/caffeine/components/CaffeineHero';
import { CaffeineSummary } from '../features/caffeine/components/CaffeineSummary';
import { CaffeineForecast } from '../features/caffeine/components/CaffeineForecast';
import { RemainingDrinks } from '../features/caffeine/components/RemainingDrinks';
import { remainingCaffeine, todayIntake } from '../features/caffeine/model/caffeine';
import type { CaffeineState } from '../features/caffeine/model/caffeine.types';
import './home.css';

export function HomePage({ state, now, onAdd, onSettings, onHistory }: { state: CaffeineState; now: Date; onAdd: () => void; onSettings: () => void; onHistory: () => void }) {
  const last = state.entries.filter(entry => new Date(entry.consumedAt) <= now).sort((a, b) => Date.parse(b.consumedAt) - Date.parse(a.consumedAt))[0];
  return <main className="page home-page" id="main-content">
    <header className="page-header"><div className="brand"><span className="brand-mark"><Coffee size={17} strokeWidth={1.65} /></span>카페인</div><span className="header-date">{now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span></header>
    <CaffeineHero remaining={remainingCaffeine(state.entries, now, state.settings.halfLifeHours)} onInfo={onSettings} />
    <CaffeineSummary today={todayIntake(state.entries, now)} last={last} />
    <CaffeineForecast entries={state.entries} halfLifeHours={state.settings.halfLifeHours} now={now} />
    <RemainingDrinks entries={state.entries} halfLifeHours={state.settings.halfLifeHours} now={now} />
    <div className="home-cta"><button className="button-primary full-width add-caffeine-button" onClick={onAdd}><Plus size={19} />카페인 추가</button></div>
    <div className="home-bottom-note"><span>한 잔의 기록, 나를 아는 습관</span><button className="text-button" onClick={onHistory}>기록 보기<ArrowUpRight size={14} /></button></div>
  </main>;
}
