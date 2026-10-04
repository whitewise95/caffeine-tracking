# AGENTS.md

## 프로젝트 개요

이 프로젝트는 Apps in Toss(WebView) 안에서 실행되는 카페인 추적 앱이다.

사용자가 카페인 음료를 기록하면 시간 경과에 따라 현재 몸에 남아 있을 것으로 **추정되는 카페인량**을 계산하고 시각화한다.

이 앱은 의료기기나 실제 혈중 카페인 측정 서비스가 아니다. UI와 문구에서 항상 "추정치"임을 명확하게 표현한다.

---

## 기술 스택

- React
- TypeScript
- Vite
- Apps in Toss WebView
- CSS / CSS Modules
- 필요할 경우 React Router
- 필요 최소한의 상태 관리

불필요한 라이브러리를 추가하지 않는다.

---

## Apps in Toss 개발 원칙

Apps in Toss 관련 구현은 기억에 의존하지 않는다.

연결된 Toss MCP 또는 공식 Apps in Toss 문서를 먼저 확인한 뒤 구현한다.

특히 아래 항목은 반드시 최신 문서를 확인한다.

- WebView SDK
- 프로젝트 초기화 방식
- Safe Area
- Navigation
- Android/iOS 뒤로가기
- Bottom Sheet와 back handling
- Toss Sandbox
- 번들 빌드
- WebView routing
- intoss deep link
- Toss Login
- TDS 및 Toss 아이콘 사용 가능 범위
- 저장소 관련 권장 방식

확인되지 않은 SDK 함수명이나 API를 임의로 생성하지 않는다.

Toss MCP의 문서와 기존 코드가 충돌하면 최신 공식 문서를 우선한다.

---

## UI/UX 핵심 방향

전체 디자인은 아래 조합을 기준으로 한다.

**Near Black / OLED + Smoked Glass + Minimal Ambient Glow + Selected-only Pink Neon**

### 핵심 스타일

```css
--bg: #0A0B0E;
--surface: #12151A;
--surface-elevated: #181C22;
--surface-pressed: #20252D;

--text-primary: #F5F6F8;
--text-secondary: #8A919C;
--text-tertiary: #5F6670;

--border: rgba(255,255,255,0.07);

--accent-pink: #F3A6B8;
--accent-pink-strong: #FFD0DB;

--caffeine-blue: #62BFFF;
--caffeine-cyan: #82EFF7;
--caffeine-violet: #7888FF;

--selected-glow: 0 0 16px rgba(243,166,184,0.25);
```

### 금지

- 화면 전체를 덮는 보라/파랑 AI 그라디언트
- 모든 카드에 glow
- 모든 요소에 backdrop-filter
- 과한 glassmorphism
- 과한 blur
- 과한 floating card
- emoji를 UI 아이콘으로 사용
- 밝은 블루 웰니스 앱처럼 보이는 스타일
- 오래된 neumorphism 느낌

Glass는 흰 유리가 아니라 **smoked glass**로 표현한다.

---

## 디자인 시스템 스킬

프로젝트에 다음 스킬이 존재하면 적극적으로 사용한다.

```text
.agents/skills/ui-ux-pro-max/
```

UI 작업 전에 가능하면 디자인 시스템을 조회한다.

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py \
"dark mobile oled smoked glass ambient glow pill chip health tracker" \
--design-system \
-f markdown \
-p "Caffeine Tracker"
```

필요하면 아래 도메인도 검색한다.

- glassmorphism
- dark mode
- mobile
- bottom sheet
- chip
- badge
- accessibility
- micro interaction

검색 결과를 출력만 하지 말고 실제 UI 구현에 반영한다.

---

## 제품 핵심 UX

사용자가 앱을 실행하면 홈에서 즉시 아래를 확인할 수 있어야 한다.

1. 현재 추정 잔존 카페인
2. 사람 몸 형태의 카페인 시각화
3. 오늘 섭취량
4. 마지막 섭취 시간
5. 미래 시점 예상 잔존량
6. 카페인 추가 버튼

사용자가 카페인을 기록하기까지 화면 전환을 최소화한다.

---

## 카페인 계산 모델

도메인 로직은 UI와 분리한다.

권장 위치:

```text
src/features/caffeine/model/
```

기본 감소식:

```ts
remainingMg = doseMg * Math.pow(0.5, elapsedHours / halfLifeHours)
```

여러 섭취 기록이 있다면 모든 `remainingMg`를 합산한다.

half-life는 도메인 상수로 관리한다.

```ts
DEFAULT_CAFFEINE_HALF_LIFE_HOURS
```

UI 문구에서는 다음처럼 표현한다.

- 현재 추정 잔존 카페인
- 추정치
- 개인차가 있을 수 있어요

다음과 같이 표현하지 않는다.

- 실제 혈중 카페인
- 정확한 카페인 농도
- 안전
- 위험
- 건강
- 정상

---

## Caffeine Body Visual

핵심 컴포넌트:

```text
CaffeineBodyVisual
```

예:

```tsx
<CaffeineBodyVisual caffeineMg={126} />
```

외부 이미지보다 SVG 기반 구현을 우선한다.

사람 실루엣은:

- 단순하고 둥근 형태
- 반투명 smoked glass
- 내부 액체만 blue/cyan
- 약한 particle
- 약한 ambient glow

카페인량이 달라지면 액체 높이와 시각 효과가 변해야 한다.

### UI 시각 상태

```ts
type CaffeineVisualLevel =
  | 'LOW'
  | 'LIGHT'
  | 'FILLED'
  | 'HIGH_VISUAL'
