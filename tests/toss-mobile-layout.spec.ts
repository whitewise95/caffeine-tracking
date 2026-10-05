import { expect, test, type Page } from '@playwright/test';

async function swipeUp(page: Page) {
  const session = await page.context().newCDPSession(page);
  const x = page.viewportSize()!.width / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: 450 }] });
  for (const y of [400, 350, 300, 250, 200]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
}

for (const theme of ['dark', 'light']) {
  for (const fontSize of [16, 32]) {
    test(`home can reveal its last content above fixed controls: ${theme}, ${fontSize}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: page.viewportSize()!.width, height: 700 });
      await page.goto(`/?theme=${theme}`);
      await page.getByRole('heading', { name: '지금 내 카페인' }).waitFor();
      await page.evaluate(size => {
        document.documentElement.style.fontSize = `${size}px`;
        document.documentElement.style.setProperty('--safe-bottom', '34px');
      }, fontSize);
      await swipeUp(page);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const bottom = await page.locator('.home-bottom-note').boundingBox();
      const controls = await page.locator('.home-cta').boundingBox();
      expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(controls!.y - 16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`home-${theme}-${fontSize}.png`), animations: 'disabled' });

      await page.getByRole('button', { name: '카페인 추가', exact: true }).click();
      const list = page.locator('.sheet-scroll');
      await expect(list).toHaveCSS('scrollbar-width', 'none');
      await list.evaluate(element => { element.scrollTop = element.scrollHeight; });
      expect(await list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await page.getByRole('button', { name: '닫기', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
      await page.evaluate(() => window.scrollTo(0, 0));
      await swipeUp(page);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    });
  }
}
