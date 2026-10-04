import type { ReactNode } from 'react';
import { Clock3, Info, RotateCcw, ChevronRight } from 'lucide-react';
import { CaffeineModelFormula } from '../features/caffeine/components/CaffeineModelFormula';
import './secondary.css';

export function SettingsPage({ onReset, personalization, halfLifeHours }: { onReset: () => void; personalization?: ReactNode; halfLifeHours: number }) {
  const totalMinutes = Math.round(halfLifeHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return <main className="page" id="main-content">
    <header className="page-header"><div><span className="eyebrow">MAKE IT YOURS</span><h1 className="page-title">설정</h1><p className="page-subtitle">나의 기록 기준을 설정해요.</p></div></header>
    <section className="settings-section" aria-labelledby="half-life-title"><div className="section-heading"><Clock3 size={18} aria-hidden="true" /><h2 id="half-life-title">현재 계산 반감기</h2></div>
      <p className="halflife-value" data-testid="half-life-value" aria-label={`${hours}시간 ${minutes}분`}><span className="halflife-part"><strong>{hours}</strong>시간</span><span className="halflife-part"><strong>{minutes}</strong>분</span></p>
      <p className="settings-description">체감 답변을 바탕으로 나의 체감 보정값이 조금씩 조정돼요.</p>
    </section>
    <section className="settings-section"><div className="section-heading"><Info size={18} aria-hidden="true" /><h2>추정치는 이렇게 계산해요</h2></div><p className="settings-description">각 음료의 추정 잔존량을 더해요. 섭취 직후 전량이 흡수된 것으로 단순화한 모델이에요.</p><CaffeineModelFormula /><p className="model-disclaimer">실제 체내 카페인을 측정한 값이 아니에요. 개인차가 있으며, 0mg 표시가 완전한 제거를 뜻하지는 않아요.</p></section>
    {personalization}
    <section className="settings-section settings-plain"><button className="reset-row" onClick={onReset}><RotateCcw size={18} /><span>모든 데이터 초기화</span><ChevronRight size={18} /></button><p className="settings-description">섭취 기록, 내 음료와 체감 응답 등 앱에 저장한 데이터를 모두 삭제해요.</p></section>
    <footer className="app-info"><span className="brand">카페인</span><span>나를 알아가는 한 잔의 기록</span><small>버전 0.1.0 · 이 기기에 저장돼요</small><small>기본 음료의 수치는 일반적인 예시값이에요.</small></footer>
  </main>;
}
