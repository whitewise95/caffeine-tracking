import { useCallback, useEffect, useRef, useState } from 'react';

export type Page = 'home' | 'history' | 'settings';
export type Overlay = { type: 'add' | 'reset' | 'edit' | 'delete' | 'check-in' | 'feedback'; entryId?: string; key: string } | null;
interface Route { page: Page; overlay: Overlay; depth: number }
const paths: Record<Page, string> = { home: '/', history: '/history', settings: '/settings' };

function pageAtLocation(): Page {
  if (location.pathname.replace(/\/$/, '') === '/history') return 'history';
  if (location.pathname.replace(/\/$/, '') === '/settings') return 'settings';
  return 'home';
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => {
    const initial = { page: pageAtLocation(), overlay: null, depth: 0 };
    window.history.replaceState(initial, '', location.href);
    return initial;
  });
  const current = useRef(route);
  useEffect(() => {
    const sync = () => {
      const saved = window.history.state as Route | null;
      const next = { page: pageAtLocation(), overlay: saved?.overlay ?? null, depth: saved?.depth ?? 0 };
      current.current = next;
      setRoute(next);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  function push(next: Route) { window.history.pushState(next, '', `${paths[next.page]}${location.search}`); current.current = next; setRoute(next); }
  function navigate(page: Page) { if (page !== route.page) { push({ page, overlay: null, depth: route.depth + 1 }); window.scrollTo(0, 0); } }
  function openOverlay(overlay: Omit<NonNullable<Overlay>, 'key'>) { push({ ...route, overlay: { ...overlay, key: crypto.randomUUID() }, depth: route.depth + 1 }); }
  // An async save may finish after back already dismissed this particular sheet.
  function closeOverlay() {
    if (!route.overlay || current.current.overlay?.key !== route.overlay.key) return;
    current.current = { ...current.current, overlay: null };
    window.history.replaceState(current.current, '', location.href);
    back();
  }
  const discardOverlay = useCallback(() => {
    const next = { ...current.current, overlay: null };
    window.history.replaceState(next, '', location.href);
    current.current = next;
    setRoute(next);
  }, []);
  function back() {
    if (route.depth > 0) window.history.back();
    else {
      const next: Route = { page: 'home', overlay: null, depth: 0 };
      window.history.replaceState(next, '', `/${location.search}`);
      current.current = next;
      setRoute(next);
    }
  }
  return { ...route, navigate, openOverlay, closeOverlay, discardOverlay, back };
}
