import { expect, test } from '@playwright/test';

for (const theme of ['dark']) {
  test(`category contact stays neutral until the whole row enters drag mode ${theme}`, async ({ page }, testInfo) => {
    await page.goto(`/settings?theme=${theme}`);
    await page.getByRole('button', { name: '카테고리 관리', exact: true }).click();
    const item = page.locator('[data-category-row="coffee"]');
    const handle = item.getByRole('button', { name: '커피 카테고리 순서 이동', exact: true });
    const bounds = (await handle.boundingBox())!;
    const touch = await page.context().newCDPSession(page);
    const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await page.waitForTimeout(100);
    await expect(handle).toHaveAttribute('aria-pressed', 'false');
    expect(await handle.evaluate(element => getComputedStyle(element).transform)).toBe('none');
    await expect(handle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(item).not.toHaveClass(/is-dragging/);

    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await expect(item).toHaveClass(/is-dragging/);
    expect(await handle.evaluate(element => getComputedStyle(element).transform)).toBe('none');
    await expect(handle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page.screenshot({ path: testInfo.outputPath(`single-drag-emphasis-${theme}.png`) });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(handle).toHaveAttribute('aria-pressed', 'false');
    await touch.detach();

    await handle.focus();
    await page.keyboard.press('Space');
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await expect(handle).toHaveCSS('outline-style', 'none');
    await page.keyboard.press('Escape');
    await expect(handle).toHaveCSS('outline-style', 'solid');
    await expect(item).not.toHaveClass(/is-dragging/);
  });
}
