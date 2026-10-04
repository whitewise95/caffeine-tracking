import { expect, test, type Page } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import type { CaffeineState } from '../src/features/caffeine/model/caffeine.types';
import { createPrediction, submitFeedback } from '../src/features/personalization/model';

const storageKey = 'caffeine-tracker:state:v1';
const intakeTime = '2026-10-03T10:00:00+09:00';
const nextDay = new Date('2026-10-04T12:00:00+09:00');
const yesterdayEntry = { id: 'check-in-coffee', drinkId: 'americano', drinkName: '아메리카노', caffeineMg: 150, consumedAt: intakeTime, icon: 'coffee', sourceType: 'sample' } as const;
const dialogName = '어제 카페인, 어땠나요?';

async function seed(page: Page, options: { now?: Date; query?: string; entries?: CaffeineState['entries']; personalization?: CaffeineState['personalization'] } = {}) {
  await page.clock.install({ time: options.now ?? nextDay });
  const state = createInitialState();
  state.entries = options.entries ?? [{ ...yesterdayEntry }];
  if (options.personalization) state.personalization = options.personalization;
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: storageKey, state });
  await page.goto(`/${options.query ?? ''}`);
  await expect(page.locator('.bottom-nav')).toBeVisible();
}

async function stored(page: Page): Promise<CaffeineState> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
}

async function foreground(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'visibilityState');
  });
}

function checkIn(page: Page) {
  return page.getByRole('dialog', { name: dialogName, exact: true });
}

