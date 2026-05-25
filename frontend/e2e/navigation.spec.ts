import { test, expect } from '@playwright/test'

test.describe('Navigation and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.get('/api/owner/event-types')
    const types = await res.json()
    for (const t of types) {
      await page.request.delete(`/api/owner/event-types/${t.id}`)
    }
  })

  test('9: navigation between pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Calendar Booking')

    await page.getByRole('link', { name: 'Guest', exact: true }).first().click()
    await expect(page.getByRole('heading', { name: 'Guest Area' })).toBeVisible()

    await page.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page.locator('h1')).toContainText('Calendar Booking')

    await page.getByRole('link', { name: 'Owner', exact: true }).first().click()
    await expect(page.getByRole('heading', { name: 'Owner Area' })).toBeVisible()
  })

  test('10: home page shows navigation cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Calendar Booking')
    await expect(page.getByText('Guest Area')).toBeVisible()
    await expect(page.getByText('Owner Area')).toBeVisible()
    await expect(page.getByText('Choose a section to get started')).toBeVisible()
  })

  test('11: slots respect event type duration (60 min)', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Long Session', description: '60 min each', durationMinutes: 60 },
    })

    await page.goto('/guest')
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Available Slots' })).toBeVisible()

    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })

    const timeSlots = page.locator('button:has-text(":")')
    await expect(timeSlots.first()).toBeVisible()
    const slotText = await timeSlots.first().textContent()
    // Slot text format: "HH:MM AM — HH:MM AM" — verify 60-min duration
    expect(slotText).toMatch(/\d+:\d+ [AP]M — \d+:\d+ [AP]M/)
  })
})
