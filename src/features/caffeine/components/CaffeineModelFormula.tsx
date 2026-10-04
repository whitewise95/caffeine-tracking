export function CaffeineModelFormula() {
  return <div className="formula" role="math" aria-label="음료별 추정 잔존량은 섭취량 곱하기 0.5의 경과 시간 나누기 반감기 제곱. 시간 단위는 시간입니다.">
    <div className="formula-expression" aria-hidden="true">
      <span>섭취량 ×</span>
      <span className="formula-power"><span className="formula-base">0.5</span><sup><span className="formula-fraction"><span className="formula-numerator">경과 시간</span><span className="formula-denominator">반감기</span></span></sup></span>
    </div>
    <p className="formula-caption" aria-hidden="true">시간 단위: 시간</p>
  </div>;
}