async function answer(page: Page, label = '오래 갔어요') {
  const dialog = checkIn(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: label, exact: true }).check();
  await dialog.getByRole('button', { name: '답변 저장', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

for (const response of [
  { label: '오래 갔어요', answer: 'later', adjustment: 0.25 },
  { label: '비슷했어요', answer: 'similar', adjustment: 0 },
  { label: '빨리 줄었어요', answer: 'earlier', adjustment: -0.25 },
]) {
  test(`yesterday popup saves ${response.answer} without a prior forecast and never repeats an answered day`, async ({ page }) => {
    await seed(page);
    const dialog = checkIn(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('나의 카페인 체감 패턴을 알아보기 위해 물어봐요.');
    await expect(dialog.getByRole('radio')).toHaveCount(3);
    await expect(dialog.locator('input[type="datetime-local"]')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: '답변 저장', exact: true })).toBeDisabled();
    const mgBefore = await page.getByTestId('remaining-mg').textContent();
    await answer(page, response.label);
    const state = await stored(page);
    expect(state.personalization.feedback).toHaveLength(1);
    expect(state.personalization.feedback[0]).toMatchObject({ responseKind: 'daily-feeling', answer: response.answer, targetDate: '2026-10-03' });
    expect(state.personalization.feedback[0].predictionId).toBeUndefined();
    expect(state.personalization.predictions).toHaveLength(0);
    expect(state.personalization.perceivedDurationAdjustment).toBe(response.adjustment);
    expect(state.settings.halfLifeHours).toBe(5);
    await expect(page.getByTestId('remaining-mg')).toHaveText(mgBefore!);
    await page.reload();
    await expect(page.getByTestId('remaining-mg')).toBeVisible();
    await expect(checkIn(page)).toHaveCount(0);
    await foreground(page);
    await expect(checkIn(page)).toHaveCount(0);
    expect((await stored(page)).personalization.feedback).toHaveLength(1);
  });
}

test('a late-night drink is eligible as soon as the calendar day changes', async ({ page }) => {
  await seed(page, { now: new Date('2026-10-04T00:05:00+09:00'), entries: [{ ...yesterdayEntry, consumedAt: '2026-10-03T23:55:00+09:00' }] });
  await expect(checkIn(page)).toBeVisible();
  await answer(page, '비슷했어요');
  expect((await stored(page)).personalization.feedback[0].targetDate).toBe('2026-10-03');
});

for (const scenario of [
  { name: 'no intake', entries: [] },
  { name: 'today only', entries: [{ ...yesterdayEntry, consumedAt: '2026-10-04T10:00:00+09:00' }] },
  { name: 'older intake only', entries: [{ ...yesterdayEntry, consumedAt: '2026-10-02T10:00:00+09:00' }] },
  { name: 'zero caffeine yesterday', entries: [{ ...yesterdayEntry, caffeineMg: 0 }] },
]) {
  test(`does not ask about yesterday with ${scenario.name}`, async ({ page }) => {
    await seed(page, { entries: scenario.entries });
    await expect(checkIn(page)).toHaveCount(0);
    expect((await stored(page)).personalization.feedback).toHaveLength(0);
  });
}

test('dismissal is temporary, does not save feedback, and allows history navigation', async ({ page }) => {
  await seed(page);
  await checkIn(page).getByRole('button', { name: '나중에 답하기', exact: true }).first().click();
  await expect(checkIn(page)).toHaveCount(0);
  expect((await stored(page)).personalization.feedback).toHaveLength(0);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await expect(page).toHaveURL(/\/history$/);
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(checkIn(page)).toHaveCount(0);
  await page.reload();
  await expect(checkIn(page)).toBeVisible();
  await checkIn(page).getByRole('button', { name: '나중에 답하기', exact: true }).first().click();
  await foreground(page);
  await expect(checkIn(page)).toBeVisible();
  expect((await stored(page)).personalization.feedback).toHaveLength(0);
});

test('browser back closes the popup without reopening or leaving home', async ({ page }) => {
  await seed(page);
  await expect(checkIn(page)).toBeVisible();
  await page.goBack();
  await expect(checkIn(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await page.clock.runFor(31_000);
  await expect(checkIn(page)).toHaveCount(0);
  expect((await stored(page)).personalization.feedback).toHaveLength(0);
});

test('an open popup follows the new yesterday at midnight and resets the previous selection', async ({ page }) => {
  await seed(page, { entries: [
    { ...yesterdayEntry },
    { ...yesterdayEntry, id: 'today-coffee', consumedAt: '2026-10-04T10:00:00+09:00' },
  ] });
  await checkIn(page).getByRole('radio', { name: '오래 갔어요', exact: true }).check();
  await expect(checkIn(page).getByRole('button', { name: '답변 저장', exact: true })).toBeEnabled();

  await page.clock.setSystemTime(new Date('2026-10-05T00:05:00+09:00'));
  await foreground(page);
  await expect(checkIn(page)).toBeVisible();
  await expect(checkIn(page).getByRole('radio', { checked: true })).toHaveCount(0);
  await expect(checkIn(page).getByRole('button', { name: '답변 저장', exact: true })).toBeDisabled();
  await answer(page, '비슷했어요');
  const state = await stored(page);
  expect(state.personalization.feedback).toHaveLength(1);
  expect(state.personalization.feedback[0]).toMatchObject({
    targetDate: '2026-10-04', answer: 'similar', lastIntakeAt: '2026-10-04T01:00:00.000Z',
  });
});

test('forward after a save completed in the background does not restore an answered popup', async ({ page }) => {
  await seed(page);
  await checkIn(page).getByRole('radio', { name: '오래 갔어요', exact: true }).check();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      return new Promise<void>(resolve => {
        window.addEventListener('finish-feedback-save', () => { original.call(this, key, value); resolve(); }, { once: true });
      });
    };
  });
  await checkIn(page).getByRole('button', { name: '답변 저장', exact: true }).click();
  await expect(checkIn(page).getByRole('button', { name: /저장/ })).toBeDisabled();
  await page.goBack();
  await expect(checkIn(page)).toHaveCount(0);
  expect((await stored(page)).personalization.feedback).toHaveLength(0);

  await page.evaluate(() => window.dispatchEvent(new Event('finish-feedback-save')));
  await expect.poll(async () => (await stored(page)).personalization.feedback.length).toBe(1);
  await page.goForward();
  await expect.poll(() => page.evaluate(() => window.history.state?.overlay)).toBeNull();
  await expect(checkIn(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  expect((await stored(page)).personalization.feedback).toHaveLength(1);
});

test('popup is home-only and appears when returning home with yesterday unanswered', async ({ page }) => {
  await seed(page, { query: 'history' });
  await expect(checkIn(page)).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(checkIn(page)).toBeVisible();
});

test('failed feedback save keeps the selected answer and allows retry', async ({ page }) => {
  await seed(page);
  const dialog = checkIn(page);
  await dialog.getByRole('radio', { name: '오래 갔어요', exact: true }).check();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (!failed) { failed = true; throw new DOMException('Quota exceeded', 'QuotaExceededError'); }
      original.call(this, key, value);
    };
  });
  await dialog.getByRole('button', { name: '답변 저장', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('저장하지 못했어요');
  await expect(dialog.getByRole('radio', { name: '오래 갔어요', exact: true })).toBeChecked();
  expect((await stored(page)).personalization.feedback).toHaveLength(0);
  await dialog.getByRole('button', { name: '답변 저장', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect((await stored(page)).personalization.feedback).toHaveLength(1);
});

test('a pending feedback save cannot be submitted twice or closed prematurely', async ({ page }) => {
  await seed(page);
  await checkIn(page).getByRole('radio', { name: '오래 갔어요', exact: true }).check();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      return new Promise<void>(resolve => {
        window.addEventListener('finish-feedback-save', () => { original.call(this, key, value); resolve(); }, { once: true });
      });
    };
  });
  await checkIn(page).getByRole('button', { name: '답변 저장', exact: true }).dispatchEvent('click');
  await expect(checkIn(page).getByRole('button', { name: /저장/ })).toBeDisabled();
  await checkIn(page).getByRole('button', { name: /저장/ }).dispatchEvent('click');
  await page.keyboard.press('Escape');
  await expect(checkIn(page)).toBeVisible();
  expect((await stored(page)).personalization.feedback).toHaveLength(0);
  await page.evaluate(() => window.dispatchEvent(new Event('finish-feedback-save')));
  await expect(checkIn(page)).toHaveCount(0);
  const state = await stored(page);
  expect(state.personalization.feedback).toHaveLength(1);
  expect(state.personalization.perceivedDurationAdjustment).toBe(0.25);
});

