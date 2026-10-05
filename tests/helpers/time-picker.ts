import { expect, type Page } from '@playwright/test';

export async function pickTime(page: Page, label: string, time: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  const [hour24, minute] = time.split(':').map(Number);
  const period = page.getByRole('spinbutton', { name: '오전·오후', exact: true });
  await period.focus();
  await period.press(hour24 < 12 ? 'Home' : 'End');
  const hour = page.getByRole('spinbutton', { name: '시', exact: true });
  await hour.focus();
  await hour.press('Home');
  for (let i = 1; i < (hour24 % 12 || 12); i++) await hour.press('ArrowUp');
  const minutes = page.getByRole('spinbutton', { name: '분', exact: true });
  await minutes.focus();
  await minutes.press('Home');
  for (let i = 0; i < Math.floor(minute / 10); i++) await minutes.press('PageUp');
  for (let i = 0; i < minute % 10; i++) await minutes.press('ArrowUp');
  await expect(minutes).toHaveAttribute('aria-valuenow', String(minute));
  await page.getByRole('button', { name: '완료', exact: true }).click();
  await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
}
