# 구현 계획

1. 사용자 지침을 프로젝트 루트에 적용하고 공식 Toss 문서 및 디자인 스킬 조사.
2. Vite/React/TypeScript, ESLint, Vitest 및 모바일 토큰 설정.
3. 병렬 작업: 순수 카페인 모델/검증 테스트/샘플 음료/비동기 repository 구현.
4. 홈, SVG 인체, 추정 변화 그래프, Bottom Sheet와 inline composer 구현.
5. 기록 수정·삭제, 설정 저장·초기화, 라우팅/뒤로가기, 공식 SDK adapter 구현.
6. 전체 단위 테스트/lint/build와 모바일 두 폭의 실제 브라우저 흐름 검증. 확인한 오류 수정.
7. 실행법, Toss 문서 근거, 미검증 native 항목과 샘플 데이터 한계를 README에 기록.

## Review focus
- 미래 기록의 감소 계산, 여러 날에 걸친 잔존량, 자정/22시 경계.
- 저장소 손상·쓰기 실패에서 기존 데이터를 보존하고 오류 표시.
- 여러 번 열고 닫은 Sheet와 브라우저/native back 기록 정합성.
- 375px 화면과 확대 텍스트에서 overflow/닫기/기록 버튼 접근성.
- 사용자 입력 유효성, 편집 후 즉시 반영, 새로고침 지속성.
