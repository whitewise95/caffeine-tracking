import { expect, type Locator, type Page } from '@playwright/test';

export function timeWheel(root: Page | Locator, label: string) {
  return root.locator(`.time-wheel[data-time-wheel="${label}"]`);
}

export async function setTimeWheel(root: Page | Locator, label: string, index: number) {
  const wheel = timeWheel(root, label);
  await wheel.click({ force: true, position: { x: 4, y: 4 } });
  await wheel.evaluate((element, nextIndex) => {
    const rowHeight = element.firstElementChild!.getBoundingClientRect().height;
    element.scrollTo({ top: rowHeight * nextIndex, behavior: 'instant' });
  }, index);
  await expect(wheel).toHaveAttribute('data-value', String(label === '시' ? index + 1 : index));
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
