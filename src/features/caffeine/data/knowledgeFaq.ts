import { DEFAULT_CAFFEINE_HALF_LIFE_HOURS } from '../model/caffeine';
import { formatHoursMinutes } from '../format';

interface KnowledgeSource {
  label: string;
  url: string;
}

interface KnowledgeFaq {
  id: string;
  question: string;
  answer: readonly string[];
  sources: readonly KnowledgeSource[];
}

const halfLifeLabel = formatHoursMinutes(DEFAULT_CAFFEINE_HALF_LIFE_HOURS);
const absorptionModelSource: KnowledgeSource = {
  label: 'Seng 등 · 성인 남성의 카페인 흡수·감소 연구 · 2009',
  url: 'https://pubmed.ncbi.nlm.nih.gov/19125908/',
};

// Content is bundled with the app so reading answers never requires a network request.
// Research findings and the app's modelling assumptions are described separately.
export const KNOWLEDGE_FAQ: readonly KnowledgeFaq[] = [
  {
    id: 'half-life',
    question: '반감기가 뭐예요?',
    answer: [
      `몸에 남아 있는 카페인이 절반으로 줄어드는 데 걸리는 시간이에요. 반감기가 ${halfLifeLabel}이라면, 흡수가 끝난 뒤 남아 있던 100mg은 ${halfLifeLabel} 후 약 50mg, 다시 ${halfLifeLabel} 후 약 25mg으로 줄어요. 그동안 더 마시지 않았을 때의 예시예요.`,
      '유럽식품안전청(EFSA)은 성인의 평균 반감기를 약 4시간, 개인차에 따른 범위를 약 2~8시간으로 설명해요.',
      `카페인 트래커에서는 반감기를 ${halfLifeLabel}으로 두고 잔존량을 추정해요. 내 반감기를 측정한 값은 아니에요.`,
    ],
    sources: [{
      label: 'EFSA · 카페인 설명 자료 · 2015 (PDF)',
      url: 'https://www.efsa.europa.eu/sites/default/files/corporate_publications/files/efsaexplainscaffeine150527.pdf',
    }],
  },
  {
    id: 'absorption',
    question: '커피를 마시면 바로 전부 흡수되나요?',
    answer: [
      '흡수에는 시간이 걸려요. 새로 흡수되는 동안에도 이미 몸에 들어온 카페인은 줄어들어요. 그래서 기록 직후에는 추정 잔존량이 먼저 올라갔다가, 시간이 지나면 내려갈 수 있어요.',
      '카페인 트래커는 성인 34명을 분석한 연구의 흡수 속도 값을 계산에 사용해요. 내가 얼마나 빨리 흡수하는지 직접 측정한 값은 아니에요.',
    ],
    sources: [{
      label: 'Terziivanov 등 · 성인의 카페인 흡수·감소 연구 · 2003',
      url: 'https://pubmed.ncbi.nlm.nih.gov/14674790/',
    }],
  },
  {
    id: 'multiple-drinks',
    question: '여러 잔을 마시면 마지막 잔부터 계산하나요?',
    answer: [
      '각 음료를 마신 시각부터 따로 계산해 더해요. 오후 1시에 마신 커피와 오후 2시에 마신 차는 한 시간 차이를 두고 흡수·감소가 시작돼요. 새 잔을 기록해도 앞서 마신 카페인의 시간이 다시 시작되지는 않아요.',
      '성인 대상 연구의 흡수·감소 모델을 바탕으로 각 기록의 추정치를 합산해요. 실제 몸에서 일어나는 변화는 사람마다 다를 수 있어요.',
    ],
    sources: [absorptionModelSource],
  },
  {
    id: 'slow-drinking',
    question: '한 잔을 천천히 마시면 계산이 달라지나요?',
    answer: [
      '카페인이 들어오는 시각이 달라져요. ‘천천히 마셨어요’를 선택하면 시작부터 종료 시각까지 같은 속도로 나눠 마셨다고 가정해 계산해요.',
      '몇 모금씩 언제 마셨는지는 알 수 없어서 이렇게 단순화했어요. 논문의 흡수·감소 모델에 앱의 섭취 방식 가정을 더한 것으로, 실제 마시는 속도를 측정한 결과는 아니에요.',
    ],
    sources: [absorptionModelSource],
  },
  {
    id: 'individual-differences',
    question: '사람마다 반감기가 다른가요?',
    answer: [
      '같은 양을 마셔도 줄어드는 속도는 다를 수 있어요. 141편의 자료를 모아 분석한 연구에서는 흡연, 경구피임약, 다른 약물과 질환 등의 영향을 살펴봤어요.',
      `카페인 트래커는 개인별 반감기를 측정하지 않고 모든 기록에 ${halfLifeLabel}이라는 같은 기준을 사용해요. 커피를 마신 뒤 느끼는 각성감도 체내 카페인량과 똑같지는 않아요.`,
    ],
    sources: [{
      label: 'Grzegorzewski 등 · 카페인의 체내 변화에 관한 종합 분석 · 2022',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35280254/',
    }],
  },
  {
    id: 'sleep',
    question: '저녁에 마신 카페인이 잠에도 영향을 주나요?',
    answer: [
      '영향을 줄 수 있어요. 2013년 연구에서는 카페인 400mg을 잠들기 직전, 3시간 전, 6시간 전에 먹었을 때 모두 수면에 영향을 관찰했어요.',
      '이 연구는 400mg이라는 특정 양을 사용했어요. 누구에게나 어떤 음료든 똑같이 6시간 동안 영향을 준다는 뜻은 아니에요. 예상 잔존량만으로 잠들 수 있는 시각을 판단할 수도 없어요.',
    ],
    sources: [{
      label: 'Drake 등 · 카페인 섭취 시각과 수면 실험 · 2013',
      url: 'https://pubmed.ncbi.nlm.nih.gov/24235903/',
    }],
  },
  {
    id: 'decaf',
    question: '디카페인에도 카페인이 있나요?',
    answer: [
      '있을 수 있어요. 2006년 연구에서 여러 매장의 디카페인 커피 10종을 분석했더니, 약 473ml 한 잔에 0~13.9mg이 들어 있었어요.',
      '당시 조사한 제품들의 결과라 지금 판매되는 모든 커피에 그대로 적용할 수는 없어요. 제품이나 매장에서 안내하는 카페인량이 있다면 그 값으로 기록해 주세요.',
    ],
    sources: [{
      label: 'McCusker 등 · 디카페인 커피의 카페인 함량 분석 · 2006',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17132260/',
    }],
  },
  {
    id: 'drink-content',
    question: '같은 커피인데 카페인량이 왜 달라요?',
    answer: [
      '원두, 만드는 방법, 한 잔의 용량에 따라 달라질 수 있어요. 메뉴 이름이 같다고 카페인량까지 같은 것은 아니에요.',
      '카페인 트래커의 기본 음료 수치는 기록을 시작하기 위한 예시값이에요. 제품이나 매장에서 안내하는 값이 있다면 ‘내 음료 추가’에서 직접 입력해 주세요. 67mg처럼 1mg 단위로도 저장할 수 있어요.',
    ],
    sources: [{
      label: 'EFSA · 음료별 카페인 함량 설명',
      url: 'https://www.efsa.europa.eu/en/topics/topic/caffeine',
    }],
  },
];
