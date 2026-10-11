import { expect, type Page } from '@playwright/test';

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
  await picker.getByRole('spinbutton', { name: '오전·오후', exact: true }).press(hour < 12 ? 'Home' : 'End');
  const hourWheel = picker.getByRole('spinbutton', { name: '시', exact: true });
  await hourWheel.press('Home');
  for (let index = 1; index < (hour % 12 || 12); index++) await hourWheel.press('ArrowUp');
  const minuteWheel = picker.getByRole('spinbutton', { name: '분', exact: true });
  await minuteWheel.press('Home');
  for (let index = 0; index < Math.floor(minute / 10); index++) await minuteWheel.press('PageUp');
  for (let index = 0; index < minute % 10; index++) await minuteWheel.press('ArrowUp');
  await expect(picker.locator('.time-picker-preview')).toHaveText(`${hour < 12 ? '오전' : '오후'} ${hour % 12 || 12}:${String(minute).padStart(2, '0')}`);
  await picker.getByRole('button', { name: '완료', exact: true }).click();
}
