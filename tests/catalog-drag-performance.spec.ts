import { expect, test } from '@playwright/test';
import { createInitialState } from '../src/features/caffeine/model/caffeine';
import { installTossHost } from './helpers/tossHost';

for (const environment of ['browser', 'toss'] as const) {
test(`a burst of touch moves does not synchronously measure the entire catalog in ${environment}`, async ({ page }, info) => {
  if (environment === 'toss') await installTossHost(page);
  else await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState());
  const cpu = await page.context().newCDPSession(page);
  await cpu.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await page.goto('/');
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
  await page.getByRole('button', { name: '편집', exact: true }).click();
  await page.getByRole('dialog').evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => undefined)));
  });
  const measurements = await page.evaluate(async () => {
    const source = document.querySelector<HTMLElement>('[data-layout-drink="americano"] .catalog-drink-surface')!;
    const destination = document.querySelector<HTMLElement>('[data-layout-heading="tea"]')!;
    const start = source.getBoundingClientRect();
    const end = destination.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, pointerId: 73, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 };
    const x = start.x + start.width / 2;
    const y = start.y + start.height / 2;
    source.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x, clientY: y }));
    window.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + 8, clientY: y }));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const original = Element.prototype.getBoundingClientRect;
    let reads = 0;
    Element.prototype.getBoundingClientRect = function () {
      if (this.closest('.catalog-editor')) reads++;
      return original.call(this);
    };
    let burstReads: number;
    let idleReads: number;
    let previewLeft: number;
    try {
      for (let index = 1; index <= 100; index++) {
        window.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + 8 + index * .2, clientY: y }));
      }
      burstReads = reads;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const preview = document.querySelector<HTMLElement>('.catalog-drag-preview')!;
      previewLeft = original.call(preview).left;
      reads = 0;
      for (let frame = 0; frame < 8; frame++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      idleReads = reads;
      // Release at a different category without giving the queued frame time to run.
      window.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0, clientX: end.x + 10, clientY: end.y + end.height / 2 }));
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
    return { burstReads, idleReads, previewLeft, expectedLeft: start.left + 28 };
  });
  await info.attach('catalog-drag-measurements', { body: JSON.stringify(measurements), contentType: 'application/json' });
  expect(measurements.burstReads).toBe(0);
  expect(measurements.idleReads).toBe(0);
  expect(measurements.previewLeft).toBeCloseTo(measurements.expectedLeft, 0);
  await expect(page.locator('[data-layout-category="tea"] [data-layout-drink="americano"]')).toBeVisible();
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  const storageKey = environment === 'toss' ? 'test-toss-native-state' : 'caffeine-tracker:state:v1';
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).defaultDrinkCategoryOverrides?.americano, storageKey)).toBe('tea');
  await expect(page.locator('.catalog-drag-preview')).toHaveCount(0);
  await cpu.detach();
});
}
