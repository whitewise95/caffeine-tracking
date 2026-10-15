import type { AvatarConcept, AvatarItem } from '../../model/avatar.types'

export type ShoeShape = 'slipper' | 'clog' | 'flat' | 'sneaker' | 'runner' | 'high' | 'boot' | 'tall' | 'loafer' | 'sandal' | 'pointed'
export type ShoeFabric = 'cream' | 'navy' | 'grey' | 'sage' | 'lavender' | 'sand' | 'denim' | 'charcoal' | 'blush' | 'mint'
type ShoeDesign = { id: string; name: string; concept: AvatarConcept; shape: ShoeShape; fabric: ShoeFabric }

export const SHOE_DESIGNS = [
  { id: 'shoes-bear-slipper', name: '곰돌이 룸 슈즈', concept: 'cozy', shape: 'slipper', fabric: 'sand' },
  { id: 'shoes-bunny-mule', name: '토끼 뮬', concept: 'cozy', shape: 'slipper', fabric: 'cream' },
  { id: 'shoes-quilt-camp', name: '퀼팅 캠핑 슈즈', concept: 'cozy', shape: 'clog', fabric: 'sage' },
  { id: 'shoes-cable-bootie', name: '니트 부티', concept: 'cozy', shape: 'boot', fabric: 'cream' },
  { id: 'shoes-cloud-clog', name: '구름 클로그', concept: 'cozy', shape: 'clog', fabric: 'mint' },
  { id: 'shoes-felt-moccasin', name: '펠트 모카신', concept: 'cozy', shape: 'loafer', fabric: 'sand' },
  { id: 'shoes-patchwork-home', name: '패치워크 실내화', concept: 'cozy', shape: 'slipper', fabric: 'lavender' },
  { id: 'shoes-toast-socks', name: '토스트 삭스 슈즈', concept: 'cozy', shape: 'high', fabric: 'cream' },
  { id: 'shoes-ballet-ribbon', name: '발레 리본 슈즈', concept: 'romantic', shape: 'flat', fabric: 'blush' },
  { id: 'shoes-pearl-strap', name: '진주 스트랩 슈즈', concept: 'romantic', shape: 'flat', fabric: 'navy' },
  { id: 'shoes-daisy-canvas', name: '데이지 캔버스화', concept: 'romantic', shape: 'sneaker', fabric: 'cream' },
  { id: 'shoes-lace-boot', name: '레이스 리본 부츠', concept: 'romantic', shape: 'boot', fabric: 'sand' },
  { id: 'shoes-petal-sandal', name: '꽃잎 샌들', concept: 'romantic', shape: 'sandal', fabric: 'lavender' },
  { id: 'shoes-heart-penny', name: '하트 페니 슈즈', concept: 'romantic', shape: 'loafer', fabric: 'blush' },
  { id: 'shoes-scallop-flat', name: '물결 플랫 슈즈', concept: 'romantic', shape: 'flat', fabric: 'sage' },
  { id: 'shoes-rose-mary', name: '장미 더블 메리제인', concept: 'romantic', shape: 'flat', fabric: 'charcoal' },
  { id: 'shoes-skate-gum', name: '검솔 스케이트화', concept: 'street', shape: 'sneaker', fabric: 'charcoal' },
  { id: 'shoes-trail-toggle', name: '토글 트레일 러너', concept: 'street', shape: 'runner', fabric: 'sage' },
  { id: 'shoes-court-strap', name: '벨크로 코트화', concept: 'street', shape: 'sneaker', fabric: 'cream' },
  { id: 'shoes-tech-sock', name: '테크 삭스 스니커', concept: 'street', shape: 'high', fabric: 'grey' },
  { id: 'shoes-basket-high', name: '패널 농구 하이탑', concept: 'street', shape: 'high', fabric: 'denim' },
  { id: 'shoes-lug-combat', name: '러그솔 워커', concept: 'street', shape: 'boot', fabric: 'charcoal' },
  { id: 'shoes-webbing-sport', name: '웨빙 스포츠 샌들', concept: 'street', shape: 'sandal', fabric: 'navy' },
  { id: 'shoes-retro-track', name: '레트로 트랙 슈즈', concept: 'street', shape: 'runner', fabric: 'mint' },
  { id: 'shoes-oxford-wing', name: '윙팁 옥스퍼드', concept: 'classic', shape: 'loafer', fabric: 'sand' },
  { id: 'shoes-tassel', name: '태슬 로퍼', concept: 'classic', shape: 'loafer', fabric: 'charcoal' },
  { id: 'shoes-sailor-deck', name: '세일러 데크 슈즈', concept: 'classic', shape: 'sneaker', fabric: 'navy' },
  { id: 'shoes-academy-buckle', name: '아카데미 버클 슈즈', concept: 'classic', shape: 'flat', fabric: 'charcoal' },
  { id: 'shoes-chelsea', name: '첼시 부츠', concept: 'classic', shape: 'boot', fabric: 'sand' },
  { id: 'shoes-spectator', name: '투톤 스펙테이터', concept: 'classic', shape: 'loafer', fabric: 'cream' },
  { id: 'shoes-penny-kilt', name: '킬티 로퍼', concept: 'classic', shape: 'loafer', fabric: 'navy' },
  { id: 'shoes-riding', name: '승마 롱부츠', concept: 'classic', shape: 'tall', fabric: 'charcoal' },
  { id: 'shoes-fern-fairy', name: '새잎 요정 신발', concept: 'fantasy', shape: 'pointed', fabric: 'sage' },
  { id: 'shoes-moon-wizard', name: '초승달 마법사 부츠', concept: 'fantasy', shape: 'pointed', fabric: 'navy' },
  { id: 'shoes-ranger-lace', name: '숲 탐험가 부츠', concept: 'fantasy', shape: 'boot', fabric: 'sand' },
  { id: 'shoes-star-button', name: '별 단추 구두', concept: 'fantasy', shape: 'flat', fabric: 'lavender' },
  { id: 'shoes-mushroom-clog', name: '버섯 클로그', concept: 'fantasy', shape: 'clog', fabric: 'blush' },
  { id: 'shoes-knight-sabatons', name: '꼬마 기사 판금화', concept: 'fantasy', shape: 'boot', fabric: 'grey' },
  { id: 'shoes-cloud-aviator', name: '구름 비행사 부츠', concept: 'fantasy', shape: 'tall', fabric: 'denim' },
  { id: 'shoes-treasure-buckle', name: '보물 버클 부츠', concept: 'fantasy', shape: 'boot', fabric: 'charcoal' },
] as const satisfies readonly ShoeDesign[]

export type ShoeDesignId = (typeof SHOE_DESIGNS)[number]['id']
export const SHOE_COLLECTION_ITEMS: readonly AvatarItem[] = SHOE_DESIGNS.map(({ id, name, concept }) => ({ id, name, concept, slot: 'shoes' }))
