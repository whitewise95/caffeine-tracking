import type { AvatarConcept, AvatarItem } from '../../model/avatar.types';

const collection = (concept: AvatarConcept, items: readonly (readonly [string, string])[]): AvatarItem[] =>
  items.map(([id, name]) => ({ id: `accessory-${id}`, name, slot: 'accessory', concept }));

export const ACCESSORY_COLLECTION_ITEMS: readonly AvatarItem[] = [
  ...collection('cozy', [
    ['bunny-bag', '토끼 귀 크로스백'], ['bear-pack', '곰돌이 배낭'],
    ['toast-pouch', '식빵 파우치'], ['berry-pin', '딸기 브로치'],
    ['cloud-muffler', '구름 목도리'], ['shoulder-kitten', '어깨 위 고양이'],
    ['daisy-tote', '데이지 니트백'], ['cookie-medal', '쿠키 메달'],
  ]),
  ...collection('romantic', [
    ['lace-collar', '레이스 케이프 칼라'], ['pearl-garland', '진주 꽃 목걸이'],
    ['rosette-sash', '로제트 새시'], ['ribbon-purse', '리본 미니백'],
    ['heart-locket', '하트 로켓 목걸이'], ['tulip-bouquet', '튤립 꽃다발'],
    ['butterfly-cape', '나비 숄'], ['petal-shawl', '꽃잎 어깨 숄'],
  ]),
  ...collection('street', [
    ['tech-sling', '테크 슬링백'], ['utility-belt', '유틸리티 벨트'],
    ['neck-headphones', '넥 헤드폰'], ['cassette-bag', '카세트 크로스백'],
    ['camera-bag', '미니 카메라'], ['carabiner', '카라비너 키링'],
    ['bandana', '페이즐리 반다나'], ['messenger', '메신저백'],
  ]),
  ...collection('classic', [
    ['silk-ascot', '실크 애스콧'], ['pocket-watch', '회중시계 체인'],
    ['leather-satchel', '가죽 사첼백'], ['book-bag', '작은 도서 가방'],
    ['crest-pin', '문장 배지'], ['suspenders', '버튼 서스펜더'],
    ['sailor-collar', '세일러 칼라'], ['tartan-scarf', '타탄 머플러'],
  ]),
  ...collection('fantasy', [
    ['star-wand', '별빛 지팡이'], ['moon-mantle', '초승달 망토'],
    ['fairy-wings', '이슬 요정 날개'], ['leaf-satchel', '숲잎 가방'],
    ['potion-belt', '물약 벨트'], ['compass', '모험가 나침반'],
    ['tiny-dragon', '어깨 위 작은 용'], ['orbit-pin', '궤도 별 브로치'],
  ]),
];
