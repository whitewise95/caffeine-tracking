import { expect, test } from '@playwright/test';
import { createInitialState, remainingCaffeine } from '../src/features/caffeine/model/caffeine';
import { installTossHost } from './helpers/tossHost';
import { chooseBedtime, openBedtimeSettings } from './helpers/bedtime';

const now = new Date('2026-10-06T16:00:00+09:00');
const state = {
  ...createInitialState(),
  entries: [{ id: 'bedtime-entry', drinkId: 'cold-brew', drinkName: '콜드브루', caffeineMg: 200, consumedAt: '2026-10-06T13:00:00+09:00', icon: 'coffee' as const }],
};

for (const native of [false, true]) {
  test(`bedtime drives Home and survives reload in ${native ? 'Toss' : 'browser'}`, async ({ page }, info) => {
    await page.clock.install({ time: now });
    if (native) await installTossHost(page);
    const key = native ? 'test-toss-native-state' : 'caffeine-tracker:state:v1';
    await page.addInitScript(({ key, state }) => {
      if (!sessionStorage.getItem('bedtime-seeded')) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem('bedtime-seeded', 'true');
      }
    }, { key, state });
    await page.goto('/');
    const forecast = page.locator('.summary-item.forecast');
    await expect(forecast).toContainText('오늘 23:00');
    await expect(forecast.locator('strong')).toHaveText(String(Math.round(remainingCaffeine(state.entries, new Date('2026-10-06T23:00:00+09:00'), 4.5))));
    await openBedtimeSettings(page);
    await chooseBedtime(page, '01:00');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const expected = String(Math.round(remainingCaffeine(state.entries, new Date('2026-10-07T01:00:00+09:00'), 4.5)));
    await expect(page.getByTestId('bedtime-mg')).toHaveText(expected);
    await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
    await expect(forecast).toContainText('내일 01:00');
    await expect(forecast.locator('strong')).toHaveText(expected);
    await page.reload();
    await expect(forecast).toContainText('내일 01:00');
    await expect(forecast.locator('strong')).toHaveText(expected);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual({ ...state, settings: { ...state.settings, bedtime: '01:00' } });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`bedtime-${native ? 'toss' : 'browser'}.png`) });
    await openBedtimeSettings(page);
    await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오전 1:00');
    const card = page.locator('.settings-bedtime');
    await card.screenshot({ path: info.outputPath(`bedtime-card-${native ? 'toss' : 'browser'}.png`) });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await card.screenshot({ path: info.outputPath(`bedtime-card-large-text-${native ? 'toss' : 'browser'}.png`) });
  });
}

test('failed bedtime save retains the previous Home forecast and can be retried', async ({ page }) => {
  await page.clock.install({ time: now });
  await installTossHost(page);
  await page.addInitScript(state => localStorage.setItem('test-toss-native-state', JSON.stringify(state)), state);
  await page.goto('/settings');
  await openBedtimeSettings(page);
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오후 11:00');
  await page.evaluate(() => Reflect.set(window, 'testFailNextStorage', true));
  await chooseBedtime(page, '02:00');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('dialog', { name: '예정 취침 시각', exact: true })).toBeVisible();
  await expect(page.locator('.time-picker-preview')).toContainText('오전 2:00');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오후 11:00');
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.locator('.summary-item.forecast')).toContainText('오늘 23:00');
  await openBedtimeSettings(page);
  await chooseBedtime(page, '02:00');
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오전 2:00');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click();
  await expect(page.locator('.summary-item.forecast')).toContainText('내일 02:00');
});