test('editing and deleting a daily response replays its adjustment and preserves intake', async ({ page }) => {
  await seed(page);
  await answer(page);
  await page.goto('/settings');
  await expect(page.getByRole('slider')).toHaveCount(0);
  await page.getByText('체감 기록 관리', { exact: true }).click();
  await page.getByText('나의 체감 응답 1개', { exact: true }).click();
  await page.getByRole('button', { name: '2026년 10월 3일 체감 응답 수정' }).click();
  const edit = page.getByRole('dialog', { name: '체감 응답 수정', exact: true });
  await expect(edit.getByRole('radio', { name: '오래 갔어요', exact: true })).toBeChecked();
  await edit.getByRole('radio', { name: '빨리 줄었어요', exact: true }).check();
  await edit.getByRole('button', { name: '답변 저장', exact: true }).click();
  await expect(edit).toHaveCount(0);
  let state = await stored(page);
  expect(state.personalization.feedback).toHaveLength(1);
  expect(state.personalization.feedback[0].editedAt).toBeTruthy();
  expect(state.personalization.feedback[0].answer).toBe('earlier');
  expect(state.personalization.perceivedDurationAdjustment).toBe(-0.25);
  expect(state.settings.halfLifeHours).toBe(5);
  await page.getByRole('button', { name: '2026년 10월 3일 체감 응답 삭제' }).click();
  await page.getByRole('button', { name: '응답 삭제하기', exact: true }).click();
  await expect(page.getByText('나의 체감 응답 0개', { exact: true })).toBeVisible();
  state = await stored(page);
  expect(state.personalization.feedback).toHaveLength(0);
  expect(state.personalization.perceivedDurationAdjustment).toBe(0);
  expect(state.entries).toHaveLength(1);
  await page.reload();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(checkIn(page)).toBeVisible();
});

