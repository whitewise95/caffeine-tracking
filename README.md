# 카페인 · 나의 카페인 기록

Apps in Toss WebView용 React + TypeScript + Vite MVP입니다. 섭취한 카페인과 경과 시간으로 **현재 잔존 카페인의 추정치**를 계산합니다. 의료기기나 측정 서비스가 아닙니다.

사용자가 제공한 [AGENTS.md](./AGENTS.md)와 [개발 프롬프트](./CODEX_INITIAL_PROMPT.md)를 프로젝트 루트에 적용했습니다.

## 실행

Node.js **24 이상**을 사용합니다. 현재 개발 도구의 요구 버전입니다.

```bash
npm install
npm run dev
```

기본 주소는 `http://localhost:5173`입니다. `/`, `/history`, `/settings` 경로를 지원합니다. 로컬 미리보기는 요청한 OLED 다크 디자인이며 `/?theme=light`로 Toss용 라이트 테마를 확인할 수 있습니다.

```bash
npm run dev:toss    # 공식 AIT Devtools를 연결한 SDK 모의 환경
npm run lint
npm test           # 계산·저장소·Toss adapter 단위 테스트
npm run test:e2e    # 375px / 390px 실제 Chrome 사용자 흐름
npm run build      # TypeScript 검사 + dist/ 생성
npm run build:toss # 위 빌드 + caffeine-tracking.ait 생성
```

브라우저 테스트는 기본적으로 설치된 Chrome을 사용합니다. Chrome 대신 Playwright Chromium을 쓰려면 `npx playwright install chromium` 후 `PLAYWRIGHT_BROWSER=chromium npm run test:e2e`를 실행합니다. 브라우저 테스트는 임시 테스트 저장소만 사용하며 미리보기의 사용자 기록을 변경하지 않습니다.

## 구현한 기능

- 홈: 인체 중심의 SVG 액체 시각화와 표면 찰랑임, 현재 추정 잔존량, 오늘 섭취량, 마지막 섭취 시각, 다음 밤 10시 예상량. 하단에는 음료별 추정 잔존량이 1mg 이상인 섭취 기록을 보여주며 이전 날짜의 기록도 포함합니다.
- 한 개의 Bottom Sheet: 카테고리별 음료 chip, 선택 체크, 5mg 조절, 현재 시각으로 기록. 각 카테고리의 +에서 아이콘·이름·카페인량을 한 번에 입력.
- 기록: 월간 캘린더와 선택한 날짜의 시간순 목록, 날짜별 총량·잔 수, 섭취량 및 시각 수정, 확인 후 삭제. 미래 날짜와 미래 달은 표시하지 않습니다.
- 설정: 현재 계산 반감기를 시간·분으로 표시하고 분수 지수로 계산식을 설명합니다. 다음 날 체감 질문 설정·응답 수정/삭제·체감 기록 삭제, 확인 후 전체 초기화, 앱 정보를 제공합니다. 사용자가 반감기를 조절하는 기능은 제공하지 않습니다.
- 다음 날 체크인: 전날 섭취 기록이 있고 미응답이면 홈에서 팝업으로 `오래 갔어요 / 비슷했어요 / 빨리 줄었어요`를 묻습니다. 별도의 체감 보정값만 조정하며 실제 반감기·잔존 mg는 바뀌지 않습니다. 체감 지속 시간 예측과 최근 7일 체감 요약은 화면에 표시하지 않습니다.
- 키보드 포커스 제한/복원, Esc·브라우저 뒤로가기, 줄바꿈, reduced motion, 저장 실패 표시, 손상된 저장 데이터 보호.

첫 실행은 **빈 기록**으로 시작합니다. 데모 섭취 이력을 실제 기록처럼 삽입하지 않습니다.

## 구조

```text
src/app/                         앱 연결과 History API 라우팅
src/pages/                       홈·기록·설정
src/features/caffeine/model/     순수 반감기 계산, 타입, 단위 테스트
src/features/caffeine/data/      4개 카테고리·13개 기본 음료
src/features/caffeine/repository/ 저장소 경계, 스키마 검증, 테스트
src/features/caffeine/hooks/     비동기 저장과 React 상태
src/features/caffeine/components/ 시각화, Summary, Forecast, Sheet, chips, composer
src/features/personalization/     체감 예측·체크인·규제 학습·시간순 평가·응답 관리
src/integrations/toss/           공식 SDK adapter와 테스트
src/styles/                     공통 토큰, OLED 기본 테마, Toss 라이트 테마
```

주요 컴포넌트: `CaffeineBodyVisual`, `CaffeineHero`, `CaffeineSummary`, `CaffeineForecast`, `AddCaffeineSheet`, `DrinkCategorySection`, `DrinkBadge`, `QuickAdjustBar`, `CustomDrinkComposer`.

React state만 사용하며 별도 상태관리·라우터·차트 라이브러리는 추가하지 않았습니다. 아이콘은 Lucide, 인체/예측선은 직접 작성한 SVG입니다. TDS는 공식 FAQ상 선택 사항이므로 사용하지 않는 의존성을 추가하지 않았습니다.

