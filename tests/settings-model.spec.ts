import { expect, test } from '@playwright/test';

for (const theme of ['']) {
  test(`knowledge explains half-life with research sources and legible absorption formula at enlarged text ${theme || 'dark'}`, async ({ page }, testInfo) => {
    await page.goto(`/knowledge${theme}`);
    const halfLife = page.locator('.knowledge-faq').first();
    const calculation = page.locator('.knowledge-model');
    await expect(halfLife).not.toHaveAttribute('open');
    await expect(calculation).not.toHaveAttribute('open');
    await expect(page.getByTestId('half-life-description')).not.toBeVisible();
    await expect(page.getByRole('math')).not.toBeVisible();
    await expect(halfLife.locator(':scope > summary')).toHaveText('반감기가 뭐예요?');
    await expect(calculation.locator(':scope > summary')).toHaveText('추정치는 이렇게 계산해요');
    const halfLifeSummary = halfLife.locator(':scope > summary');
    await halfLifeSummary.focus();
    await page.keyboard.press('Enter');
    await expect(halfLife).toHaveAttribute('open', '');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('half-life-description')).not.toBeVisible();
    await halfLifeSummary.click();
    await expect(page.getByTestId('half-life-description')).toContainText('지금 카페인에서는 반감기를 4시간 30분으로 두고 잔존량을 추정해요.');
    await expect(halfLifeSummary).toBeVisible();
    await expect(page.getByText('몸에 남아 있는 카페인이 절반으로 줄어드는 데 걸리는 시간이에요.', { exact: false })).toBeVisible();
    await expect(page.getByText(/EFSA.*약 4시간.*2~8시간/)).toBeVisible();
    await expect(page.getByText(/성인 남성 59명.*4.3시간/)).toBeVisible();
    await expect(halfLife.getByRole('link', { name: /Seng/ })).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/19125908/');
    await expect(page.getByTestId('half-life-value')).toHaveCount(0);
    await expect(page.getByRole('slider')).toHaveCount(0);
    await calculation.locator(':scope > summary').click();
    const formula = page.getByRole('math');
    await expect(formula).toHaveAccessibleName(/ka.*ke.*흡수 속도 상수.*감소 속도 상수/);
    const base = await formula.locator('.formula-base').first().boundingBox();
    const exponent = await formula.locator('sup').first().boundingBox();
    expect(exponent!.y).toBeLessThan(base!.y);
    const numerator = await formula.locator('.formula-numerator').boundingBox();
    const denominator = await formula.locator('.formula-denominator').boundingBox();
    expect(numerator!.y + numerator!.height).toBeLessThanOrEqual(denominator!.y);
    await page.getByText('계산에 사용하는 값', { exact: true }).click();
    await expect(page.getByText('흡수 속도 상수 4.54 /시간', { exact: true })).toBeVisible();
    await expect(page.getByText('감소 속도 상수 ln(2) ÷ 반감기', { exact: false })).toContainText('0.154 /시간');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-knowledge-model-${theme ? 'light' : 'dark'}.png`, fullPage: true });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    await formula.scrollIntoViewIfNeeded();
    expect(await formula.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(formula.locator('.formula-denominator')).toBeVisible();
    await expect(page.getByText('흡수 속도 상수 4.54 /시간', { exact: true })).toBeVisible();
  });
}
