import { expect, test, type Page } from '@playwright/test';
import { expectWheelCentered, setTimeWheel, timeWheel } from './helpers/time-picker';
import { installTossHost } from './helpers/tossHost';

async function openNativePicker(page: Page) {
  await page.clock.install({ time: new Date('2026-10-04T10:00:00+09:00') });
  await installTossHost(page);
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: /아메리카노\s*150\s*mg/ }).click();
  await page.getByRole('button', { name: '천천히 마시기', exact: true }).click();
  await page.getByRole('button', { name: '마시기 시작한 시각', exact: true }).click();
  await setTimeWheel(page, '분', 20);
  await page.clock.pauseAt(new Date('2026-10-04T10:00:10+09:00'));
  await page.evaluate(() => Reflect.set(window, 'testHaptics', []));
}

async function dragMinutes(page: Page, rows: number) {
  const wheel = timeWheel(page, '분');
  const box = (await wheel.boundingBox())!;
  const rowHeight = await wheel.locator('.time-wheel-option').first().evaluate(element => element.getBoundingClientRect().height);
  const x = box.x + box.width / 2;
  const y = box.y + box.height * .7;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let row = 1; row <= Math.abs(rows); row++) {
    await page.mouse.move(x, y - rowHeight * row * Math.sign(rows));
    await page.clock.runFor(60);
  }
  // Hold before releasing so the gesture is precise rather than a fling.
  await page.clock.runFor(120);
  await page.mouse.up();
  await page.clock.runFor(350);
  await expect(wheel).not.toHaveAttribute('data-interacting', 'true');
  await expectWheelCentered(wheel);
}

async function hapticCalls(page: Page): Promise<Array<{ type: string }>> {
  return page.evaluate(() => Reflect.get(window, 'testHaptics'));
}

test('held native haptic replies do not block dragging or queue old ticks', async ({ page }) => {
  await openNativePicker(page);
  await page.evaluate(() => Reflect.set(window, 'testDelayHaptic', true));
  await dragMinutes(page, 4);
  await expect(timeWheel(page, '분')).toHaveAttribute('data-value', '24');
  expect(await hapticCalls(page)).toEqual([{ type: 'tickWeak' }]);

  // Completing the native call must not play the three ticks skipped during drag.
  await page.evaluate(() => {
    Reflect.set(window, 'testDelayHaptic', false);
    (Reflect.get(window, 'testResolveHaptics') as () => void)();
  });
  await page.clock.runFor(60);
  expect(await hapticCalls(page)).toHaveLength(1);
  await dragMinutes(page, 1);
  await expect(timeWheel(page, '분')).toHaveAttribute('data-value', '25');
  expect(await hapticCalls(page)).toEqual([{ type: 'tickWeak' }, { type: 'tickWeak' }]);
});

test('a rejected native haptic does not prevent the next drag and feedback', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  await openNativePicker(page);
  await page.evaluate(() => Reflect.set(window, 'testFailNextHaptic', true));
  await dragMinutes(page, 1);
  await expect(timeWheel(page, '분')).toHaveAttribute('data-value', '21');
  expect(await hapticCalls(page)).toHaveLength(1);
  expect(await page.evaluate(() => Reflect.get(window, 'testFailNextHaptic'))).toBe(false);

  await dragMinutes(page, 1);
  await expect(timeWheel(page, '분')).toHaveAttribute('data-value', '22');
  expect(await hapticCalls(page)).toEqual([{ type: 'tickWeak' }, { type: 'tickWeak' }]);
  expect(errors).toEqual([]);
});
