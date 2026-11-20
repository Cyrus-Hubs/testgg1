import { expect, test, type Page } from '@playwright/test'

function track(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

async function overflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

async function playShift(page: Page) {
  await page.goto('/?e2e=1')
  await expect(page.getByTestId('lobby')).toBeVisible()
  await expect(page.getByTestId('logo')).toContainText('สแกมโอเอส')
  await page.getByTestId('lang-en').click()
  await expect(page.getByTestId('solo-shift')).toHaveText('Solo Shift')
  await page.getByTestId('player-name').fill('Bee')
  await page.getByTestId('solo-shift').click()
  await expect(page.getByTestId('desktop')).toBeVisible()
  await expect(page.getByTestId('incoming-call')).toBeVisible()
  await page.getByTestId('answer-call').click()
  const trust1 = Number(await page.getByTestId('trust-value').innerText())
  await page.getByTestId('quick-flattery').click()
  await expect.poll(async () => Number(await page.getByTestId('trust-value').innerText())).toBeGreaterThan(trust1)
  await page.getByTestId('quick-ask').click()
  await expect(page.getByTestId('transcript')).toContainText(/DUCK-/)
  const transcript = await page.getByTestId('transcript').innerText()
  const match = transcript.match(/DUCK-[A-Z0-9]{2}-[A-Z0-9]{2}/)
  expect(match?.[0]).toBeTruthy()
  if (await page.getByTestId('tab-apps').count()) {
    await page.getByTestId('tab-apps').click()
    await expect(page.getByTestId('tab-phone')).toBeVisible()
    await page.getByTestId('tab-phone').click()
    await expect(page.getByTestId('transcript')).toBeVisible()
    await page.getByTestId('tab-apps').click()
  } else {
    await page.getByTestId('icon-giftcard').click()
  }
  await page.getByTestId('gift-code').fill(match?.[0] ?? '')
  await page.getByTestId('gift-redeem').click()
  await expect.poll(async () => Number(await page.getByTestId('quota-progress').innerText())).toBeGreaterThan(0)
  await page.getByTestId('end-shift').click()
  await page.getByTestId('confirm-end').click()
  await expect(page.getByTestId('shift-result')).toBeVisible()
}

test('desktop lobby switches language and a solo shift clears quota', async ({ page }) => {
  const errors = track(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await playShift(page)
  expect(errors).toEqual([])
})

test('mobile viewport plays the shift without horizontal overflow', async ({ page }) => {
  const errors = track(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?e2e=1')
  expect(await overflow(page)).toBeLessThanOrEqual(1)
  await playShift(page)
  expect(await overflow(page)).toBeLessThanOrEqual(1)
  expect(errors).toEqual([])
})

test('two browsers share a room code', async ({ browser }) => {
  const hostContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const guestContext = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const host = await hostContext.newPage()
  const guest = await guestContext.newPage()
  const errors = [...track(host), ...track(guest)]
  await host.goto('/?e2e=1')
  await host.getByTestId('lang-en').click()
  await host.getByTestId('player-name').fill('Hosty')
  await host.getByTestId('create-room').click()
  await expect(host.getByTestId('room-lobby')).toBeVisible()
  const code = (await host.getByTestId('room-code').innerText()).trim()
  expect(code).toMatch(/^[A-Z0-9]{6}$/)
  expect(await overflow(host)).toBeLessThanOrEqual(1)
  await guest.goto(`/?e2e=1&room=${code}`)
  await guest.getByTestId('lang-en').click()
  await guest.getByTestId('player-name').fill('Joiny')
  await guest.getByTestId('join-room').click()
  await expect(host.getByText('Joiny')).toBeVisible()
  await host.getByTestId('start-shift').click()
  await expect(host.getByTestId('incoming-call')).toBeVisible()
  await expect(guest.getByTestId('incoming-call')).toBeVisible()
  expect(errors).toEqual([])
  await hostContext.close()
  await guestContext.close()
})
