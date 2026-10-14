# Jelly wardrobe implementation plan

**Goal:** 기존 젤리 캐릭터에 6개 부위, 60개 아이템의 선택·미리보기·적용·복원을 구현한다.

**Architecture:** `features/avatar`에 아이템 정보, 착용 상태, 정적 SVG 그래픽, 저장소를 분리한다. 기존 `CaffeineBodyVisual`의 공통 몸 변환 안에서 앞뒤 레이어를 합성하고, 기존 라우터에 `/wardrobe`를 추가한다. 카페인 저장소와 같은 플랫폼 어댑터의 독립 키에 착용 ID만 저장한다.

**Tech stack:** 기존 React, TypeScript, SVG, CSS, Vitest, Playwright. 새 의존성 없음.

**Spec:** [사용자가 제공한 기능 명세](../specs/2026-10-14-jelly-wardrobe.md)

## Constraints

- 기존 미커밋 작업 보존, `codex/jelly-wardrobe-isolated`에서 진행.
- 기존 캐릭터·컵·액체·발광·카페인 계산을 유지. 추가 센서 권한 요청 없음.
- 저장 전 draft와 적용된 outfit 분리. 저장 실패 시 머무르고 재시도, 이탈 후 완료는 화면 이동 금지.
- 잘못된 착용 정보는 부위별 해제. 카페인 데이터는 변경하지 않음.
- 375/390px, 작은 높이, 글자 확대, 키보드·reduced motion 검증.
- 미출시 기능을 릴리즈한 것으로 표시하지 않음. 버전·기존 릴리즈 변경 없음.

## Review focus

- 저장 중 뒤로가기와 재진입: 이전 완료가 새 화면을 닫지 않는다.
- 별도 카페인 변경과 꾸미기 저장: 기록·사진·설정이 덮어써지지 않는다.
- 읽기 실패와 손상 데이터: 실제 저장 오류를 빈 초기값으로 덮어쓰지 않는다.
- 들고 있는 팔, 가방 앞뒤, 모자·신발 외곽: 공통 움직임과 자연스러운 레이어.
- 확대 텍스트/낮은 화면: 미리보기 때문에 목록·적용 버튼 접근이 막히지 않는다.

## Tasks

- [x] Catalog + persistence: `model/avatar.ts`, `data/avatarItems.ts`, `repository/LocalAvatarRepository.ts`, `hooks/useAvatar.ts`; Toss 어댑터 재사용. 먼저 검증/키 격리/실패 테스트를 작성하고 실행한다.
- [x] Head artwork: `graphics/HeadItems.tsx`; 모자·안경·소품 30개. SVG 공유 좌표계, back/body/front 분리.
- [x] Clothing artwork: `graphics/ClothingItems.tsx`; 상의·하의·신발 30개. 평상시/컵 자세 소매 처리.
- [x] Composition + screen: `AvatarOutfitLayers`, `AvatarItemThumbnail`, `WardrobePage`, CSS; 기존 hero와 라우터 연결. E2E에서 선택/취소/적용 실패를 먼저 확인한다.
- [x] Verify: 각 아이템 썸네일과 착용 확인, 대표 조합/자세/상태 스크린샷. lint/build/unit/e2e 회귀. 새 리뷰어로 데이터·라우팅·렌더링 검토.
- [x] Document: README에 현재 구현과 저장 경계를 추가하고 로컬 검증 결과 기록.
