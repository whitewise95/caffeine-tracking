import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

for (const theme of ['', '?theme=light']) {
  test(`remaining screen shows each drink, returns home, and refreshes after time passes ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-04T06:00:00+09:00') });
    const state = createInitialState();
    state.entries = [
      { id: 'older', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 200, consumedAt: '2026-10-03T20:00:00+09:00', icon: 'coffee' },
      { id: 'recent', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 80, consumedAt: '2026-10-04T01:00:00+09:00', icon: 'coffee' },
      { id: 'faded', drinkId: 'tea', drinkName: '녹차', caffeineMg: 1, consumedAt: '2026-10-03T20:00:00+09:00', icon: 'tea' },
    ];
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), state);
    await page.goto(`/${theme}`);
    await expect(page.getByRole('region', { name: '아직 남아 있는 카페인' })).toHaveCount(0);
    await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
    await expect(page).toHaveURL(new RegExp(`/remaining${theme ? '\\?theme=light' : ''}$`));
    const section = page.getByRole('region', { name: '아직 남아 있는 카페인' });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('listitem')).toHaveCount(2);
    await expect(section.locator('time')).toHaveText(['오늘 01:00', '10월 3일 20:00']);
    await expect(section.locator('.remaining-drink-amount strong')).toHaveText(['38.3', '44.4']);
    await expect(page.getByTestId('remaining-mg')).toHaveText('83');
    await expect(section).not.toContainText('녹차');
    await expect(page.getByRole('navigation').getByRole('button', { name: '홈', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.goBack();
    await expect(page.getByRole('button', { name: '아직 남아 있는 카페인 보기' })).toBeFocused();
    await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: '음료별 잔존 카페인', exact: true })).toBeVisible();
    await expect(section.getByRole('listitem')).toHaveCount(2);
    await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
    await expect(page.getByRole('button', { name: '아직 남아 있는 카페인 보기' })).toBeFocused();
    await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-remaining-drinks-${theme ? 'light' : 'dark'}.png`, fullPage: true });

    await page.clock.setSystemTime(new Date('2026-10-04T11:00:00+09:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(section.locator('.remaining-drink-amount strong')).toHaveText(['17.7', '20.5']);
    // The hidden tea still contributes about 0.103 mg: the full total rounds to 38.
    await expect(page.getByTestId('remaining-mg')).toHaveText('38');
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await section.scrollIntoViewIfNeeded();
    expect(await section.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.clock.setSystemTime(new Date('2026-10-08T06:00:00+09:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(section.getByRole('listitem')).toHaveCount(0);
    await expect(section).toContainText('현재 표시할 음료가 없어요.');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).entries.length)).toBe(3);
  });

  test(`absorption countdown updates, respects slow intake and disappears at the cutoff ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-04T09:00:00+09:00') });
    await page.clock.pauseAt(new Date('2026-10-04T10:00:00+09:00'));
    const state = createInitialState();
    state.entries = [
      { id: 'instant', drinkId: 'americano', drinkName: '바로 마신 커피', caffeineMg: 150, consumedAt: '2026-10-04T10:00:00+09:00', icon: 'coffee' },
      { id: 'slow', drinkId: 'americano', drinkName: '천천히 마신 커피', caffeineMg: 150, startedAt: '2026-10-04T09:00:00+09:00', consumedAt: '2026-10-04T10:00:00+09:00', icon: 'coffee' },
    ];
    await page.addInitScript(state => {
      if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
    }, state);
    await page.goto(`/remaining${theme}`);
    const instant = page.getByRole('listitem').filter({ hasText: '바로 마신 커피' });
    const slow = page.getByRole('listitem').filter({ hasText: '천천히 마신 커피' });
    await expect(instant.locator('.remaining-absorption-time')).toHaveText('약 1시간 7분 남음');
    await expect(slow.locator('.remaining-absorption-time')).toHaveText('약 47분 남음');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-absorption-countdown-${theme ? 'light' : 'dark'}.png` });
    await page.clock.fastForward(60_000);
    await expect(instant.locator('.remaining-absorption-time')).toHaveText('약 1시간 6분 남음');
    await expect(slow.locator('.remaining-absorption-time')).toHaveText('약 46분 남음');
    await page.reload();
    await expect(slow.locator('.remaining-absorption-time')).toHaveText('약 46분 남음');

    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await slow.scrollIntoViewIfNeeded();
    expect(await slow.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-absorption-countdown-200-${theme ? 'light' : 'dark'}.png`, fullPage: true });

    await page.clock.setSystemTime(new Date('2026-10-04T10:46:00+09:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(slow.locator('.remaining-absorption-time')).toHaveText('약 1분 남음');
    await page.clock.setSystemTime(new Date('2026-10-04T10:47:00+09:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(slow.locator('.remaining-drink-absorbing')).toHaveCount(0);
    await expect(instant.locator('.remaining-absorption-time')).toHaveText('약 20분 남음');
    await page.clock.setSystemTime(new Date('2026-10-04T11:07:00+09:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('.remaining-drink-absorbing')).toHaveCount(0);
    await expect(page.getByRole('listitem')).toHaveCount(2);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!))).toEqual(state);
  });
}
