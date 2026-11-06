import { expect, test } from '@playwright/test'

const KEY = 'cpp-tour-progress-v1'
const stored = (page: import('@playwright/test').Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY)

test('home page renders with all courses linked', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page).toHaveTitle(/.+/)
  for (const base of ['/tour', '/go', '/java', '/python', '/data', '/ml', '/dl', '/systems', '/intro'])
    await expect(page.locator(`a[href="${base}"]`).first()).toBeAttached()
  expect(errors).toEqual([])
})

test('prerendered deep link has content before hydration', async ({ request }) => {
  const res = await request.get('/tour/module-1')
  expect(res.ok()).toBe(true)
  const html = await res.text()
  expect(html).not.toContain('<div id="root"></div>')
  expect(html).toContain('rel="canonical"')
})

test('client-side navigation into a lesson records progress and survives reload', async ({ page }) => {
  await page.goto('/tour')
  await page.locator('a[href="/tour/module-1"]').first().click()
  await expect(page).toHaveURL(/\/tour\/module-1$/)
  await expect.poll(() => stored(page)).toMatchObject({ lessons: { 'm1:l0': true } })
  await page.reload()
  await expect.poll(() => stored(page)).toMatchObject({ lessons: { 'm1:l0': true } })
})

test('corrupt saved progress does not break the app', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript((k) => localStorage.setItem(k, '{not json'), KEY)
  await page.goto('/tour/module-1')
  await expect(page.locator('#root')).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('unavailable localStorage does not break the app', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied') } })
  })
  await page.goto('/go')
  await expect(page.locator('#root')).not.toBeEmpty()
  expect(errors).toEqual([])
})

test('mobile viewport renders a lesson', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/tour/module-1')
  await expect(page.locator('#root')).not.toBeEmpty()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})
