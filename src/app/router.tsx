import { useCallback, useEffect, useRef, useState } from 'react';

export type Page = 'home' | 'remaining' | 'history' | 'knowledge' | 'settings';
export type AddCaffeineStep = 'select' | 'record' | 'compose' | 'categories' | 'time-start' | 'time-end';
export type Overlay = { type: 'add' | 'reset' | 'edit' | 'delete' | 'categories'; entryId?: string; key: string; step?: AddCaffeineStep; originDepth?: number } | null;
interface Route { page: Page; overlay: Overlay; depth: number }
const paths: Record<Page, string> = { home: '/', remaining: '/remaining', history: '/history', knowledge: '/knowledge', settings: '/settings' };

// Browser history may still contain overlays from an earlier app version.
function supportedOverlay(value: unknown): Overlay {
  if (!value || typeof value !== 'object' || !('type' in value) || !('key' in value)) return null;
  if (!['add', 'reset', 'edit', 'delete', 'categories'].includes(String(value.type)) || typeof value.key !== 'string') return null;
  if ((value.type === 'edit' || value.type === 'delete') && (!('entryId' in value) || typeof value.entryId !== 'string')) return null;
  return value as NonNullable<Overlay>;
}

function pageAtLocation(): Page {
  if (location.pathname.replace(/\/$/, '') === '/remaining') return 'remaining';
  if (location.pathname.replace(/\/$/, '') === '/history') return 'history';
  if (location.pathname.replace(/\/$/, '') === '/knowledge') return 'knowledge';
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
      const next = { page: pageAtLocation(), overlay: supportedOverlay(saved?.overlay), depth: saved?.depth ?? 0 };
      current.current = next;
      setRoute(next);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  function push(next: Route) { window.history.pushState(next, '', `${paths[next.page]}${location.search}`); current.current = next; setRoute(next); }
  function navigate(page: Page) { if (page !== route.page) { push({ page, overlay: null, depth: route.depth + 1 }); window.scrollTo(0, 0); } }
  function openOverlay(overlay: Omit<NonNullable<Overlay>, 'key'>) {
    push({ ...route, overlay: { ...overlay, key: crypto.randomUUID(), originDepth: route.depth, ...(overlay.type === 'add' ? { step: 'select' as const } : {}) }, depth: route.depth + 1 });
  }
  function changeOverlayStep(step: AddCaffeineStep, replace = false) {
    const active = current.current;
    // Ignore callbacks from a screen left while a storage operation was pending.
    if ((active.overlay?.type !== 'add' && active.overlay?.type !== 'edit') || active.overlay.key !== route.overlay?.key || active.depth !== route.depth) return;
    const next = { ...active, overlay: { ...active.overlay, step }, depth: active.depth + (replace ? 0 : 1) };
    if (replace) {
      window.history.replaceState(next, '', location.href);
      current.current = next;
      setRoute(next);
    } else push(next);
  }
  // An async save may finish after back already dismissed this particular sheet.
  function closeOverlay() {
    if (!route.overlay || current.current.overlay?.key !== route.overlay.key || current.current.depth !== route.depth) return;
    current.current = { ...current.current, overlay: null };
    window.history.replaceState(current.current, '', location.href);
    const origin = route.overlay.originDepth ?? route.depth - 1;
    window.history.go(-Math.max(1, route.depth - origin));
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
  return { ...route, navigate, openOverlay, closeOverlay, discardOverlay, changeOverlayStep, back };
}