test('bedtime sheet cancels drafts and Android back returns to settings before leaving it', async ({ page }) => {
  await page.clock.install({ time: now });
  await installTossHost(page, 'android');
  await page.addInitScript(state => localStorage.setItem('test-toss-native-state', JSON.stringify(state)), state);
  await page.goto('/settings');
  await openBedtimeSettings(page);
  const control = page.getByRole('button', { name: '예정 취침 시각', exact: true });
  const saved = await page.evaluate(() => localStorage.getItem('test-toss-native-state'));
  for (const exit of ['cancel', 'close', 'escape', 'browser-back', 'android-back']) {
    await control.click();
    const picker = page.getByRole('dialog', { name: '예정 취침 시각', exact: true });
    await picker.getByRole('spinbutton', { name: '시', exact: true }).press('Home');
    await picker.getByRole('spinbutton', { name: '분', exact: true }).press('End');
    await expect(picker.locator('.time-picker-preview')).toContainText('오후 1:59');
    expect(await page.evaluate(() => localStorage.getItem('test-toss-native-state'))).toBe(saved);
    if (exit === 'cancel') await picker.getByRole('button', { name: '취소', exact: true }).click();
    else if (exit === 'close') await picker.getByRole('button', { name: '닫기', exact: true }).click();
    else if (exit === 'escape') await page.keyboard.press('Escape');
    else if (exit === 'browser-back') await page.goBack();
    else await page.evaluate(() => Reflect.get(window, 'testNativeBack')());
    await expect(picker).toHaveCount(0);
    await expect(page).toHaveURL(/\/settings$/);
    await expect(control).toContainText('오후 11:00');
    await expect(control).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem('test-toss-native-state'))).toBe(saved);
  }
});

test('bedtime picker stores noon and midnight as the correct 24-hour times', async ({ page }) => {
  await page.clock.install({ time: now });
  await page.goto('/settings');
  await openBedtimeSettings(page);
  await chooseBedtime(page, '12:34');
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오후 12:34');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).settings.bedtime)).toBe('12:34');
  await chooseBedtime(page, '00:05');
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오전 12:05');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).settings.bedtime)).toBe('00:05');
});

test('bedtime wheels support tapping, scrolling and enlarged text in a bottom sheet', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: now });
  await page.goto('/settings');
  await openBedtimeSettings(page);
  await page.getByRole('button', { name: '예정 취침 시각', exact: true }).click();
  const picker = page.getByRole('dialog', { name: '예정 취침 시각', exact: true });
  await picker.getByRole('button', { name: '10시 선택', exact: true }).tap();
  await picker.getByRole('button', { name: '01분 선택', exact: true }).tap();
  await expect(picker.locator('.time-picker-preview')).toContainText('오후 10:01');
  const minute = picker.getByRole('spinbutton', { name: '분', exact: true });
  await minute.evaluate(element => {
    const height = element.firstElementChild!.getBoundingClientRect().height;
    element.scrollTo({ top: height * 15, behavior: 'instant' });
  });
  await expect(minute).toHaveAttribute('aria-valuenow', '15');
  await expect(picker.locator('.time-picker-preview')).toContainText('오후 10:15');
  await page.screenshot({ path: info.outputPath('bedtime-picker.png') });
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await minute.press('End');
  await expect(minute).toHaveAttribute('aria-valuenow', '59');
  const done = picker.getByRole('button', { name: '완료', exact: true });
  await done.scrollIntoViewIfNeeded();
  expect(await picker.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('bedtime-picker-large-text.png') });
  await done.click();
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toContainText('오후 10:59');
});

test('bedtime is a collapsed settings accordion and is removed from the report', async ({ page }) => {
  await page.clock.install({ time: now });
  await page.goto('/insights');
  await expect(page.getByRole('button', { name: '예정 취침 시각', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '잠들 무렵에는', exact: true })).toHaveCount(0);
  await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  const section = page.locator('details.settings-bedtime');
  await expect(section).toHaveCount(1);
  await expect(section).not.toHaveAttribute('open', '');
  await expect(section.getByRole('button', { name: '예정 취침 시각', exact: true })).not.toBeVisible();
  await section.locator('summary').click();
  await expect(section.getByRole('button', { name: '예정 취침 시각', exact: true })).toBeVisible();
  await section.locator('summary').press('Space');
  await expect(section.getByRole('button', { name: '예정 취침 시각', exact: true })).not.toBeVisible();
});