## 계산과 데이터

각 기록의 잔존량은 `doseMg × 0.5^(elapsedHours / 5)`이며 복수 기록을 합산합니다. 기본 반감기 5시간은 고정된 제품 초기 가정이며 개인에게 측정된 값이 아닙니다. 미래 기록은 제외하고 전날 기록은 자정 이후에도 이어서 계산합니다. 섭취 직후 전량이 흡수된 것으로 단순화합니다. 반올림된 0mg도 실제 완전 제거를 뜻하지 않습니다. `LOW`, `LIGHT`, `FILLED`, `HIGH_VISUAL`은 **시각 효과용 구간**입니다.

체감 개인화는 별도 실험 모델입니다. 초기 6시간과 보정 한계·학습률·개인화 적용 조건은 논문에서 확정한 값이 아닌 제품 가정입니다. 현재 일일 응답은 방향에 따라 보정값을 최대 15분씩 조정하며 `비슷했어요`는 유지합니다. 기존 예측 엔진과 과거 스냅샷은 호환성을 위해 보존하지만 현재 UI에서 새 체감 예측을 생성·노출하지 않습니다. 불명확한 응답·교란·변경된 섭취 기록은 학습에서 제외합니다. 실제 사용자 성능은 아직 검증하지 않았습니다.

근거·설계·검증 계획: [문헌 근거표](./docs/research/caffeine-evidence.md), [체감 모델 설계](./docs/research/personalization-model.md), [실제 데이터 검증 계획](./docs/research/personalization-validation.md).

기본 음료 13개의 카페인 수치는 모두 `sourceType: 'sample'`인 **참고용 예시값**입니다. 실제 값은 제품·브랜드·용량·추출 방식에 따라 다릅니다. 공식 브랜드 자료로 표시하지 않습니다. 커스텀 음료는 `sourceType: 'custom'`으로 구분합니다.

브라우저는 repository 내부 localStorage, Toss는 공식 SDK `Storage`를 사용합니다. 기존 저장 키의 JSON을 스키마 v2로 마이그레이션하고 기록·커스텀 음료·예측 스냅샷·응답·학습 이력을 함께 저장합니다. 이전 수동 반감기는 이력 정보로만 보관하고 현재 계산에는 5시간을 사용합니다. 저장 성공 후에만 화면 상태가 바뀝니다. 손상된 데이터는 자동 덮어쓰기하지 않고 재시도·초기화 선택을 제공합니다. 체감 학습 초기화는 섭취 기록·음료를 지우지 않습니다. 여러 기기 간 동기화나 외부 서버로의 개인 기록 전송은 지원하지 않습니다.

## Apps in Toss 적용과 출시 전 확인

공식 MCP와 SDK 3.7.0으로 확인한 상세 근거는 [Toss 연동 조사 문서](./docs/toss-integration.md)에 있습니다.

- SDK 3.x `apps-in-toss.config.ts`, `webView`, `webBundleDir`, `ait build` 적용.
- `SafeArea.get/subscribe`, `graniteEvent`의 `backEvent`, `Screen.setIosSwipeBack`, `Storage` 연결.
- Bottom Sheet가 먼저 닫히며, 홈에서는 호스트의 기본 종료 동작을 사용합니다. 지연 저장 뒤 추가 뒤로가기가 발생하지 않도록 방어합니다.
- 비게임 앱 공식 체크리스트는 **라이트 모드**와 floating 하단 탭을 요구합니다. 따라서 Toss 런타임은 라이트 테마를 사용하고, 일반 웹 미리보기는 요청한 OLED 디자인을 유지합니다.
- SDK 3.x는 과거 별도 Sandbox 앱 대신 **AIT Devtools와 실제 토스 앱 QR 테스트**를 사용합니다. Devtools는 모의 환경이며 실제 기기 확인을 대신하지 않습니다.

콘솔에서 등록한 appName을 사용해 빌드하세요. 현재 `caffeine-tracking`은 개발용 기본값이며 실제 콘솔 등록을 완료했다는 의미가 아닙니다.

```bash
TOSS_APP_NAME=실제등록한appName npm run build:toss
```

생성된 `.ait`를 콘솔에 업로드한 뒤, 콘솔이 제공하는 QR/`intoss-private://` 링크로 iOS·Android에서 여백, 네이티브 뒤로가기, swipe, 기록 저장, 경로 직접 진입을 확인해야 합니다. 정식 경로는 `intoss://{appName}/history`와 같은 형식입니다. 이 저장소 작업에서는 외부 배포·콘솔 등록을 수행하지 않았습니다.

## 서버/API

현재 MVP에는 로그인·서버가 필요하지 않습니다. 다음 단계에서 기기 간 동기화가 필요하면 계정별 기록/음료 API와 서버의 Toss 로그인 토큰 교환이 필요합니다. 브랜드별 공식 카페인 데이터를 제공하려면 출처·용량·갱신일을 관리하는 검증된 카탈로그가 필요합니다. 토큰과 서버 비밀정보는 클라이언트에 넣지 않습니다.
