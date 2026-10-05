import { Clock3, Info, RotateCcw, ChevronRight, Smartphone, ListOrdered } from 'lucide-react';
import { DEFAULT_CAFFEINE_HALF_LIFE_HOURS } from '../features/caffeine/model/caffeine';
import { CaffeineModelFormula } from '../features/caffeine/components/CaffeineModelFormula';
import { formatHoursMinutes } from '../features/caffeine/format';
import { ThemeSettings, type ThemeSettingsProps } from './ThemeSettings';
import './secondary.css';

export function SettingsPage({ onReset, onManageCategories, themeSettings }: { onReset: () => void; onManageCategories: () => void; themeSettings?: ThemeSettingsProps }) {
  const halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_HOURS;
  return <main className="page" id="main-content">
    <header className="page-header"><div><h1 className="page-title">설정</h1><p className="page-subtitle">나의 기록 기준을 설정해요.</p></div></header>
    {themeSettings && <ThemeSettings {...themeSettings} />}
    <button className="settings-section settings-category-entry" aria-label="카테고리 관리" onClick={onManageCategories}><ListOrdered size={20} aria-hidden="true" /><span>카테고리 관리<small>음료를 나누고 순서를 정해요</small></span><ChevronRight size={20} aria-hidden="true" /></button>
    <section className="settings-section" aria-labelledby="half-life-title"><div className="section-heading"><Clock3 size={18} aria-hidden="true" /><h2 id="half-life-title">카페인 반감기</h2></div>
      <p className="settings-description">몸에 남아 있는 카페인이 절반으로 줄어드는 데 걸리는 시간이에요.</p>
      <p className="settings-description">유럽식품안전청(EFSA)은 일반 성인의 반감기를 평균 약 4시간, 개인차에 따라 약 2~8시간으로 설명해요.</p>
      <p className="settings-description" data-testid="half-life-description">지금 카페인에서는 반감기를 {formatHoursMinutes(halfLifeHours)}으로 두고 잔존량을 추정해요.</p>
      <details className="half-life-sources">
        <summary>연구와 출처 보기</summary>
        <p>성인 남성 59명을 분석한 연구에서는 비흡연자의 평균 반감기가 약 4.3시간으로 보고됐어요. 모든 사람의 반감기가 같은 것은 아니에요.</p>
        <div className="half-life-source-links">
          <a href="https://pubmed.ncbi.nlm.nih.gov/19125908/" target="_blank" rel="noreferrer">성인 대상 논문 · 2009</a>
          <a href="https://www.efsa.europa.eu/sites/default/files/corporate_publications/files/efsaexplainscaffeine150527.pdf" target="_blank" rel="noreferrer">EFSA 설명 자료 · 2015</a>
        </div>
      </details>
    </section>
    <section className="settings-section"><div className="section-heading"><Info size={18} aria-hidden="true" /><h2>추정치는 이렇게 계산해요</h2></div><p className="settings-description">음료마다 마신 시각부터 흡수와 감소를 계산해 더해요. 흡수된 양을 기준으로 하므로, 처음에는 추정량이 늘 수 있어요.</p><CaffeineModelFormula halfLifeHours={halfLifeHours} /><p className="model-disclaimer">실제 체내 카페인을 측정한 값이 아니에요. 개인차가 있을 수 있어요.</p></section>
    <section className="settings-section settings-plain" aria-labelledby="device-storage-title">
      <div className="section-heading"><Smartphone size={18} aria-hidden="true" /><h2 id="device-storage-title">이 기기에만 저장돼요</h2></div>
      <p className="settings-description">섭취 기록과 내 음료·카테고리는 이 기기에만 저장돼요.</p>
      <p className="settings-description">기기를 변경하거나 토스 앱·기기 데이터를 삭제하면 기록이 사라질 수 있어요. 삭제된 데이터는 복구할 수 없어요.</p>
      <button className="reset-row" onClick={onReset}><RotateCcw size={18} aria-hidden="true" /><span>모든 데이터 초기화</span><ChevronRight size={18} aria-hidden="true" /></button>
    </section>
    <footer className="app-info"><span className="brand">지금 카페인</span><span>나를 알아가는 한 잔의 기록</span></footer>
  </main>;
}
