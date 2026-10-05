import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { KNOWLEDGE_FAQ } from '../features/caffeine/data/knowledgeFaq';
import './knowledge.css';

export function KnowledgePage() {
  return <main className="page knowledge-page" id="main-content">
    <header className="page-header">
      <div><h1 className="page-title">지식</h1><p className="page-subtitle">카페인에 대해 궁금했던 것들.</p></div>
    </header>
    <section className="knowledge-list" aria-label="카페인에 관한 자주 묻는 질문">
      {KNOWLEDGE_FAQ.map(faq => <details className="knowledge-faq" key={faq.id}>
        <summary><span>{faq.question}</span><ChevronDown className="knowledge-chevron" size={18} strokeWidth={1.7} aria-hidden="true" /></summary>
        <div className="knowledge-answer">
          {faq.answer.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <div className="knowledge-sources">
            <p className="knowledge-source-label">논문·공식 자료</p>
            {faq.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{source.label}</span><ArrowUpRight size={16} aria-hidden="true" /></a>)}
          </div>
        </div>
      </details>)}
    </section>
  </main>;
}