```

예시:

- 0~40mg → LOW
- 41~100mg → LIGHT
- 101~200mg → FILLED
- 201mg+ → HIGH_VISUAL

이 구간은 의료 위험도를 뜻하지 않는다.

`HIGH_VISUAL` 상태에서만 아주 얇은 pink halo 같은 추가 효과를 사용할 수 있다.

---

## 카페인 추가 UX

카페인 추가는 별도 페이지로 이동하지 않는다.

홈 위에서 Bottom Sheet를 연다.

다음처럼 여러 화면으로 나누지 않는다.

```text
음료 선택
→ 음료 등록
→ 아이콘 선택
→ 카페인 조절
→ 확인
```

가능한 한 **Bottom Sheet 하나에서 끝낸다.**

---

## 음료 카테고리

카테고리는 탭으로 만들지 않는다.

세로 섹션 형태로 순서대로 노출한다.

```text
커피
[아메리카노] [콜드브루] [카페라떼]
[에스프레소] [+]

차
[녹차] [얼그레이] [말차라떼]
[+]

에너지·기능성
[에너지드링크] [카페인 샷] [+]

탄산·기타
[콜라] [콤부차] [+]
```

권장 컴포넌트:

```text
DrinkCategorySection
DrinkBadge
```

---

## Drink Badge

음료는 큰 카드가 아니라 compact badge/chip으로 표시한다.

정보 순서:

1. 아이콘
2. 메뉴명
3. 카페인량

선택 전:

- dark surface
- weak border
- no glow

선택 후:

- pink border
- subtle pink glow
- selected state indicator

선택 상태를 색상만으로 표현하지 않는다.

badge 목록은 `flex-wrap`을 사용한다.

---

## 기본 음료 데이터

앱에는 generic 기본 음료가 존재한다.

### 커피

- 아메리카노
- 콜드브루
- 카페라떼
- 에스프레소
- 더치커피

### 차

- 녹차
- 얼그레이
- 말차라떼
- 우롱차

### 에너지·기능성

- 에너지드링크
- 카페인 샷

### 탄산·기타

- 콜라
- 콤부차

카페인 수치는 브랜드/용량에 따라 달라질 수 있으므로 sample/default 데이터와 공식 데이터를 구분할 수 있는 구조로 만든다.

권장 타입:

```ts
type Drink = {
  id: string
  categoryId: string
  name: string
  caffeineMg: number
  icon: DrinkIconType
  servingMl?: number
  sourceType?: 'sample' | 'official' | 'custom'
  isCustom: boolean
}
```

---

## 기존 음료 선택

`DrinkBadge`를 누르면 새 화면을 열지 않는다.

Bottom Sheet 하단에 Quick Adjust 영역을 보여준다.

```text
아메리카노

[-] 150mg [+]

