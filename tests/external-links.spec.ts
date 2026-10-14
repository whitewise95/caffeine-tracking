import { expect, test, type Page } from '@playwright/test';
import { installTossHost } from './helpers/tossHost';

async function externalURLs(page: Page): Promise<string[]> {
  return page.evaluate(() => Reflect.get(window, 'testExternalURLs') as string[]);
}

test('all Toss research sources open through the native API without replacing the mini-app', async ({ page, context }) => {
  await installTossHost(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/knowledge');
  await page.locator('.knowledge-faq summary').first().tap();
  const opened: string[] = [];
  for (const link of await page.locator('.knowledge-faq').first().getByRole('link').all()) {
    opened.push((await link.getAttribute('href'))!);
    await link.tap();
    await expect.poll(() => externalURLs(page)).toEqual(opened);
    await expect(page).toHaveURL(/\/knowledge$/);
  }
  await page.getByText('추정치는 이렇게 계산해요', { exact: true }).click();
  await page.getByText('계산에 사용하는 값', { exact: true }).click();
  const formulaSource = page.getByRole('link', { name: '성인 대상 연구', exact: true });
  opened.push((await formulaSource.getAttribute('href'))!);
  await formulaSource.tap();
  await expect.poll(() => externalURLs(page)).toEqual(opened);
  await expect(page).toHaveURL(/\/knowledge$/);
  await page.getByRole('navigation').getByRole('button', { name: '지식', exact: true }).tap();
  for (const faq of await page.locator('.knowledge-faq').all()) {
    if (await faq.getAttribute('open') === null) await faq.locator('summary').tap();
    for (const source of await faq.getByRole('link').all()) {
      opened.push((await source.getAttribute('href'))!);
      await source.tap();
      await expect.poll(() => externalURLs(page)).toEqual(opened);
      await expect(page).toHaveURL(/\/knowledge$/);
    }
  }
  expect(context.pages()).toHaveLength(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('failed native browser launch stays in the app and lets the user retry the link', async ({ page, context }) => {
  await installTossHost(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/knowledge');
  const faq = page.locator('.knowledge-faq').first();
  await faq.locator('summary').tap();
  const link = faq.getByRole('link').first();
  const url = (await link.getAttribute('href'))!;
  await page.evaluate(() => Reflect.set(window, 'testFailNextExternalURL', true));
  await link.tap();
  await expect(faq.getByRole('alert')).toHaveText('외부 브라우저를 열지 못했어요. 링크를 다시 눌러 주세요.');
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(faq).toHaveAttribute('open', '');
  expect(context.pages()).toHaveLength(1);
  await link.tap();
  await expect.poll(() => externalURLs(page)).toEqual([url, url]);
  await expect(faq.getByRole('alert')).toHaveCount(0);
});

for (const sourceType of ['half-life', 'calculation']) {
  test(`browser research from knowledge ${sourceType} still opens a new tab`, async ({ page, context }) => {
    await context.route('https://pubmed.ncbi.nlm.nih.gov/**', route => route.fulfill({ body: '<title>Research source</title>' }));
    await context.route('https://www.efsa.europa.eu/**', route => route.fulfill({ body: '<title>Research source</title>' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/knowledge');
    if (sourceType === 'half-life') await page.locator('.knowledge-faq summary').first().tap();
    else {
      await page.getByText('추정치는 이렇게 계산해요', { exact: true }).click();
      await page.getByText('계산에 사용하는 값', { exact: true }).click();
    }
    const source = page.getByRole('link').first();
    const url = (await source.getAttribute('href'))!;
    const popupPromise = page.waitForEvent('popup');
    await source.tap();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(url);
    expect(new URL(page.url()).pathname).toBe('/knowledge');
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.close();
  });
}
