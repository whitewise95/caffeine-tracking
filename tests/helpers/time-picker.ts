import { expect, type Locator, type Page } from '@playwright/test';

export function timeWheel(root: Page | Locator, label: string) {
  return root.locator(`.time-wheel[data-time-wheel="${label}"]`);
}

export async function setTimeWheel(root: Page | Locator, label: string, index: number) {
  const wheel = timeWheel(root, label);
  await wheel.click({ force: true, position: { x: 4, y: 4 } });
  await wheel.evaluate((element, nextIndex) => {
    const rowHeight = element.querySelector('.time-wheel-option')!.getBoundingClientRect().height;
    const selected = Number(element.getAttribute('data-value')) - (element.getAttribute('data-time-wheel') === '시' ? 1 : 0);
    const box = element.getBoundingClientRect();
    const y = box.y + box.height / 2;
    const now = performance.now();
    // Deterministic slow drag for fixture setup; native touch behavior has its own tests.
    for (const [type, distance, elapsed] of [
      ['pointerdown', 0, 0], ['pointermove', (nextIndex - selected) * rowHeight, 500],
      ['pointerup', (nextIndex - selected) * rowHeight, 700],
    ] as const) {
      const event = new PointerEvent(type, {
        bubbles: true, pointerId: 11, pointerType: 'touch', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
        clientX: box.x + box.width / 2, clientY: y - distance,
      });
      Object.defineProperty(event, 'timeStamp', { value: now + elapsed });
      element.dispatchEvent(event);
    }
  }, index);
  await expect(wheel).toHaveAttribute('data-value', String(label === '시' ? index + 1 : index));
}

export async function expectWheelCentered(wheel: Locator) {
  await expect.poll(() => wheel.evaluate(element => {
    const selection = element.parentElement!.querySelector('.time-wheel-selection')!.getBoundingClientRect();
    const row = element.querySelector('.time-wheel-option.is-selected')!.getBoundingClientRect();
    return Math.abs(selection.y + selection.height / 2 - row.y - row.height / 2);
  })).toBeLessThan(1);
}

export async function pickTime(page: Page, label: string, time: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  const [hour24, minute] = time.split(':').map(Number);
  await setTimeWheel(page, '오전·오후', hour24 < 12 ? 0 : 1);
  await setTimeWheel(page, '시', (hour24 % 12 || 12) - 1);
  await setTimeWheel(page, '분', minute);
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
}
