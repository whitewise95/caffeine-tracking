import type { AvatarConcept, AvatarItem } from '../../model/avatar.types'

export type BottomShape = 'shorts' | 'bloomers' | 'tapered' | 'culottes' | 'skirt' | 'wrap' | 'tiered' | 'bubble' | 'scalloped' | 'knicker'
export type BottomFabric = 'cream' | 'navy' | 'grey' | 'sage' | 'lavender' | 'sand' | 'denim' | 'charcoal' | 'blush' | 'mint'
type BottomDesign = { id: string; name: string; concept: AvatarConcept; shape: BottomShape; fabric: BottomFabric }

/** Individual cuts and construction details, grouped into eight designs per mood. */
export const BOTTOM_DESIGNS = [
  { id: 'bottom-bear-pocket', name: '곰 포켓 반바지', concept: 'cozy', shape: 'shorts', fabric: 'sand' },
  { id: 'bottom-bunny-bloomer', name: '토끼 블루머', concept: 'cozy', shape: 'bloomers', fabric: 'cream' },
  { id: 'bottom-quilt-patch', name: '누빔 패치 쇼츠', concept: 'cozy', shape: 'shorts', fabric: 'sage' },
  { id: 'bottom-cable-knit', name: '꽈배기 니트 팬츠', concept: 'cozy', shape: 'tapered', fabric: 'cream' },
  { id: 'bottom-cloud-culottes', name: '구름 퀼로트', concept: 'cozy', shape: 'culottes', fabric: 'mint' },
  { id: 'bottom-baker-apron', name: '베이커 앞치마 팬츠', concept: 'cozy', shape: 'tapered', fabric: 'denim' },
  { id: 'bottom-fleece-jog', name: '보아 플리스 조거', concept: 'cozy', shape: 'tapered', fabric: 'sand' },
  { id: 'bottom-picnic-gingham', name: '피크닉 깅엄 치마바지', concept: 'cozy', shape: 'culottes', fabric: 'lavender' },
  { id: 'bottom-petal-wrap', name: '꽃잎 랩 스커트', concept: 'romantic', shape: 'wrap', fabric: 'blush' },
  { id: 'bottom-lace-bloomer', name: '레이스 블루머', concept: 'romantic', shape: 'bloomers', fabric: 'cream' },
  { id: 'bottom-ribbon-pleat', name: '리본 주름 스커트', concept: 'romantic', shape: 'skirt', fabric: 'navy' },
  { id: 'bottom-rose-tier', name: '장미 티어드 스커트', concept: 'romantic', shape: 'tiered', fabric: 'lavender' },
  { id: 'bottom-pearl-tweed', name: '진주 트위드 스커트', concept: 'romantic', shape: 'skirt', fabric: 'sand' },
  { id: 'bottom-daisy-shorts', name: '데이지 자수 쇼츠', concept: 'romantic', shape: 'shorts', fabric: 'denim' },
  { id: 'bottom-swan-bubble', name: '백조 버블 스커트', concept: 'romantic', shape: 'bubble', fabric: 'cream' },
  { id: 'bottom-scallop-linen', name: '스캘럽 리넨 팬츠', concept: 'romantic', shape: 'culottes', fabric: 'sage' },
  { id: 'bottom-parachute', name: '파라슈트 팬츠', concept: 'street', shape: 'tapered', fabric: 'charcoal' },
  { id: 'bottom-skater-panel', name: '스케이터 패널 쇼츠', concept: 'street', shape: 'shorts', fabric: 'denim' },
  { id: 'bottom-basket-mesh', name: '메시 농구 쇼츠', concept: 'street', shape: 'shorts', fabric: 'navy' },
  { id: 'bottom-tech-zip', name: '테크 지퍼 팬츠', concept: 'street', shape: 'tapered', fabric: 'grey' },
  { id: 'bottom-carpenter', name: '카펜터 워크 팬츠', concept: 'street', shape: 'culottes', fabric: 'sand' },
  { id: 'bottom-wrap-utility', name: '유틸리티 랩 치마바지', concept: 'street', shape: 'wrap', fabric: 'sage' },
  { id: 'bottom-moto-knee', name: '라이더 무릎 팬츠', concept: 'street', shape: 'tapered', fabric: 'charcoal' },
  { id: 'bottom-retro-race', name: '레트로 레이싱 쇼츠', concept: 'street', shape: 'shorts', fabric: 'mint' },
  { id: 'bottom-sailor-buttons', name: '세일러 단추 쇼츠', concept: 'classic', shape: 'shorts', fabric: 'navy' },
  { id: 'bottom-academy-tartan', name: '아카데미 타탄 스커트', concept: 'classic', shape: 'skirt', fabric: 'sage' },
  { id: 'bottom-oxford-pleat', name: '옥스퍼드 턱 팬츠', concept: 'classic', shape: 'tapered', fabric: 'grey' },
  { id: 'bottom-heritage-knicker', name: '헤리티지 니커보커', concept: 'classic', shape: 'knicker', fabric: 'sand' },
  { id: 'bottom-pinstripe', name: '핀스트라이프 정장 바지', concept: 'classic', shape: 'tapered', fabric: 'navy' },
  { id: 'bottom-bookshop-wrap', name: '서점 체크 랩 스커트', concept: 'classic', shape: 'wrap', fabric: 'cream' },
  { id: 'bottom-nautical-culotte', name: '마린 와이드 퀼로트', concept: 'classic', shape: 'culottes', fabric: 'cream' },
  { id: 'bottom-herringbone', name: '헤링본 수트 쇼츠', concept: 'classic', shape: 'shorts', fabric: 'charcoal' },
  { id: 'bottom-fern-petal', name: '고사리 요정 치마', concept: 'fantasy', shape: 'scalloped', fabric: 'sage' },
  { id: 'bottom-moon-wizard', name: '달빛 마법사 팬츠', concept: 'fantasy', shape: 'knicker', fabric: 'navy' },
  { id: 'bottom-ranger-map', name: '지도 수납 탐험 바지', concept: 'fantasy', shape: 'tapered', fabric: 'sand' },
  { id: 'bottom-stardust-tulle', name: '별가루 튤 스커트', concept: 'fantasy', shape: 'tiered', fabric: 'lavender' },
  { id: 'bottom-mushroom-bloom', name: '버섯 마을 블루머', concept: 'fantasy', shape: 'bloomers', fabric: 'blush' },
  { id: 'bottom-knight-tabard', name: '꼬마 기사 타바드', concept: 'fantasy', shape: 'wrap', fabric: 'grey' },
  { id: 'bottom-cloud-pilot', name: '구름 비행사 바지', concept: 'fantasy', shape: 'knicker', fabric: 'denim' },
  { id: 'bottom-treasure-sash', name: '보물 사냥꾼 새시 팬츠', concept: 'fantasy', shape: 'culottes', fabric: 'charcoal' },
] as const satisfies readonly BottomDesign[]

export type BottomDesignId = (typeof BOTTOM_DESIGNS)[number]['id']
export const BOTTOM_COLLECTION_ITEMS: readonly AvatarItem[] = BOTTOM_DESIGNS.map(({ id, name, concept }) => ({ id, name, concept, slot: 'bottom' }))
