import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createInitialState, MAX_CAFFEINE_MG } from '../model/caffeine';
import { DEFAULT_DRINKS } from '../data/defaultDrinks';
import type { CaffeineEntry, CaffeineState, Drink } from '../model/caffeine.types';
import type { CaffeineRepository } from '../repository/CaffeineRepository';
import { createPrediction, deleteFeedback, dismissCheckIn, editFeedback, reconcilePersonalization, resetLearning, restoreDefault, setPersonalizationEnabled, submitFeedback, type FeedbackInput } from '../../personalization/model';

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
        publish({ ...next, personalization: reconcilePersonalization(next.personalization, next.entries, new Date()) });
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
      const transformed = transform(current.current);
      const next = { ...transformed, personalization: reconcilePersonalization(transformed.personalization, transformed.entries, new Date()) };
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
  async function record(drink: Drink, caffeineMg: number) {
    return commit(previous => {
      validateMg(caffeineMg);
      const entry: CaffeineEntry = { id: crypto.randomUUID(), drinkId: drink.id, drinkName: drink.name, caffeineMg, consumedAt: new Date().toISOString(), icon: drink.icon, sourceType: drink.sourceType };
      return { ...previous, entries: [...previous.entries, entry] };
    });
  }
  async function createDrink(input: Omit<Drink, 'id' | 'isCustom' | 'sourceType'>): Promise<Drink | null> {
    const drink: Drink = { ...input, name: input.name.trim(), id: crypto.randomUUID(), isCustom: true, sourceType: 'custom' };
    const saved = await commit(previous => {
      validateMg(drink.caffeineMg);
      if (!drink.name || drink.name.length > 30) throw new Error('음료 이름을 1~30자로 입력해 주세요.');
      if ([...DEFAULT_DRINKS, ...previous.customDrinks].some(item => item.categoryId === drink.categoryId && item.name === drink.name)) throw new Error('같은 카테고리에 이미 있는 이름이에요. 다른 이름을 입력해 주세요.');
      return { ...previous, customDrinks: [...previous.customDrinks, drink] };
    });
    return saved ? drink : null;
  }
  async function updateEntry(id: string, changes: Pick<CaffeineEntry, 'caffeineMg' | 'consumedAt'>) {
    return commit(previous => {
      validateMg(changes.caffeineMg);
      const date = Date.parse(changes.consumedAt);
      if (!Number.isFinite(date) || date > Date.now()) throw new Error('섭취 시각은 현재 또는 과거로 입력해 주세요.');
      return { ...previous, entries: previous.entries.map(entry => entry.id === id ? { ...entry, ...changes } : entry) };
    });
  }
  async function deleteEntry(id: string) { return commit(previous => ({ ...previous, entries: previous.entries.filter(entry => entry.id !== id) })); }
  async function exposePrediction(id: string) {
    return commit(previous => {
      if (previous.personalization.predictions.some(prediction => prediction.id === id)) return previous;
      const model = reconcilePersonalization(previous.personalization, previous.entries, new Date());
      const prediction = createPrediction(model, previous.entries, new Date());
      if (!prediction || prediction.id !== id) throw new Error('기록이나 시각이 바뀌었어요. 현재 예측을 다시 열어 주세요.');
      return { ...previous, personalization: { ...model, predictions: [...model.predictions, prediction] } };
    });
  }
  async function answerCheckIn(input: FeedbackInput) {
    return commit(previous => {
      const personalization = submitFeedback(previous.personalization, previous.entries, new Date(), input);
      if (personalization === previous.personalization) throw new Error('날짜나 섭취 기록이 바뀌었어요. 팝업을 닫고 앱을 다시 열어 주세요.');
      return { ...previous, personalization };
    });
  }
  async function skipCheckIn() {
    return commit(previous => ({ ...previous, personalization: dismissCheckIn(previous.personalization, previous.entries, new Date()) }));
  }
  async function removeFeedback(id: string) {
    return commit(previous => ({ ...previous, personalization: deleteFeedback(previous.personalization, previous.entries, new Date(), id) }));
  }
  async function changeFeedback(id: string, input: FeedbackInput) {
    return commit(previous => {
      const personalization = editFeedback(previous.personalization, previous.entries, new Date(), id, input);
      if (personalization === previous.personalization) throw new Error('응답을 수정하지 못했어요. 시간대와 체감 시각 범위를 확인해 주세요.');
      return { ...previous, personalization };
    });
  }
  async function togglePersonalization(enabled: boolean) {
    return commit(previous => ({ ...previous, personalization: setPersonalizationEnabled(previous.personalization, enabled) }));
  }
  async function restorePersonalizationDefault() {
    return commit(previous => ({ ...previous, personalization: restoreDefault(previous.personalization) }));
  }
  async function clearLearning() {
    return commit(previous => ({ ...previous, personalization: resetLearning(previous.personalization) }));
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
  const effectiveState = useMemo(() => ({ ...state, personalization: reconcilePersonalization(state.personalization, state.entries, now) }), [state, now]);
  return { state: effectiveState, now, loading, loaded, busy, error, clearError: () => setError(''), reload, drinks: [...DEFAULT_DRINKS, ...state.customDrinks], record, createDrink, updateEntry, deleteEntry, reset, exposePrediction, answerCheckIn, skipCheckIn, removeFeedback, changeFeedback, togglePersonalization, restorePersonalizationDefault, clearLearning };
}