[지금 기록]
```

카페인량은 5mg 단위로 조절한다.

기본 섭취 시각은 현재 시각이다.

---

## 커스텀 음료 추가

모든 카테고리 마지막에는 `+` Badge가 있다.

클릭하면 동일 Bottom Sheet 안에서 inline composer를 연다.

한 화면에서 다음을 모두 입력한다.

- 아이콘
- 메뉴명
- 카페인량

별도 아이콘 선택 페이지를 만들지 않는다.

---

## 아이콘 정책

emoji를 제품 UI 아이콘으로 사용하지 않는다.

우선순위:

1. Toss / TDS 공식 아이콘
2. Lucide
3. 직접 작성한 SVG

아이콘 스타일:

- rounded
- monochrome
- 1.5~2px stroke
- selected 상태에서만 pink tint

`CaffeineBodyVisual`만 별도 custom SVG를 사용한다.

---

## Bottom Navigation

MVP에서는 다음만 사용한다.

```text
홈
기록
설정
```

`내 음료` 별도 메뉴는 두지 않는다.

커스텀 음료는 카페인 추가 Bottom Sheet의 각 카테고리 안에 같이 노출한다.

---

## 기록 화면

날짜별 카페인 섭취 이력을 보여준다.

각 기록에는 다음을 제공한다.

- 시간
- 음료명
- mg
- 수정
- 삭제

---

## 설정 화면

MVP에서는 최소 기능만 구현한다.

- 카페인 감소 모델 설명
- half-life 설정
- 데이터 초기화
- 앱 정보

---

## 저장소 구조

현재 코드베이스에 더 나은 구조가 없다면 아래를 참고한다.

```text
src/
  app/
    App.tsx
    router.tsx

  pages/
    HomePage.tsx
    HistoryPage.tsx
    SettingsPage.tsx

  features/
    caffeine/
      components/
        CaffeineBodyVisual.tsx
        CaffeineHero.tsx
        CaffeineSummary.tsx
        AddCaffeineSheet.tsx
        DrinkCategorySection.tsx
        DrinkBadge.tsx
        QuickAdjustBar.tsx
        CustomDrinkComposer.tsx

      model/
        caffeine.ts
        caffeine.types.ts

      hooks/
        useCaffeine.ts

      repository/
        CaffeineRepository.ts
        LocalCaffeineRepository.ts

      data/
        defaultDrinks.ts

  integrations/
    toss/
      toss.ts

  components/
    icons/

  styles/
    tokens.css
    globals.css
```

---

## Persistence

컴포넌트가 직접 `localStorage`에 접근하지 않는다.

Repository 경계를 둔다.

```text
CaffeineRepository
LocalCaffeineRepository
```

Apps in Toss에서 별도의 권장 storage 방법이 있다면 Toss MCP를 확인한 뒤 우선 적용한다.

---

## 로그인

로그인이 앱 핵심 기능에 필요하지 않다면 MVP 첫 진입에서 강제하지 않는다.

Toss Login을 구현하는 경우 반드시 최신 Apps in Toss MCP 문서를 확인한다.

민감 토큰 처리나 토큰 교환을 클라이언트에 구현하지 않는다.

---

## 성능

WebView 성능을 우선한다.

### backdrop-filter 허용 위치

- Bottom Sheet
- Bottom Navigation
- 필요할 경우 Hero

### 금지

- 모든 Badge blur
- 중첩된 backdrop-filter
- 전체 화면 blur
- 과도한 box-shadow

Badge는 대부분 dark translucent solid background로 구현한다.

---

## 접근성

반드시 다음을 지킨다.

- 터치 타겟 최소 44~48px
- 충분한 텍스트 대비
- icon-only button `aria-label`
- `focus-visible`
- 선택 상태를 색상에만 의존하지 않기
- `prefers-reduced-motion`
- 텍스트 확대 시 레이아웃 유지
- badge `flex-wrap`
- horizontal overflow 방지

---

## 구현 품질

기능을 하나의 거대한 `App.tsx`에 몰아넣지 않는다.

UI, domain model, persistence, Toss integration을 분리한다.

TypeScript에서 `any` 사용을 피한다.

중복 상수는 token 또는 domain constant로 분리한다.

컴포넌트는 책임이 커지기 전에 분리한다.

---

## 검증

작업 후 반드시 가능한 범위에서 실행한다.

```bash
npm install
npm run lint
npm run build
```

테스트가 있으면 테스트도 실행한다.

모바일 뷰포트 최소:

- 375px
- 390px

다음 사용자 플로우를 검증한다.

1. 홈 진입
2. 카페인 추가 Bottom Sheet
3. 기본 음료 선택
4. 카페인량 미세 조절
5. 지금 기록
6. 홈 수치 변경
7. `CaffeineBodyVisual` 변경
8. 커스텀 음료 추가
9. Badge 생성
10. 새로고침 후 데이터 유지
11. 기록 확인

오류가 있으면 보고만 하지 말고 가능한 범위에서 직접 수정한다.
