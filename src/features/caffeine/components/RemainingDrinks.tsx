import { DrinkIcon } from '../../../components/icons/DrinkIcon';
import { formatTime, localDateKey } from '../model/caffeine';
import type { CaffeineEntry } from '../model/caffeine.types';
import { MIN_VISIBLE_REMAINING_MG, remainingIntakes } from '../model/remainingIntakes';
import './remaining-drinks.css';

export function RemainingDrinks({ entries, now, halfLifeHours }: { entries: CaffeineEntry[]; now: Date; halfLifeHours: number }) {
  const drinks = remainingIntakes(entries, now, halfLifeHours);
  return <section className="remaining-drinks" aria-labelledby="remaining-drinks-title">
    <header><h2 id="remaining-drinks-title">아직 남아 있는 카페인</h2><span>음료별 추정치</span></header>
    {drinks.length > 0 ? <ul className="remaining-drinks-list">
      {drinks.map(({ entry, remainingMg }) => {
        const consumedAt = new Date(entry.consumedAt);
        const day = localDateKey(consumedAt) === localDateKey(now) ? '오늘' : consumedAt.toLocaleDateString('ko-KR', {
          ...(consumedAt.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}), month: 'long', day: 'numeric',
        });
        return <li key={entry.id}>
          <span className="remaining-drink-icon"><DrinkIcon type={entry.icon} size={18} /></span>
          <div className="remaining-drink-copy"><h3>{entry.drinkName}</h3><time dateTime={entry.consumedAt}>{day} {formatTime(consumedAt)}</time></div>
          <p className="remaining-drink-amount"><strong>{remainingMg.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</strong><span>mg 남음</span></p>
        </li>;
      })}
    </ul> : <p className="remaining-drinks-empty">현재 표시할 음료가 없어요.</p>}
    <p className="remaining-drinks-note">음료별 {MIN_VISIBLE_REMAINING_MG}mg 이상만 표시해요. 더 적은 양도 전체 추정치에 포함돼요.</p>
  </section>;
}
