import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Home, List, BookOpen, SlidersHorizontal, AlertCircle, ChartNoAxesCombined } from 'lucide-react';
import { HomePage } from '../pages/HomePage';
import { RemainingCaffeinePage } from '../pages/RemainingCaffeinePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { InsightsPage } from '../pages/InsightsPage';
import { BedtimeTimeSheet } from '../features/insights/components/BedtimeTimeSheet';
import { KnowledgePage } from '../pages/KnowledgePage';
import { BottomSheet } from '../components/BottomSheet';
import { ExitConfirmDialog } from '../components/ExitConfirmDialog';
import { AddCaffeineSheet } from '../features/caffeine/components/AddCaffeineSheet';
import { CategoryManager } from '../features/caffeine/components/CategoryManager';
import { EditEntryForm } from '../features/caffeine/components/EditEntryForm';
import { useCaffeine } from '../features/caffeine/hooks/useCaffeine';
import { useRestoreDeviceTiltPermission } from '../features/caffeine/hooks/useDeviceTiltPermission';
import { deviceTiltPermissionStatus, requestDeviceTiltPermission } from '../features/caffeine/hooks/deviceTiltPermission';
import { createRepository, initializeTossSafeArea, setOverlaySwipeBack, subscribeTossBack, syncTossNavigationTheme } from '../integrations/toss/toss';
import { useRouter, type Page } from './router';
import { APP_THEME, APP_BACKGROUND } from './theme';
import { formatTime } from '../features/caffeine/model/caffeine';
import { entryDrinkPhoto } from '../features/caffeine/model/drinkPhoto';

const navigation = [{ page: 'history', label: '기록', icon: List }, { page: 'insights', label: '리포트', icon: ChartNoAxesCombined }, { page: 'home', label: '홈', icon: Home }, { page: 'knowledge', label: '지식', icon: BookOpen }, { page: 'settings', label: '설정', icon: SlidersHorizontal }] as const;

