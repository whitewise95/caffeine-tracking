import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, type SyntheticEvent } from 'react';
import { KNOWLEDGE_FAQ } from '../features/caffeine/data/knowledgeFaq';
import { ExternalLink } from '../components/ExternalLink';
import { CaffeineModelFormula } from '../features/caffeine/components/CaffeineModelFormula';
import { DEFAULT_CAFFEINE_HALF_LIFE_HOURS } from '../features/caffeine/model/caffeine';
import './knowledge.css';

export function KnowledgePage() {
  const scrollFrame = useRef<number | null>(null);

  useEffect(() => () => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
  }, []);

  function revealAnswer(event: SyntheticEvent<HTMLDetailsElement>) {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    const details = event.currentTarget;
    if (!details.open) return;

    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      if (!details.isConnected || !details.open) return;
      details.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  }

  return <main className="page knowledge-page" id="main-content">
    <header className="page-header">
      <div><h1 className="page-title">지식</h1><p className="page-subtitle">카페인에 대해 궁금했던 것들.</p></div>
    </header>
    <section className="knowledge-list" aria-label="카페인에 관한 자주 묻는 질문">
      {KNOWLEDGE_FAQ.map(faq => <details className="knowledge-faq" key={faq.id} onToggle={revealAnswer}>
        <summary><span>{faq.question}</span><ChevronDown className="knowledge-chevron" size={18} strokeWidth={1.7} aria-hidden="true" /></summary>
        <div className="knowledge-answer">
          {faq.answer.map((paragraph, index) => <p key={paragraph} data-testid={faq.id === 'half-life' && index === faq.answer.length - 1 ? 'half-life-description' : undefined}>{paragraph}</p>)}
          <div className="knowledge-sources">
            <p className="knowledge-source-label">논문·공식 자료</p>
            {faq.sources.map(source => <ExternalLink key={source.url} href={source.url}><span>{source.label}</span><ArrowUpRight size={16} aria-hidden="true" /></ExternalLink>)}
          </div>
        </div>
      </details>)}
    </section>
    <details className="knowledge-model" onToggle={revealAnswer}>
      <summary><span>추정치는 이렇게 계산해요</span><ChevronDown className="knowledge-chevron" size={18} strokeWidth={1.7} aria-hidden="true" /></summary>
      <div className="knowledge-answer">
        <p>음료마다 마신 시각부터 흡수와 감소를 계산해 더해요. 흡수된 양을 기준으로 하므로, 처음에는 추정량이 늘 수 있어요.</p>
        <CaffeineModelFormula halfLifeHours={DEFAULT_CAFFEINE_HALF_LIFE_HOURS} />
        <p className="model-disclaimer">실제 체내 카페인을 측정한 값이 아니에요. 개인차가 있을 수 있어요.</p>
      </div>
    </details>
  </main>;
}
