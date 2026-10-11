import { useState, type MouseEvent, type ReactNode } from 'react';
import { isTossRuntime, openTossExternalURL } from '../integrations/toss/toss';

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  const [failed, setFailed] = useState(false);

  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (!isTossRuntime()) return;
    event.preventDefault();
    setFailed(false);
    void openTossExternalURL(href).catch(() => setFailed(true));
  }

  return <>
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={open}>{children}</a>
    {failed && <span className="external-link-error" role="alert">외부 브라우저를 열지 못했어요. 링크를 다시 눌러 주세요.</span>}
  </>;
}
