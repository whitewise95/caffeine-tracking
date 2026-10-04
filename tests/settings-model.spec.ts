import { expect, test } from '@playwright/test';

for (const theme of ['', '?theme=light']) {
  test(`settings presents a read-only model time and legible exponent at enlarged text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.goto(`/settings${theme}`);
    await expect(page.getByTestId('half-life-value')).toHaveText('5시간0분');
    await expect(page.getByRole('slider')).toHaveCount(0);
    const formula = page.getByRole('math');
    await expect(formula).toHaveAccessibleName('음료별 추정 잔존량은 섭취량 곱하기 0.5의 경과 시간 나누기 반감기 제곱. 시간 단위는 시간입니다.');
    const base = await formula.locator('.formula-base').boundingBox();
    const exponent = await formula.locator('sup').boundingBox();
    expect(exponent!.y).toBeLessThan(base!.y);
    const numerator = await formula.locator('.formula-numerator').boundingBox();
    const denominator = await formula.locator('.formula-denominator').boundingBox();
    expect(numerator!.y + numerator!.height).toBeLessThanOrEqual(denominator!.y);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-settings-model-${theme ? 'light' : 'dark'}.png`, fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await formula.scrollIntoViewIfNeeded();
    expect(await formula.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(formula.locator('.formula-denominator')).toBeVisible();
  });
}
