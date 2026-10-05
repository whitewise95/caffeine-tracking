# Codex 최초 실행 프롬프트

현재 프로젝트의 `AGENTS.md`를 먼저 읽고 그 지침을 최우선으로 따라라.

이 프로젝트를 Apps in Toss WebView용 카페인 추적 앱 MVP로 실제 구현해라.

이번 작업은 기획 문서나 와이어프레임 작성이 목적이 아니다. 실제로 실행 가능한 React + TypeScript + Vite 앱을 완성하는 것이 목표다.

## 1. 먼저 조사

코드를 수정하기 전에 다음을 수행해라.

1. 현재 저장소 전체 구조를 확인한다.
2. `package.json`을 확인한다.
3. 기존 React/Vite 설정을 확인한다.
4. `.agents/skills/ui-ux-pro-max/` 존재 여부를 확인한다.
5. 존재하면 UI/UX Pro Max skill을 읽고 사용한다.
6. 연결된 Apps in Toss MCP가 있다면 최신 공식 문서를 조사한다.

특히 Toss MCP에서 아래 항목을 확인해라.

- React/WebView 권장 프로젝트 구성
- WebView SDK 초기화
- Safe Area
- iOS/Android 뒤로가기
- Bottom Sheet back handling
- navigation
- Toss Sandbox
- WebView routing
- deep link / intoss
- build/bundle
- TDS 사용 여부
- Toss 공식 아이콘 사용 방법
- 저장소 관련 권장 방식

공식 문서에서 확인되지 않은 Toss SDK API를 추측해서 구현하지 마라.

## 2. UI 스타일 조사

`ui-ux-pro-max-skill`이 있다면 먼저 다음과 유사한 쿼리로 디자인 시스템을 조사해라.

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
"dark mobile oled smoked glass ambient glow pill chip health tracker" \
--design-system \
-f markdown \
-p "지금 카페인"
```

그리고 필요하면 다음도 조사한다.

```text
dark mode
glassmorphism
mobile
bottom sheet
badge
chip
accessibility
```

결과를 실제 CSS/token/component 설계에 반영해라.

## 3. 디자인

디자인 컨셉:

**Near Black / OLED + Smoked Glass + Minimal Ambient Glow + Selected-only Pink Neon**

전체 화면은 거의 검정이어야 한다.

Surface는 charcoal 계열로 만든다.

핑크 네온은 선택 상태에만 사용한다.

카페인 시각화만 blue/cyan/violet를 사용한다.

전형적인 밝은 AI gradient UI를 만들지 마라.

emoji를 아이콘으로 사용하지 마라.

## 4. 먼저 디자인 토큰 구현

다음 파일을 중심으로 token을 만든다.

```text
src/styles/tokens.css
src/styles/globals.css
```

색상, radius, spacing, typography, border, glow를 모두 token화한다.

## 5. Domain 구현

먼저 카페인 domain model을 구현한다.

```text
src/features/caffeine/model/
```

필수:

- `caffeine.types.ts`
- `caffeine.ts`

카페인 감소 계산은 exponential half-life 모델로 구현한다.

복수 섭취 기록을 합산한다.

계산 코드는 React 컴포넌트와 분리한다.

단위 테스트를 작성할 수 있으면 작성한다.

## 6. 기본 음료 데이터

아래 카테고리를 seed data로 구현한다.

```text
커피
차
에너지·기능성
탄산·기타
```

기본 generic 음료를 포함한다.

카페인 수치는 sample/default 데이터라는 것을 코드 구조에서 구분 가능하게 한다.

브랜드 공식 수치라고 표시하지 마라.

## 7. HomePage 구현

홈에 다음을 구현한다.

### Header

- 오늘 날짜
- 최소한의 action

### Hero

- `지금 내 카페인`
- 현재 추정 잔존 카페인 mg
- 추정치 안내

### CaffeineBodyVisual

가장 중요한 컴포넌트다.

사람 모양의 반투명 SVG 안에서 카페인 액체가 차오르는 형태로 구현한다.

카페인량에 따라 다음이 달라져야 한다.

- 액체 높이
- particle 양
- ambient glow
- visual state

`LOW / LIGHT / FILLED / HIGH_VISUAL` 상태를 구현한다.

`HIGH_VISUAL`에서만 아주 얇은 pink halo를 허용한다.

### Summary

- 오늘 섭취
- 마지막 섭취
- 밤 특정 시간 예상 잔존량

### CTA

`카페인 추가`

## 8. AddCaffeineSheet

카페인 추가는 Home 위 Bottom Sheet 하나로 구현한다.

별도 페이지를 만들지 않는다.

카테고리는 tab이 아니다.

아래처럼 세로 section이다.

```text
커피
Badge Badge Badge
Badge +