test('legacy interval responses remain editable after the daily popup change', async ({ page }) => {
  const entries = [{ ...yesterdayEntry }];
  const personalization = submitFeedback(createInitialState().personalization, entries, nextDay, {
    targetDate: '2026-10-03', lastIntakeAt: new Date(intakeTime).toISOString(), timeZone: 'Asia/Seoul',
    answer: 'interval', observedWithoutComparison: true, confounders: [],
    observedInterval: { start: '2026-10-03T08:00:00.000Z', end: '2026-10-03T09:00:00.000Z' },
  }, 'Asia/Seoul');
  expect(personalization.feedback).toHaveLength(1);
  await seed(page, { query: 'settings', entries, personalization });
  await page.getByText('체감 기록 관리', { exact: true }).click();
  await page.getByText('나의 체감 응답 1개', { exact: true }).click();
  await page.getByRole('button', { name: '2026년 10월 3일 체감 응답 수정' }).click();
  await page.getByLabel('체감 시각 범위 시작', { exact: true }).fill('2026-10-03T16:00');
  await page.getByLabel('체감 시각 범위 끝', { exact: true }).fill('2026-10-03T17:00');
  await page.getByRole('button', { name: '응답 수정 저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '체감 응답 수정', exact: true })).toHaveCount(0);
  const state = await stored(page);
  expect(state.personalization.feedback[0].answer).toBe('interval');
  expect(state.personalization.feedback[0].observedInterval?.start).toBe('2026-10-03T07:00:00.000Z');
  expect(state.personalization.feedback[0].editedAt).toBeTruthy();
  expect(state.settings.halfLifeHours).toBe(5);
});

test('home hides perceived duration even with a saved forecast and preserves that history', async ({ page }) => {
  const entries = [{ ...yesterdayEntry, consumedAt: '2026-10-04T10:00:00+09:00' }];
  const personalization = createInitialState().personalization;
  const prediction = createPrediction(personalization, entries, new Date('2026-10-04T10:05:00+09:00'), 'Asia/Seoul');
  expect(prediction).not.toBeNull();
  personalization.predictions = [prediction!];
  await seed(page, { entries, personalization });
  await expect(page.getByTestId('remaining-mg')).toBeVisible();
  await expect(page.getByText('체감 지속 시간', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '오늘 체감 예측 보기' })).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '기록', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  expect((await stored(page)).personalization.predictions).toEqual([prediction]);
});

test('learning defaults and selective deletion preserve drink records', async ({ page }) => {
  await seed(page);
  await answer(page);
  await page.goto('/settings');
  await page.getByText('체감 기록 관리', { exact: true }).click();
  await page.getByRole('switch', { name: '다음 날 체감 질문 받기' }).uncheck();
  await expect(page.getByRole('switch', { name: '다음 날 체감 질문 받기' })).not.toBeChecked();
  expect((await stored(page)).personalization.feedback).toHaveLength(1);
  await page.getByRole('button', { name: '체감 기록 모두 삭제', exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  expect((await stored(page)).personalization.feedback).toHaveLength(1);
  await page.getByRole('button', { name: '체감 기록 모두 삭제', exact: true }).click();
  await page.getByRole('button', { name: '체감 기록 삭제하기', exact: true }).click();
  await expect(page.getByText('나의 체감 응답 0개', { exact: true })).toBeVisible();
  expect((await stored(page)).personalization.feedback).toHaveLength(0);
  expect((await stored(page)).entries).toHaveLength(1);
});

for (const theme of ['', '?theme=light']) {
  test(`daily popup supports keyboard, focus, enlarged text and ${theme || 'dark'} theme`, async ({ page }, testInfo) => {
    await seed(page, { query: theme });
    const dialog = checkIn(page);
    await expect(dialog).toBeVisible();
    const options = dialog.getByRole('radio');
    await expect(options).toHaveCount(3);
    await options.first().focus();
    await page.keyboard.press('Space');
    await expect(options.first()).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toBeChecked();
    await expect(options.nth(1)).toBeFocused();
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      const focus = await dialog.evaluate(element => ({
        inside: element.contains(document.activeElement),
        browserChrome: document.activeElement === document.body && element.matches(':modal'),
        activeTag: document.activeElement?.tagName,
      }));
      // A native modal may hand Tab to browser chrome, but never to background app controls.
      expect(focus.inside || focus.browserChrome, JSON.stringify(focus)).toBe(true);
    }
    await page.screenshot({ path: `test-results/${testInfo.project.name}-check-in-${theme ? 'light' : 'dark'}.png`, fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const targetSizes = await dialog.locator('button, label').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    expect(targetSizes.every(height => height >= 44)).toBe(true);
    await dialog.getByRole('button', { name: '답변 저장', exact: true }).scrollIntoViewIfNeeded();
    await expect(dialog.getByRole('button', { name: '답변 저장', exact: true })).toBeInViewport();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-check-in-${theme ? 'light' : 'dark'}-large-text.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
}