export function App() {
  const repository = useMemo(() => createRepository(), []);
  const caffeine = useCaffeine(repository);
  useRestoreDeviceTiltPermission(caffeine.loaded && !caffeine.loading && Boolean(caffeine.state.settings.tiltAnimation));
  const router = useRouter();
  const [toast, setToast] = useState('');
  const [intakePulse, setIntakePulse] = useState(0);
  const [reportHistoryDay, setReportHistoryDay] = useState<string | undefined>();
  const [pendingTab, setPendingTab] = useState<Page | null>(null);
  const tabNavigationLocked = useRef(false);
  const { page, overlay } = router;
  const exitPending = useRef(false);
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
    document.documentElement.dataset.theme = APP_THEME;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', APP_BACKGROUND);
  }, []);
  useEffect(() => { void syncTossNavigationTheme(APP_THEME); }, []);
  useEffect(() => initializeTossSafeArea(), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const { back } = router;
  const handleBack = useCallback(() => { if (!exitPending.current) back(); }, [back]);
  useEffect(() => subscribeTossBack(handleBack), [handleBack]);
  useEffect(() => { if (overlay?.type !== 'exit') exitPending.current = false; }, [overlay?.type]);
  useEffect(() => setOverlaySwipeBack(hasOverlay), [hasOverlay]);
  useEffect(() => {
    document.title = page === 'home' ? '지금 카페인' : `${page === 'remaining' ? '음료별 잔존 카페인' : page === 'history' ? '카페인 기록' : page === 'insights' ? '카페인 리포트' : page === 'knowledge' ? '카페인 지식' : '설정'} · 지금 카페인`;
  }, [page]);

  function navigate(next: Page) { caffeine.clearError(); if (next === 'history') setReportHistoryDay(undefined); router.navigate(next); }
  async function navigateTab(next: Page) {
    if (tabNavigationLocked.current || next === page) return;
    const permission = deviceTiltPermissionStatus();
    const needsPermission = caffeine.state.settings.tiltAnimation && !matchMedia('(prefers-reduced-motion: reduce)').matches && (permission === 'permission' || permission === 'checking');
    if (!needsPermission) { navigate(next); return; }
    tabNavigationLocked.current = true;
    setPendingTab(next);
    try {
      // Invoke in the actual tab tap, before awaiting or changing the route.
      // Grant or cancellation both finish first, then the chosen tab opens.
      await requestDeviceTiltPermission();
      navigate(next);
    } finally {
      tabNavigationLocked.current = false;
      setPendingTab(null);
    }
  }
  function openReportHistory(day?: string) { caffeine.clearError(); setReportHistoryDay(day); router.navigate('history'); }
  function openAdd() { caffeine.clearError(); router.openOverlay({ type: 'add' }); }
  function openBedtime() { caffeine.clearError(); router.openOverlay({ type: 'bedtime' }); }
  function openHistoryAdd(day: string) {
    caffeine.clearError();
    const consumedAt = new Date(`${day}T${formatTime(new Date())}`);
    router.openOverlay({ type: 'add', initialConsumedAt: consumedAt.toISOString() });
  }
  function closeSheet() { if (!caffeine.busy) { caffeine.clearError(); router.closeOverlay(); } }
  const title = overlay?.type === 'add' ? '어떤 카페인을 마셨나요?' : overlay?.type === 'edit' ? '기록 수정' : overlay?.type === 'delete' ? '이 기록을 삭제할까요?' : '모든 데이터를 초기화할까요?';

  return <div className="app-shell">
    {caffeine.error && !overlay && <div className="error-message" role="alert">{caffeine.error}</div>}
    {caffeine.loading ? <main className="loading-state" role="status">나의 기록을 불러오고 있어요…</main> : !caffeine.loaded ? <main className="page"><div className="empty-state"><AlertCircle size={36} /><h1 className="page-title">기록을 열지 못했어요</h1><p>기존 데이터는 변경하지 않았어요.<br />다시 시도하거나 저장 데이터를 초기화할 수 있어요.</p><button className="button-primary" onClick={() => void caffeine.reload()}>다시 불러오기</button><button className="text-button" onClick={() => router.openOverlay({ type: 'reset' })}>데이터 초기화</button></div></main> : <>
      {page === 'home' && <HomePage intakePulse={intakePulse} state={caffeine.state} halfLifeHours={caffeine.halfLifeHours} now={caffeine.now} onAdd={openAdd} onRemaining={() => navigate('remaining')} />}
      {page === 'remaining' && <RemainingCaffeinePage drinks={caffeine.drinks} photoHistory={caffeine.state} entries={caffeine.state.entries} halfLifeHours={caffeine.halfLifeHours} now={caffeine.now} onBack={router.back} />}
      {page === 'history' && <HistoryPage initialDay={reportHistoryDay} drinks={caffeine.drinks} photoHistory={caffeine.state} entries={caffeine.state.entries} now={caffeine.now} onAdd={openHistoryAdd} onEdit={entry => router.openOverlay({ type: 'edit', entryId: entry.id })} onDelete={entry => router.openOverlay({ type: 'delete', entryId: entry.id })} />}
      {page === 'insights' && <InsightsPage entries={caffeine.state.entries} now={caffeine.now} halfLifeHours={caffeine.halfLifeHours} onHistory={openReportHistory} />}
      {page === 'knowledge' && <KnowledgePage />}
      {page === 'settings' && <SettingsPage entries={caffeine.state.entries} now={caffeine.now} halfLifeHours={caffeine.halfLifeHours} bedtime={caffeine.bedtime} onPickBedtime={openBedtime} tiltAnimation={caffeine.state.settings.tiltAnimation ?? false} busy={caffeine.busy} onTiltAnimationChange={caffeine.setTiltAnimation} onReset={() => router.openOverlay({ type: 'reset' })} />}
      <nav className="bottom-nav" aria-label="주요 메뉴">{navigation.map(({ page: item, label, icon: Icon }) => {
        const selected = page === item || (page === 'remaining' && item === 'home');
        return <button key={item} className="nav-item" aria-current={selected ? 'page' : undefined} aria-busy={pendingTab === item} disabled={pendingTab !== null} onClick={() => void navigateTab(item)}><Icon size={21} strokeWidth={selected ? 1.9 : 1.5} aria-hidden="true" /><span>{label}</span></button>;
      })}</nav>
    </>}
    {overlay?.type === 'add' && <AddCaffeineSheet catalogState={caffeine.state} onCommitCatalog={caffeine.commitCatalog} key={overlay.key} initialConsumedAt={overlay.initialConsumedAt} step={overlay.step ?? 'select'} onStepChange={router.changeOverlayStep} onBack={router.back} onClose={closeSheet} error={caffeine.error} drinks={caffeine.drinks} categories={caffeine.categories} busy={caffeine.busy} onCreateDrink={caffeine.createDrink} onUpdateDrink={caffeine.updateDrink} onCreateCategory={caffeine.createCategory} onRenameCategory={caffeine.renameCategory} categoryEntryCounts={caffeine.categoryEntryCounts} onForceDeleteCategory={caffeine.forceDeleteCategory} onDeleteCategory={caffeine.deleteCategory} onReorderCategories={caffeine.reorderCategories} onMoveDrink={caffeine.moveDrink} onClearError={caffeine.clearError} onDeleteDrink={async id => { const success = await caffeine.deleteDrink(id); if (success) setToast('음료를 삭제했어요'); return success; }} onRecord={async (drink, mg, timing, note) => { const success = await caffeine.record(drink, mg, timing, note); if (success) { if (page === 'home' && mg > 0) setIntakePulse(pulse => pulse + 1); router.closeOverlay(); setToast(`${drink.name} ${mg}mg 기록했어요`); } return success; }} />}
    {overlay?.type === 'categories' && <BottomSheet key={overlay.key} title="카테고리 관리" onClose={closeSheet} className="sheet-dialog--add"><CategoryManager categories={caffeine.categories} drinks={caffeine.drinks} entryCounts={caffeine.categoryEntryCounts} busy={caffeine.busy} error={caffeine.error} onCreate={caffeine.createCategory} onRename={caffeine.renameCategory} onDelete={caffeine.deleteCategory} onForceDelete={caffeine.forceDeleteCategory} onReorder={caffeine.reorderCategories} onClearError={caffeine.clearError} /></BottomSheet>}
    {overlay?.type === 'edit' && selectedEntry && <EditEntryForm key={overlay.key} step={overlay.step ?? 'record'} onStepChange={router.changeOverlayStep} onBack={router.back} onClose={closeSheet} storageError={caffeine.error} entry={selectedEntry} photoDataUrl={entryDrinkPhoto(selectedEntry, caffeine.drinks, caffeine.state)} busy={caffeine.busy} onSave={async changes => { const success = await caffeine.updateEntry(selectedEntry.id, changes); if (success) { router.closeOverlay(); setToast('기록을 수정했어요'); } return success; }} />}
    {overlay?.type === 'exit' && <ExitConfirmDialog key={overlay.key} onCancel={router.closeOverlay} onClosingChange={closing => { exitPending.current = closing; }} />}
    {overlay?.type === 'bedtime' && <BedtimeTimeSheet key={overlay.key} bedtime={caffeine.bedtime} busy={caffeine.busy} error={caffeine.error} onClose={closeSheet} onSave={async time => { if (await caffeine.setBedtime(time)) router.closeOverlay(); }} />}
    {overlay && overlay.type !== 'bedtime' && overlay.type !== 'exit' && overlay.type !== 'edit' && overlay.type !== 'add' && overlay.type !== 'categories' && !invalidOverlay && <BottomSheet key={overlay.key} title={title} onClose={closeSheet}>
      {caffeine.error && <div className="error-message" role="alert">{caffeine.error}</div>}

      {overlay.type === 'delete' && selectedEntry && <div className="dialog-content"><p className="muted">{selectedEntry.drinkName} {selectedEntry.caffeineMg}mg 기록이 삭제돼요.</p><div className="dialog-actions"><button className="button-secondary" onClick={closeSheet}>취소</button><button className="button-primary" disabled={caffeine.busy} onClick={async () => { if (await caffeine.deleteEntry(selectedEntry.id)) { router.closeOverlay(); setToast('기록을 삭제했어요'); } }}>삭제하기</button></div></div>}
      {overlay.type === 'reset' && <div className="dialog-content"><p className="muted">섭취 기록과 직접 만든 음료 등 앱에 저장한 데이터가 모두 삭제돼요. 삭제한 데이터는 복구할 수 없어요.</p><div className="dialog-actions"><button className="button-secondary" onClick={closeSheet}>취소</button><button className="button-primary" disabled={caffeine.busy} onClick={async () => { if (await caffeine.reset()) { router.closeOverlay(); setToast('모든 데이터를 초기화했어요'); } }}>초기화하기</button></div></div>}
    </BottomSheet>}
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
  </div>;
}
