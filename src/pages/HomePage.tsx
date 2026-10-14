import { Coffee, ChevronRight } from 'lucide-react';
import { CaffeineHero } from '../features/caffeine/components/CaffeineHero';
import { CaffeineSummary } from '../features/caffeine/components/CaffeineSummary';
import { CaffeineForecast } from '../features/caffeine/components/CaffeineForecast';
import { caffeineEstimate, todayIntake } from '../features/caffeine/model/caffeine';
import { DEFAULT_BEDTIME } from '../features/caffeine/model/bedtime';
import type { CaffeineState } from '../features/caffeine/model/caffeine.types';
import { MIN_VISIBLE_REMAINING_MG, remainingIntakes } from '../features/caffeine/model/remainingIntakes';
import './home.css';
import type { AvatarOutfit } from '../features/avatar/model/avatar.types';

export function HomePage({ state, halfLifeHours, now, onAdd, onRemaining, intakePulse, outfit, onWardrobe }: { intakePulse?: number; state: CaffeineState; halfLifeHours: number; now: Date; onAdd: () => void; onRemaining: () => void; outfit?: AvatarOutfit; onWardrobe: () => void }) {
  const estimate = caffeineEstimate(state.entries, now, halfLifeHours);
  const absorbingCount = remainingIntakes(state.entries, now, halfLifeHours).filter(item => item.absorbingMg >= MIN_VISIBLE_REMAINING_MG).length;
  const last = state.entries.filter(entry => new Date(entry.consumedAt) <= now).sort((a, b) => Date.parse(b.consumedAt) - Date.parse(a.consumedAt))[0];
  return <main className="page home-page" id="main-content">
    <header className="page-header"><div className="home-heading"><div className="brand"><span className="brand-mark"><Coffee size={17} strokeWidth={1.65} aria-hidden="true" /></span>지금 카페인</div><span className="header-date">{now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span></div></header>
    <CaffeineHero remaining={estimate.remainingMg} absorbingCount={absorbingCount} intakePulse={intakePulse} tiltEnabled={state.settings.tiltAnimation ?? false} onAdd={onAdd} outfit={outfit} onWardrobe={onWardrobe} />
    <button id="remaining-details-button" className="remaining-details-button" onClick={onRemaining}>아직 남아 있는 카페인 보기<ChevronRight size={16} aria-hidden="true" /></button>
    <CaffeineSummary today={todayIntake(state.entries, now)} last={last}>
      <CaffeineForecast entries={state.entries} halfLifeHours={halfLifeHours} now={now} bedtime={state.settings.bedtime ?? DEFAULT_BEDTIME} />
    </CaffeineSummary>
  </main>;
}
