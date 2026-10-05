import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Home, List, BookOpen, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { HomePage } from '../pages/HomePage';
import { RemainingCaffeinePage } from '../pages/RemainingCaffeinePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { KnowledgePage } from '../pages/KnowledgePage';
import { BottomSheet } from '../components/BottomSheet';
import { AddCaffeineSheet } from '../features/caffeine/components/AddCaffeineSheet';
import { CategoryManager } from '../features/caffeine/components/CategoryManager';
import { EditEntryForm } from '../features/caffeine/components/EditEntryForm';
import { useCaffeine } from '../features/caffeine/hooks/useCaffeine';
import { createRepository, initializeTossSafeArea, isTossRuntime, setOverlaySwipeBack, subscribeTossBack } from '../integrations/toss/toss';
import { useRouter, type Page } from './router';
import { resolveAppTheme } from './theme';

const navigation = [{ page: 'home', label: '홈', icon: Home }, { page: 'history', label: '기록', icon: List }, { page: 'knowledge', label: '지식', icon: BookOpen }, { page: 'settings', label: '설정', icon: SlidersHorizontal }] as const;

export function App() {
  const tossRuntime = useMemo(() => isTossRuntime(), []);
  const repository = useMemo(() => createRepository(), []);
  const caffeine = useCaffeine(repository);
  const theme = resolveAppTheme(caffeine.state.settings.theme, tossRuntime, new URLSearchParams(location.search).get('theme'));
  const router = useRouter();
  const [toast, setToast] = useState('');
  const { page, overlay, depth } = router;
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current === 'remaining' && page === 'home') {
      document.getElementById('remaining-details-button')?.focus({ preventScroll: true });
    }
    previousPage.current = page;
  }, [page]);
  const hasOverlay = Boolean(overlay);
  const selectedEntry = caffeine.state.entries.find(entry => entry.id === overlay?.entryId);
  const invalidOverlay = caffeine.loaded && (overlay?.type === 'edit' || overlay?.type === 'delete') && !selectedEntry;
  const { discardOverlay } = router;
  useEffect(() => { if (invalidOverlay) discardOverlay(); }, [invalidOverlay, discardOverlay]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F7F8FA' : '#0A0B0E');
  }, [theme]);
  useEffect(() => initializeTossSafeArea(), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const handleBack = useCallback(() => {
    if (depth > 0) window.history.back();
    else if (page !== 'home') { window.history.replaceState({ page: 'home', overlay: null, depth: 0 }, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }
  }, [depth, page]);
  useEffect(() => {
    if (!overlay && page === 'home') return;
    return subscribeTossBack(handleBack);
  }, [overlay, page, handleBack]);
  useEffect(() => setOverlaySwipeBack(hasOverlay), [hasOverlay]);
  useEffect(() => {
    document.title = page === 'home' ? '지금 카페인' : `${page === 'remaining' ? '음료별 잔존 카페인' : page === 'history' ? '카페인 기록' : page === 'knowledge' ? '카페인 지식' : '설정'} · 지금 카페인`;
  }, [page]);

  function navigate(next: Page) { caffeine.clearError(); router.navigate(next); }
  function openAdd() { caffeine.clearError(); router.openOverlay({ type: 'add' }); }
  function closeSheet() { if (!caffeine.busy) { caffeine.clearError(); router.closeOverlay(); } }
  const title = overlay?.type === 'add' ? '어떤 카페인을 마셨나요?' : overlay?.type === 'edit' ? '기록 수정' : overlay?.type === 'delete' ? '이 기록을 삭제할까요?' : '모든 데이터를 초기화할까요?';

  return <div className="app-shell">
    {caffeine.error && !overlay && <div className="error-message" role="alert">{caffeine.error}</div>}
    {caffeine.loading ? <main className="loading-state" role="status">나의 기록을 불러오고 있어요…</main> : !caffeine.loaded ? <main className="page"><div className="empty-state"><AlertCircle size={36} /><h1 className="page-title">기록을 열지 못했어요</h1><p>기존 데이터는 변경하지 않았어요.<br />다시 시도하거나 저장 데이터를 초기화할 수 있어요.</p><button className="button-primary" onClick={() => void caffeine.reload()}>다시 불러오기</button><button className="text-button" onClick={() => router.openOverlay({ type: 'reset' })}>데이터 초기화</button></div></main> : <>
      {page === 'home' && <HomePage state={caffeine.state} halfLifeHours={caffeine.halfLifeHours} now={caffeine.now} onAdd={openAdd} onHistory={() => navigate('history')} onRemaining={() => navigate('remaining')} />}
      {page === 'remaining' && <RemainingCaffeinePage drinks={caffeine.drinks} entries={caffeine.state.entries} halfLifeHours={caffeine.halfLifeHours} now={caffeine.now} onBack={router.back} />}
      {page === 'history' && <HistoryPage drinks={caffeine.drinks} entries={caffeine.state.entries} now={caffeine.now} onAdd={openAdd} onEdit={entry => router.openOverlay({ type: 'edit', entryId: entry.id })} onDelete={entry => router.openOverlay({ type: 'delete', entryId: entry.id })} />}
      {page === 'knowledge' && <KnowledgePage />}
      {page === 'settings' && <SettingsPage themeSettings={tossRuntime ? undefined : { theme, busy: caffeine.busy, onChange: caffeine.setTheme }} onReset={() => router.openOverlay({ type: 'reset' })} onManageCategories={() => { caffeine.clearError(); router.openOverlay({ type: 'categories' }); }} />}
      <nav className="bottom-nav" aria-label="주요 메뉴">{navigation.map(({ page: item, label, icon: Icon }) => {
        const selected = page === item || (page === 'remaining' && item === 'home');
        return <button key={item} className="nav-item" aria-current={selected ? 'page' : undefined} onClick={() => navigate(item)}><Icon size={21} strokeWidth={selected ? 1.9 : 1.5} aria-hidden="true" /><span>{label}</span></button>;
      })}</nav>
    </>}
    {overlay?.type === 'add' && <AddCaffeineSheet key={overlay.key} step={overlay.step ?? 'select'} onStepChange={router.changeOverlayStep} onBack={router.back} onClose={closeSheet} error={caffeine.error} drinks={caffeine.drinks} categories={caffeine.categories} busy={caffeine.busy} onCreateDrink={caffeine.createDrink} onCreateCategory={caffeine.createCategory} onRenameCategory={caffeine.renameCategory} onDeleteCategory={caffeine.deleteCategory} onReorderCategories={caffeine.reorderCategories} onClearError={caffeine.clearError} onDeleteDrink={async id => { const success = await caffeine.deleteDrink(id); if (success) setToast('음료를 삭제했어요'); return success; }} onRecord={async (drink, mg, timing) => { const success = await caffeine.record(drink, mg, timing); if (success) { router.closeOverlay(); setToast(`${drink.name} ${mg}mg 기록했어요`); } return success; }} />}
    {overlay?.type === 'categories' && <BottomSheet key={overlay.key} title="카테고리 관리" onClose={closeSheet} className="sheet-dialog--add"><CategoryManager categories={caffeine.categories} drinks={caffeine.drinks} busy={caffeine.busy} error={caffeine.error} onCreate={caffeine.createCategory} onRename={caffeine.renameCategory} onDelete={caffeine.deleteCategory} onReorder={caffeine.reorderCategories} onClearError={caffeine.clearError} /></BottomSheet>}
    {overlay?.type === 'edit' && selectedEntry && <EditEntryForm key={overlay.key} step={overlay.step ?? 'record'} onStepChange={router.changeOverlayStep} onBack={router.back} onClose={closeSheet} storageError={caffeine.error} entry={selectedEntry} busy={caffeine.busy} onSave={async changes => { const success = await caffeine.updateEntry(selectedEntry.id, changes); if (success) { router.closeOverlay(); setToast('기록을 수정했어요'); } return success; }} />}
    {overlay && overlay.type !== 'edit' && overlay.type !== 'add' && overlay.type !== 'categories' && !invalidOverlay && <BottomSheet key={overlay.key} title={title} onClose={closeSheet}>
      {caffeine.error && <div className="error-message" role="alert">{caffeine.error}</div>}

      {overlay.type === 'delete' && selectedEntry && <div className="dialog-content"><p className="muted">{selectedEntry.drinkName} {selectedEntry.caffeineMg}mg 기록이 삭제돼요.</p><div className="dialog-actions"><button className="button-secondary" onClick={closeSheet}>취소</button><button className="button-primary" disabled={caffeine.busy} onClick={async () => { if (await caffeine.deleteEntry(selectedEntry.id)) { router.closeOverlay(); setToast('기록을 삭제했어요'); } }}>삭제하기</button></div></div>}
      {overlay.type === 'reset' && <div className="dialog-content"><p className="muted">섭취 기록과 직접 만든 음료 등 앱에 저장한 데이터가 모두 삭제돼요. 삭제한 데이터는 복구할 수 없어요.</p><div className="dialog-actions"><button className="button-secondary" onClick={closeSheet}>취소</button><button className="button-primary" disabled={caffeine.busy} onClick={async () => { if (await caffeine.reset()) { router.closeOverlay(); setToast('모든 데이터를 초기화했어요'); } }}>초기화하기</button></div></div>}
    </BottomSheet>}
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
  </div>;
}
