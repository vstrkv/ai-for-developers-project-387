import { test, expect } from '@playwright/test'

test.describe('Guest flows', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.get('/api/owner/event-types')
    const types = await res.json()
    for (const t of types) {
      await page.request.delete(`/api/owner/event-types/${t.id}`)
    }
  })

  test('1: empty state — no event types', async ({ page }) => {
    await page.goto('/guest')
    await expect(page.getByRole('heading', { name: 'Guest Area' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Event Types' })).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(0)
  })

  test('2: view event types and available slots', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Consultation', description: '30 min call', durationMinutes: 30 },
    })

    await page.goto('/guest')
    await expect(page.getByRole('cell', { name: 'Consultation' })).toBeVisible()
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Available Slots' })).toBeVisible()

    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })
    const timeSlots = page.locator('button:has-text(":")')
    await expect(timeSlots.first()).toBeVisible()
  })

  test('3: book a slot', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Workshop', description: '60 min session', durationMinutes: 60 },
    })

    await page.goto('/guest')
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Available Slots' })).toBeVisible()
    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })

    await page.locator('button:has-text(":")').first().click()
    await expect(page.getByRole('dialog', { name: 'New Booking' })).toBeVisible()
    await page.getByLabel('Name').fill('Alice Smith')
    await page.getByLabel('Email').fill('alice@test.com')
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Alice Smith' })).toBeVisible()
  })

  test('4: booked slot is removed from available list', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Briefing', description: '60 min', durationMinutes: 60 },
    })

    await page.goto('/guest')
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Available Slots' })).toBeVisible()
    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })

    const slotText = await page.locator('button:has-text(":")').first().textContent()

    await page.locator('button:has-text(":")').first().click()
    await page.getByLabel('Name').fill('Bob Jones')
    await page.getByLabel('Email').fill('bob@test.com')
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.getByRole('cell', { name: 'Bob Jones' })).toBeVisible()

    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })
    await expect(page.getByRole('button', { name: slotText!.trim() })).toHaveCount(0)
  })
})
