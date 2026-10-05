import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';

test('a fresh dose absorbs over time, forecasts the evening amount, and excludes future intake', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-04T09:00:00+09:00') });
  await page.clock.pauseAt(new Date('2026-10-04T10:00:00+09:00'));
  const state = createInitialState();
  state.entries = [
    { id: 'now', drinkId: 'coffee', drinkName: '지금 마신 커피', caffeineMg: 150, consumedAt: '2026-10-04T10:00:00+09:00', icon: 'coffee' },
    { id: 'future', drinkId: 'coffee', drinkName: '미래 기록', caffeineMg: 1000, consumedAt: '2026-10-04T12:00:00+09:00', icon: 'coffee' },
  ];
  await page.addInitScript(state => {
    if (localStorage.getItem('caffeine-tracker:state:v1') === null) {
      localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state));
    }
  }, state);
  await page.goto('/');
  await page.getByRole('button', { name: '아직 남아 있는 카페인 보기' }).click();
  const list = page.getByRole('region', { name: '아직 남아 있는 카페인' });
  await expect(page.getByTestId('remaining-mg')).toHaveText('0');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('지금 마신 커피');
  await expect(list).toContainText('흡수 중');
  await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
  await expect(page.getByRole('button', { name: '아직 남아 있는 카페인 보기' })).toBeVisible();
  // Independently checked from the compartment ODE, with a 4.5 h half-life, 150 mg after 12 h ≈ 24.45 mg.
  await expect(page.locator('.forecast strong')).toHaveText('24');

  await page.clock.fastForward(30_000);
  await expect(page.getByTestId('remaining-mg')).toHaveText('6');
  await page.clock.setSystemTime(new Date('2026-10-04T10:30:00+09:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('remaining-mg')).toHaveText('128');
  await expect(page.locator('.body-visual')).toHaveAttribute('data-level', 'FILLED');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-absorption.png`, fullPage: true });
  await page.clock.setSystemTime(new Date('2026-10-04T11:00:00+09:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('remaining-mg')).toHaveText('131');
  await page.reload();
  await expect(page.getByTestId('remaining-mg')).toHaveText('131');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!))).toEqual(state);

  // Before the future record is due, this original dose has passed its peak.
  await page.clock.setSystemTime(new Date('2026-10-04T11:30:00+09:00'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('remaining-mg')).toHaveText('123');
});
