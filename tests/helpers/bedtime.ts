import { expect, type Page } from '@playwright/test';
import { setTimeWheel } from './time-picker';

export async function openBedtimeSettings(page: Page) {
  if (!page.url().endsWith('/settings')) await page.getByRole('navigation').getByRole('button', { name: '설정', exact: true }).click();
  const section = page.locator('details.settings-bedtime');
  if (await section.getAttribute('open') === null) await section.locator(':scope > summary').click();
}

export async function chooseBedtime(page: Page, time: string) {
  await openBedtimeSettings(page);
  await page.getByRole('button', { name: '예정 취침 시각', exact: true }).click();
  const picker = page.getByRole('dialog', { name: '예정 취침 시각', exact: true });
  const [hour, minute] = time.split(':').map(Number);
  await setTimeWheel(picker, '오전·오후', hour < 12 ? 0 : 1);
  await setTimeWheel(picker, '시', (hour % 12 || 12) - 1);
  await setTimeWheel(picker, '분', minute);
  await expect(picker.locator('.time-picker-preview')).toHaveText(`${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`);
  await picker.getByRole('button', { name: '완료', exact: true }).click();
}
