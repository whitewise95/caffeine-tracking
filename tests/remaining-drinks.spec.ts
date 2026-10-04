import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

for (const theme of ['', '?theme=light']) {
  test(`home shows each remaining drink across dates and refreshes after time passes ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.clock.install({ time: new Date('2026-10-04T06:00:00+09:00') });
    const state = createInitialState();
    state.personalization.enabled = false;
    state.entries = [
      { id: 'older', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 200, consumedAt: '2026-10-03T20:00:00+09:00', icon: 'coffee' },
      { id: 'recent', drinkId: 'coffee', drinkName: '아메리카노', caffeineMg: 80, consumedAt: '2026-10-04T01:00:00+09:00', icon: 'coffee' },
      { id: 'faded', drinkId: 'tea', drinkName: '녹차', caffeineMg: 1, consumedAt: '2026-10-03T20:00:00+09:00', icon: 'tea' },
    ];
    await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), state);
    await page.goto(`/${theme}`);
    const section = page.getByRole('region', { name: '아직 남아 있는 카페인' });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('listitem')).toHaveCount(2);
    await expect(section.locator('time')).toHaveText(['오늘 01:00', '10월 3일 20:00']);
    await expect(section.locator('.remaining-drink-amount strong')).toHaveText(['40', '50']);
    await expect(page.getByTestId('remaining-mg')).toHaveText('90');
    await expect(section).not.toContainText('녹차');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-remaining-drinks-${theme ? 'light' : 'dark'}.png`, fullPage: true });

    await page.clock.setSystemTime(new Date('2026-10-04T11:00:00+09:00'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(section.locator('.remaining-drink-amount strong')).toHaveText(['20', '25']);
    await expect(page.getByTestId('remaining-mg')).toHaveText('45');
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
}
