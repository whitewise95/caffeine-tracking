import { expect, test } from '@playwright/test'
import { createInitialState } from '../src/features/caffeine/model/caffeine'

test('catalog changes preview locally, reset or cancel, and persist only after done', async ({ page }) => {
  await page.addInitScript(state => { if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)) }, createInitialState())
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  const rename = async (name: string) => {
    await page.getByRole('button', { name: '커피 카테고리 이름 변경', exact: true }).click()
    await page.getByLabel('카테고리 이름', { exact: true }).fill(name)
    await page.getByRole('button', { name: '카테고리 이름 저장', exact: true }).click()
    await expect(page.getByRole('heading', { name: new RegExp(`^${name}`) })).toBeVisible()
  }
  await rename('내 커피')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).categoryCatalog)).toBeUndefined()
  await page.getByRole('button', { name: '초기화', exact: true }).click()
  await expect(page.getByRole('button', { name: '커피 카테고리 이름 변경', exact: true })).toBeVisible()
  await rename('취소할 이름')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  await rename('저장할 이름')
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).categoryCatalog[0].name)).toBe('저장할 이름')
  await page.reload()
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await expect(page.getByRole('heading', { name: '저장할 이름', exact: true })).toBeVisible()
})

test('a group of catalog changes saves once, keeps history, and remains available after a failed commit', async ({ page }) => {
  const initial = createInitialState()
  initial.entries = [{ id: 'record', drinkId: 'americano', drinkName: '기록 당시 커피', icon: 'coffee', caffeineMg: 150, consumedAt: '2026-10-12T01:00:00Z' }]
  await page.addInitScript(state => { if (!localStorage.getItem('caffeine-tracker:state:v1')) localStorage.setItem('caffeine-tracker:state:v1', JSON.stringify(state)) }, initial)
  await page.goto('/')
  await page.getByRole('button', { name: '카페인 추가', exact: true }).click()
  await page.getByRole('button', { name: '편집', exact: true }).click()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Reflect.set(window, 'catalogWrites', 0)
    Storage.prototype.setItem = function (key, value) {
      if (key === 'caffeine-tracker:state:v1') {
        const count = Number(Reflect.get(window, 'catalogWrites')) + 1
        Reflect.set(window, 'catalogWrites', count)
        if (count === 1) throw new DOMException('full', 'QuotaExceededError')
      }
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: '아메리카노 음료 삭제', exact: true }).click()
  await page.getByRole('button', { name: '삭제하기', exact: true }).click()
  await page.getByRole('button', { name: '카테고리 추가', exact: true }).click()
  await page.getByLabel('카테고리 이름', { exact: true }).fill('임시 카테고리')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByRole('button', { name: '임시 카테고리에 내 음료 추가', exact: true }).click()
  await page.getByLabel('메뉴명', { exact: true }).fill('새 음료')
  await page.getByRole('button', { name: '다음', exact: true }).click()
  await page.getByLabel('카페인량 mg', { exact: true }).fill('80')
  await page.getByRole('button', { name: '음료 저장', exact: true }).click()
  await expect(page.getByRole('button', { name: '새 음료 음료 편집', exact: true })).toBeVisible()
  expect(await page.evaluate(() => Reflect.get(window, 'catalogWrites'))).toBe(0)
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '새 음료 음료 편집', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!).customDrinks)).toEqual([])
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await expect(page.getByRole('button', { name: '편집', exact: true })).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('caffeine-tracker:state:v1')!))
  expect(saved.customDrinks[0]).toMatchObject({ name: '새 음료', caffeineMg: 80 })
  expect(saved.deletedDefaultDrinkIds).toContain('americano')
  expect(saved.entries).toEqual(initial.entries)
  expect(await page.evaluate(() => Reflect.get(window, 'catalogWrites'))).toBe(2)
})
