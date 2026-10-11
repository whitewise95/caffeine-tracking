import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialState, DEFAULT_CAFFEINE_HALF_LIFE_HOURS, MAX_CAFFEINE_MG } from '../model/caffeine';
import type { CaffeineEntry, CaffeineIntakeTiming, CaffeineState, CustomDrinkDraft, Drink, DrinkCategoryId, DrinkEditDraft } from '../model/caffeine.types';
import { addCustomDrink, availableDrinks, categoryDrinkIds, createDrinkCategory, deleteDrinkCategory, deleteDrinkFromCatalog, drinkCategories, moveDrinkInCatalog, renameDrinkCategory, reorderDrinkCategories, updateDrinkInCatalog } from '../model/drinkCategories';
import { isValidIntakeTiming } from '../model/intakeTiming';
import { normalizeIntakeNote } from '../model/intakeNote';
import { DEFAULT_BEDTIME, isBedtime } from '../model/bedtime';
import { deleteCaffeineEntry, snapshotEntryDrinkPhotos } from '../model/drinkPhoto';
import type { CaffeineRepository } from '../repository/CaffeineRepository';

export function useCaffeine(repository: CaffeineRepository) {
  const [state, setState] = useState<CaffeineState>(createInitialState);
  const current = useRef(state);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const loadSequence = useRef(0);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());
  const publish = useCallback((next: CaffeineState) => { current.current = next; setState(next); setNow(new Date()); }, []);
  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError('');
    try {
      const next = await repository.load();
      if (sequence === loadSequence.current) {
        publish(next);
        setLoaded(true);
      }
    }
    catch (cause) { if (sequence === loadSequence.current) { setError(cause instanceof Error ? cause.message : '기록을 불러오지 못했어요. 다시 시도해 주세요.'); setLoaded(false); } }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [publish, repository]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  async function commit(transform: (previous: CaffeineState) => CaffeineState) {
    if (locked.current || !loaded) return false;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const next = transform(current.current);
      await repository.save(next);
      publish(next);
      return true;
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했어요. 다시 시도해 주세요.'); return false; }
    finally { locked.current = false; setBusy(false); }
  }

  function validateMg(mg: number) {
    if (!Number.isFinite(mg) || mg < 0 || mg > MAX_CAFFEINE_MG) throw new Error(`카페인량을 0~${MAX_CAFFEINE_MG}mg 사이로 입력해 주세요.`);
  }
  async function record(drink: Drink, caffeineMg: number, timing?: CaffeineIntakeTiming, note?: string) {
    return commit(previous => {
      validateMg(caffeineMg);
      const memo = normalizeIntakeNote(note);
      const recordedAt = new Date();
      const intake = timing ?? { consumedAt: recordedAt.toISOString() };
      if (!isValidIntakeTiming(intake, recordedAt)) throw new Error('마신 시각을 확인해 주세요. 시작은 종료보다 빠르게, 종료는 현재 또는 과거로 입력해 주세요.');
      const entry: CaffeineEntry = { id: crypto.randomUUID(), drinkId: drink.id, drinkName: drink.name, caffeineMg, consumedAt: intake.consumedAt, ...(intake.startedAt ? { startedAt: intake.startedAt } : {}), icon: drink.icon, sourceType: drink.sourceType };
      if (memo !== undefined) entry.note = memo;
      return snapshotEntryDrinkPhotos({ ...previous, entries: [...previous.entries, entry] }, [entry], drink.photoDataUrl);
    });
  }
  async function createDrink(input: CustomDrinkDraft): Promise<Drink | null> {
    let drink: Drink | null = null;
    const saved = await commit(previous => {
      const result = addCustomDrink(previous, input, { drinkId: crypto.randomUUID(), categoryId: `custom:${crypto.randomUUID()}` });
      drink = result.drink;
      return result.state;
    });
    return saved ? drink : null;
  }
  async function updateEntry(id: string, changes: Pick<CaffeineEntry, 'caffeineMg' | 'consumedAt' | 'startedAt' | 'note'>) {
    return commit(previous => {
      validateMg(changes.caffeineMg);
      if (!isValidIntakeTiming(changes, new Date())) throw new Error('마신 시각을 확인해 주세요. 시작은 종료보다 빠르게, 종료는 현재 또는 과거로 입력해 주세요.');
      const note = normalizeIntakeNote(changes.note);
      return { ...previous, entries: previous.entries.map(entry => entry.id === id ? { ...entry, ...changes, note } : entry) };
    });
  }
  async function deleteEntry(id: string) { return commit(previous => deleteCaffeineEntry(previous, id)); }
  async function updateDrink(id: string, draft: DrinkEditDraft) { return commit(previous => updateDrinkInCatalog(previous, id, draft)); }
  async function deleteDrink(id: string) { return commit(previous => deleteDrinkFromCatalog(previous, id)); }
  async function moveDrink(id: string, categoryId: DrinkCategoryId, beforeDrinkId?: string): Promise<boolean> { return commit(previous => moveDrinkInCatalog(previous, id, categoryId, beforeDrinkId)); }
  async function createCategory(name: string): Promise<boolean> { return commit(previous => createDrinkCategory(previous, name, `custom:${crypto.randomUUID()}`)); }
  async function renameCategory(id: DrinkCategoryId, name: string): Promise<boolean> { return commit(previous => renameDrinkCategory(previous, id, name)); }
  async function deleteCategory(id: DrinkCategoryId, destinationId?: DrinkCategoryId): Promise<boolean> { return commit(previous => deleteDrinkCategory(previous, id, destinationId)); }
  async function forceDeleteCategory(id: DrinkCategoryId): Promise<boolean> { return commit(previous => deleteDrinkCategory(previous, id, undefined, 'force')); }
  async function reorderCategories(ids: DrinkCategoryId[]): Promise<boolean> { return commit(previous => reorderDrinkCategories(previous, ids)); }
  async function setBedtime(bedtime: string): Promise<boolean> {
    return commit(previous => {
      if (!isBedtime(bedtime)) throw new Error('예정 취침 시각을 확인해 주세요.');
      return { ...previous, settings: { ...previous.settings, bedtime } };
    });
  }
  async function reset() {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError('');
    try { await repository.reset(); publish(createInitialState()); setLoaded(true); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : '초기화하지 못했어요. 다시 시도해 주세요.'); return false; }
    finally { locked.current = false; setBusy(false); }
  }
  async function setTiltAnimation(tiltAnimation: boolean): Promise<boolean> {
    return commit(previous => ({ ...previous, settings: { ...previous.settings, tiltAnimation } }));
  }
  const categoryEntryCounts = Object.fromEntries(drinkCategories(state).map(category => {
    const ids = categoryDrinkIds(state, category.id);
    return [category.id, state.entries.filter(entry => ids.has(entry.drinkId)).length];
  }));
  return { state, categoryEntryCounts, forceDeleteCategory, bedtime: state.settings.bedtime ?? DEFAULT_BEDTIME, setBedtime, setTiltAnimation, halfLifeHours: DEFAULT_CAFFEINE_HALF_LIFE_HOURS, now, loading, loaded, busy, error, clearError: () => setError(''), reload, categories: drinkCategories(state), drinks: availableDrinks(state), record, createDrink, updateDrink, deleteDrink, moveDrink, createCategory, renameCategory, deleteCategory, reorderCategories, updateEntry, deleteEntry, reset };
}
