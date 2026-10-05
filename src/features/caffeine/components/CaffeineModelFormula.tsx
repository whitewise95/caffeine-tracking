import { DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR } from '../model/pharmacokinetics';

export function CaffeineModelFormula({ halfLifeHours }: { halfLifeHours: number }) {
  const eliminationRate = Math.LN2 / halfLifeHours;
  return <>
    <div className="formula" role="math" aria-label="음료별 추정 잔존량은 D 곱하기 ka 나누기 ka 빼기 ke, 곱하기 괄호 e의 마이너스 ke t 제곱 빼기 e의 마이너스 ka t 제곱입니다. D는 섭취량, t는 경과 시간, ka는 흡수 속도 상수, ke는 감소 속도 상수입니다.">
      <div className="formula-expression" aria-hidden="true">
        <span className="formula-line"><i>D</i><span>×</span><span className="formula-fraction"><span className="formula-numerator"><i>k</i><sub>a</sub></span><span className="formula-denominator"><i>k</i><sub>a</sub> − <i>k</i><sub>e</sub></span></span></span>
        <span className="formula-line"><span>× (</span><span className="formula-power"><span className="formula-base">e</span><sup>−<i>k</i><sub>e</sub><i>t</i></sup></span><span>−</span><span className="formula-power"><span className="formula-base">e</span><sup>−<i>k</i><sub>a</sub><i>t</i></sup></span><span>)</span></span>
      </div>
      <p className="formula-caption" aria-hidden="true">한 번에 마신 양에 대한 기본 식이에요.</p>
    </div>
    <details className="formula-details">
      <summary>계산에 사용하는 값</summary>
      <dl>
        <div><dt>D</dt><dd>음료의 카페인 섭취량 (mg)</dd></div>
        <div><dt>t</dt><dd>마신 뒤 경과 시간 (시간)</dd></div>
        <div><dt>k<sub>a</sub></dt><dd>흡수 속도 상수 {DEFAULT_CAFFEINE_ABSORPTION_RATE_PER_HOUR} /시간</dd></div>
        <div><dt>k<sub>e</sub></dt><dd>감소 속도 상수 ln(2) ÷ 반감기<br />현재 {eliminationRate.toFixed(3)} /시간</dd></div>
      </dl>
      <p>음료별로 계산한 값을 더해요. 천천히 마신 기록은 시작부터 마지막 시각까지 일정하게 나눠 마신 것으로 계산해요.</p>
      <p>섭취한 카페인이 모두 흡수된다고 가정해요 (F = 1). 흡수 속도는 <a href="https://pubmed.ncbi.nlm.nih.gov/14674790/" target="_blank" rel="noreferrer">성인 대상 연구</a>의 값을 사용해요.</p>
    </details>
  </>;
}
