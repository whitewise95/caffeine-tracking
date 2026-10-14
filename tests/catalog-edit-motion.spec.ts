import { expect, test } from '@playwright/test'
import { createInitialState } from '../src/features/caffeine/model/caffeine'

test('edit badges wiggle briefly, stop on interaction, and allow immediate dragging', async ({ page }) => {
  await page.addInitScript(state => localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)), createInitialState())
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  const editor = page.locator('.catalog-editor')
  const badge = page.locator('[data-layout-drink="americano"] .catalog-drink-details')
  await expect(badge).toHaveCSS('animation-name', 'catalog-edit-wiggle')
  await expect(editor).not.toHaveClass(/is-edit-intro/, { timeout: 4000 })
  await expect(badge).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  await expect(badge).toHaveCSS('animation-name', 'catalog-edit-wiggle')
  const source = (await page.locator('[data-layout-drink="americano"] .catalog-drink-surface').boundingBox())!
  const target = (await page.locator('[data-layout-heading="tea"]').boundingBox())!
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
  await page.mouse.down()
  await expect(badge).toHaveCSS('animation-name', 'none')
  await page.mouse.move(target.x + 10, target.y + target.height / 2)
  await page.mouse.up()
  await expect(page.locator('[data-layout-category="tea"] [data-layout-drink="americano"]')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).defaultDrinkCategoryOverrides)).toBeUndefined()
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).defaultDrinkCategoryOverrides.americano)).toBe('tea')
})

test('reduced motion suppresses the edit wiggle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  await expect(page.locator('.catalog-editor')).toHaveClass(/is-editing/)
  const names = await page.locator('.catalog-drink-details').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationName))
  expect(names.every(name => name === 'none')).toBe(true)
})
