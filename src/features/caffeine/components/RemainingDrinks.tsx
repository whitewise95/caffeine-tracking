import { DrinkIcon } from '../../../components/icons/DrinkIcon';
import { formatTime, localDateKey } from '../model/caffeine';
import type { CaffeineEntry, Drink } from '../model/caffeine.types';
import { absorptionMinutesRemaining, MIN_VISIBLE_REMAINING_MG, remainingIntakes } from '../model/remainingIntakes';
import { formatHoursMinutes } from '../format';
import './remaining-drinks.css';

export function RemainingDrinks({ entries, drinks, now, halfLifeHours }: { drinks: readonly Drink[]; entries: CaffeineEntry[]; now: Date; halfLifeHours: number }) {
  const remaining = remainingIntakes(entries, now, halfLifeHours);
  return <section className="remaining-drinks" aria-labelledby="remaining-drinks-title">
    <header><h2 id="remaining-drinks-title">아직 남아 있는 카페인</h2><span>흡수된 양의 추정치</span></header>
    {remaining.length > 0 ? <ul className="remaining-drinks-list">
      {remaining.map(({ entry, remainingMg }) => {
        const absorptionMinutes = absorptionMinutesRemaining(entry, now, halfLifeHours);
        const consumedAt = new Date(entry.consumedAt);
        const day = localDateKey(consumedAt) === localDateKey(now) ? '오늘' : consumedAt.toLocaleDateString('ko-KR', {
          ...(consumedAt.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}), month: 'long', day: 'numeric',
        });
        const start = entry.startedAt ? new Date(entry.startedAt) : null;
        const startDay = start && localDateKey(start) !== localDateKey(consumedAt) ? `${start.toLocaleDateString('ko-KR', { ...(start.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}), month: 'long', day: 'numeric' })} ` : '';
        const timeLabel = start ? `${startDay || `${day} `}${formatTime(start)} – ${startDay ? `${day} ` : ''}${formatTime(consumedAt)}` : `${day} ${formatTime(consumedAt)}`;
        return <li key={entry.id}>
          <span className="remaining-drink-icon"><DrinkIcon photoDataUrl={drinks.find(drink => drink.id === entry.drinkId)?.photoDataUrl} type={entry.icon} size={18} /></span>
          <div className="remaining-drink-copy"><h3>{entry.drinkName}</h3><time dateTime={entry.consumedAt}>{timeLabel}</time></div>
          <div className="remaining-drink-status">
            {remainingMg >= MIN_VISIBLE_REMAINING_MG && <p className="remaining-drink-amount"><strong>{remainingMg.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</strong><span>mg 남음</span></p>}
            {absorptionMinutes !== null && <span className="remaining-drink-absorbing"><span>흡수 중</span><strong className="remaining-absorption-time">약 {formatHoursMinutes(absorptionMinutes / 60)} 남음</strong></span>}
          </div>
        </li>;
      })}
    </ul> : <p className="remaining-drinks-empty">현재 표시할 음료가 없어요.</p>}
    <p className="remaining-drinks-note">흡수 중이거나 추정 잔존량이 {MIN_VISIBLE_REMAINING_MG}mg 이상인 음료예요. 더 적은 잔존량도 전체 추정치에 포함돼요.</p>
  </section>;
}
