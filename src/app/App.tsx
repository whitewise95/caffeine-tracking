import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Home, List, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { HomePage } from '../pages/HomePage';
import { HistoryPage } from '../pages/HistoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { BottomSheet } from '../components/BottomSheet';
import { AddCaffeineSheet } from '../features/caffeine/components/AddCaffeineSheet';
import { EditEntryForm } from '../features/caffeine/components/EditEntryForm';
import { useCaffeine } from '../features/caffeine/hooks/useCaffeine';
import { PersonalizationFeedbackEditor, PersonalizationPreferences } from '../features/personalization/PersonalizationExperience';
import { DailyCheckInModal } from '../features/personalization/components/DailyCheckInModal';
import { useCheckInPrompt } from '../features/personalization/useCheckInPrompt';
import { createRepository, initializeTossSafeArea, isTossRuntime, setOverlaySwipeBack, subscribeTossBack } from '../integrations/toss/toss';
import { useRouter, type Page } from './router';

const navigation = [{ page: 'home', label: '홈', icon: Home }, { page: 'history', label: '기록', icon: List }, { page: 'settings', label: '설정', icon: SlidersHorizontal }] as const;

export function App() {
  const repository = useMemo(() => createRepository(), []);
  const caffeine = useCaffeine(repository);
  const router = useRouter();
  const checkInCandidate = useCheckInPrompt(caffeine, router);
  const [toast, setToast] = useState('');
  const { page, overlay, depth } = router;
  const selectedEntry = caffeine.state.entries.find(entry => entry.id === overlay?.entryId);
  const selectedFeedback = caffeine.state.personalization.feedback.find(record => record.id === overlay?.entryId);
  const invalidOverlay = caffeine.loaded && (((overlay?.type === 'edit' || overlay?.type === 'delete') && !selectedEntry) || (overlay?.type === 'feedback' && !selectedFeedback));
  const { discardOverlay } = router;
  useEffect(() => { if (invalidOverlay) discardOverlay(); }, [invalidOverlay, discardOverlay]);

  useEffect(() => {
    document.documentElement.dataset.theme = isTossRuntime() || new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark';
    return initializeTossSafeArea();
  }, []);
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
  useEffect(() => setOverlaySwipeBack(Boolean(overlay)), [overlay]);
  useEffect(() => {
    document.title = `${page === 'home' ? '지금 내 카페인' : page === 'history' ? '카페인 기록' : '설정'} · 카페인`;
  }, [page]);

  function navigate(next: Page) { caffeine.clearError(); router.navigate(next); }
  function openAdd() { caffeine.clearError(); router.openOverlay({ type: 'add' }); }
  function closeSheet() { if (!caffeine.busy) { caffeine.clearError(); router.closeOverlay(); } }
  const title = overlay?.type === 'add' ? '어떤 카페인을 마셨나요?' : overlay?.type === 'edit' ? '기록 수정' : overlay?.type === 'delete' ? '이 기록을 삭제할까요?' : '모든 데이터를 초기화할까요?';

  return <div className="app-shell">
    {caffeine.error && !overlay && <div className="error-message" role="alert">{caffeine.error}</div>}
    {caffeine.loading ? <main className="loading-state" role="status">나의 기록을 불러오고 있어요…</main> : !caffeine.loaded ? <main className="page"><div className="empty-state"><AlertCircle size={36} /><h1 className="page-title">기록을 열지 못했어요</h1><p>기존 데이터는 변경하지 않았어요.<br />다시 시도하거나 저장 데이터를 초기화할 수 있어요.</p><button className="button-primary" onClick={() => void caffeine.reload()}>다시 불러오기</button><button className="text-button" onClick={() => router.openOverlay({ type: 'reset' })}>데이터 초기화</button></div></main> : <>
      {page === 'home' && <HomePage state={caffeine.state} now={caffeine.now} onAdd={openAdd} onSettings={() => navigate('settings')} onHistory={() => navigate('history')} />}
      {page === 'history' && <HistoryPage entries={caffeine.state.entries} now={caffeine.now} onAdd={openAdd} onEdit={entry => router.openOverlay({ type: 'edit', entryId: entry.id })} onDelete={entry => router.openOverlay({ type: 'delete', entryId: entry.id })} />}
      {page === 'settings' && <SettingsPage onReset={() => router.openOverlay({ type: 'reset' })} halfLifeHours={caffeine.state.settings.halfLifeHours} personalization={<PersonalizationPreferences caffeine={caffeine} onEdit={record => { caffeine.clearError(); router.openOverlay({ type: 'feedback', entryId: record.id }); }} />} />}
      <nav className="bottom-nav" aria-label="주요 메뉴">{navigation.map(({ page: item, label, icon: Icon }) => <button key={item} className="nav-item" aria-current={page === item ? 'page' : undefined} onClick={() => navigate(item)}><Icon size={21} strokeWidth={page === item ? 1.9 : 1.5} aria-hidden="true" /><span>{label}</span></button>)}</nav>
    </>}
    {overlay?.type === 'check-in' && checkInCandidate && <DailyCheckInModal key={`${overlay.key}:${checkInCandidate.targetDate}:${checkInCandidate.timeZone}:${checkInCandidate.lastIntakeAt}`} candidate={checkInCandidate} busy={caffeine.busy} onClose={closeSheet} onSubmit={async input => { const saved = await caffeine.answerCheckIn(input); if (saved) { router.closeOverlay(); setToast('체감을 기록했어요'); } return saved; }} />}
    {overlay?.type === 'feedback' && selectedFeedback && <PersonalizationFeedbackEditor key={overlay.key} caffeine={caffeine} record={selectedFeedback} onClose={closeSheet} />}
    {overlay && overlay.type !== 'check-in' && overlay.type !== 'feedback' && !invalidOverlay && <BottomSheet key={overlay.key} title={title} onClose={closeSheet}>
      {caffeine.error && <div className="error-message" role="alert">{caffeine.error}</div>}
      {overlay.type === 'add' && <AddCaffeineSheet drinks={caffeine.drinks} busy={caffeine.busy} onCreateDrink={caffeine.createDrink} onRecord={async (drink, mg) => { const success = await caffeine.record(drink, mg); if (success) { router.closeOverlay(); setToast(`${drink.name} ${mg}mg 기록했어요`); } return success; }} />}
      {overlay.type === 'edit' && selectedEntry && <EditEntryForm entry={selectedEntry} busy={caffeine.busy} onSave={async changes => { const success = await caffeine.updateEntry(selectedEntry.id, changes); if (success) { router.closeOverlay(); setToast('기록을 수정했어요'); } return success; }} />}
      {overlay.type === 'delete' && selectedEntry && <div className="dialog-content"><p className="muted">{selectedEntry.drinkName} {selectedEntry.caffeineMg}mg 기록이 삭제돼요.</p><div className="dialog-actions"><button className="button-secondary" onClick={closeSheet}>취소</button><button className="button-primary" disabled={caffeine.busy} onClick={async () => { if (await caffeine.deleteEntry(selectedEntry.id)) { router.closeOverlay(); setToast('기록을 삭제했어요'); } }}>삭제하기</button></div></div>}
      {overlay.type === 'reset' && <div className="dialog-content"><p className="muted">섭취 기록, 직접 만든 음료와 체감 응답 등 앱에 저장한 데이터가 모두 삭제돼요. 삭제한 데이터는 복구할 수 없어요.</p><div className="dialog-actions"><button className="button-secondary" onClick={closeSheet}>취소</button><button className="button-primary" disabled={caffeine.busy} onClick={async () => { if (await caffeine.reset()) { router.closeOverlay(); setToast('모든 데이터를 초기화했어요'); } }}>초기화하기</button></div></div>}
    </BottomSheet>}
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
  </div>;
}
