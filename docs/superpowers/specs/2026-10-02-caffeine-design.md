# 지금 카페인 MVP

사용자가 제공한 AGENTS.md와 CODEX_INITIAL_PROMPT.md를 개발 기준으로 적용한다. 새 React/TypeScript/Vite 프로젝트이며 기존 기능은 없다. 사용자가 중간 승인 없이 실제 구현을 요청했으므로 이 설계에서 바로 개발한다.

## 제품과 화면
개인 음료 기록으로 반감기 모델의 카페인 잔존 **추정치**를 표시한다. 홈에는 날짜, 큰 잔존량 숫자, SVG 인체와 잔존량에 따른 액체, 오늘 섭취량·마지막 섭취·22시 예상량, 추가 CTA가 있다. 초기 기록은 비어 있다. 추가 Bottom Sheet의 세로 카테고리에서 compact chip을 선택하고 5mg 조절 후 즉시 기록한다. 각 카테고리의 + 버튼은 같은 Sheet에 커스텀 음료 composer를 펼친다. 기록 화면은 날짜별 수정·삭제, 설정은 반감기·모델·초기화·앱 정보를 제공한다.

## 시각 설계
사용자의 Near Black/OLED 색상과 charcoal surface를 우선한다. Cyan은 인체 액체 및 잔존 데이터 시각화에만 쓴다. Pink는 선택 표시와 HIGH_VISUAL의 얇은 halo에 한정한다. 숫자는 tabular, 한국어는 시스템 폰트, 터치 영역 48px, 충분한 대비, wrapping, reduced-motion을 적용한다. UI/UX Pro Max의 첫 디자인 시스템 검색은 B2B landing/medical palette로 부적합하여 이를 채택하지 않고, dark mode 및 modal 접근성 도메인 결과를 적용한다.

## 구조와 상태
UI/순수 계산/비동기 repository/Toss adapter를 분리한다. React의 단일 hook이 저장 성공 후 상태를 갱신하며 실패 시 명시적 오류를 제공한다. 기록과 custom drinks와 settings를 versioned snapshot으로 저장한다. 향후 서버 repository로 교체 가능하다. 로그인/서버는 MVP에 필요하지 않다.

## 통합과 검증
Toss API는 연결된 공식 MCP에서 확인하고 적용한다. 문서 제약과 요청 디자인의 충돌은 명시한다. 웹 브라우저 fallback, SafeArea, navigation, overlay-first back을 제공한다. 계산/저장 unit test, lint/typecheck/build, 375/390px 브라우저 실제 사용자 흐름을 검증한다. Native Sandbox 실행은 사용자의 등록 appName과 기기 접근 가능 여부에 따라 검증 범위를 구분한다.