차
Badge Badge Badge
+

에너지·기능성
Badge Badge +

탄산·기타
Badge Badge +
```

각 카테고리는 `DrinkCategorySection`으로 만든다.

## 9. DrinkBadge

`DrinkBadge`는 compact해야 한다.

표시:

- icon
- menu name
- caffeine mg

선택 시에만 pink border + subtle pink glow를 사용한다.

큰 카드처럼 만들지 않는다.

`flex-wrap`을 사용한다.

## 10. 음료 선택

Badge 클릭 시 새 화면으로 이동하지 않는다.

Bottom Sheet 아래쪽에 `QuickAdjustBar`를 연다.

```text
아메리카노

[-] 150mg [+]

[지금 기록]
```

5mg 단위로 조정한다.

기록 버튼을 누르면 바로 저장하고 Home을 갱신한다.

## 11. 커스텀 음료 추가

각 카테고리 마지막 `+` Badge를 누르면 같은 Bottom Sheet 안에서 inline composer를 연다.

다음 항목을 한 화면에서 처리한다.

- icon
- menu name
- caffeine mg
- save

별도 icon picker page를 만들지 않는다.

저장 후 즉시 해당 카테고리에 Badge가 생성되어야 한다.

## 12. Persistence

먼저 Toss MCP에서 권장 방식을 확인한다.

별도 Apps in Toss storage가 필요하지 않다면 localStorage repository로 구현한다.

컴포넌트에서 localStorage 직접 호출 금지.

Repository interface를 만들어라.

## 13. HistoryPage

날짜별 카페인 기록을 구현한다.

각 기록:

- 시간
- 음료명
- mg
- 수정
- 삭제

을 지원한다.

## 14. SettingsPage

다음만 구현한다.

- half-life 설정
- 계산 모델 설명
- 데이터 초기화
- 앱 정보

## 15. Bottom Navigation

MVP navigation은 다음만 둔다.

```text
홈
기록
설정
```

`내 음료` 메뉴를 별도 생성하지 않는다.

## 16. Apps in Toss 대응

Toss MCP 조사 결과에 따라 다음을 적용한다.

- Safe Area
- back
- navigation
- WebView route
- Sandbox
- bundle/build

Apps in Toss 공식 가이드와 일반 웹 가이드가 충돌하면 Apps in Toss를 우선한다.

## 17. 상호작용

다음 micro interaction만 적절하게 구현한다.

- Badge press
- selected state
- Bottom Sheet open/close
- Quick Adjust
- Body liquid level transition

과한 animation을 넣지 않는다.

`prefers-reduced-motion`을 지원한다.

## 18. 구현 완료 후 직접 검증

반드시 아래를 수행한다.

```bash
npm install
npm run lint
npm run build
```

테스트 script가 있으면 테스트도 실행한다.

가능하면 375px / 390px viewport에서 직접 확인한다.

다음 시나리오를 검증한다.

1. Home 로드
2. 카페인 추가
3. 아메리카노 선택
4. 150mg → 155mg 조정
5. 지금 기록
6. Home 잔존량 증가
7. `CaffeineBodyVisual` 액체 높이 증가
8. Bottom Sheet 재오픈
9. 커피 카테고리 `+` 선택
10. 아이콘 선택
11. 메뉴명 입력
12. 카페인량 입력
13. 저장
14. 새 Badge 생성
15. 새 Badge 선택 후 기록
16. 새로고침
17. 데이터 유지 확인
18. 기록 페이지 확인

문제를 발견하면 가능한 범위에서 직접 수정한 뒤 다시 검증한다.

## 19. 작업 방식

계획서만 작성하고 멈추지 마라.

실제 소스 파일을 생성/수정한다.

중간 단계마다 나에게 승인을 요청하지 않는다.

합리적인 UI/구조 결정은 직접 수행한다.

단 다음 경우에만 작업 전 알려라.

- 기존 기능을 대량 삭제해야 할 때
- 기존 아키텍처를 완전히 바꿔야 할 때
- Apps in Toss 공식 문서와 현재 프로젝트 구조가 명백하게 충돌할 때

## 20. 최종 답변

완료되면 아래만 간결하게 보고한다.

1. 구현 화면
2. 주요 컴포넌트
3. Apps in Toss MCP에서 확인하고 적용한 사항
4. dependency 추가/변경
5. 테스트 결과
6. lint 결과
7. build 결과
8. 아직 sample/mock 데이터인 부분
9. 다음 단계에 필요한 서버/API
