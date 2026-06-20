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

  test('2: view event types and timeline', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Consultation', description: '30 min call', durationMinutes: 30 },
    })

    await page.goto('/guest')
    await expect(page.getByRole('cell', { name: 'Consultation' })).toBeVisible()
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Consultation' })).toBeVisible()

    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })
    const timeline = page.locator('[data-testid="timeline-column"]')
    await expect(timeline.first()).toBeVisible()
  })

  test('3: book a slot via timeline', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Workshop', description: '60 min session', durationMinutes: 60 },
    })

    await page.goto('/guest')
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Workshop' })).toBeVisible()
    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })

    const timeline = page.locator('[data-testid="timeline-column"]')
    await timeline.first().click({ position: { x: 30, y: 80 } })

    await expect(page.getByRole('dialog', { name: 'New Booking' })).toBeVisible()
    await page.getByLabel('Name').fill('Alice Smith')
    await page.getByLabel('Email').fill('alice@test.com')
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Alice Smith' })).toBeVisible()
  })

  test('4: booked slot shows as busy in timeline', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Briefing', description: '60 min', durationMinutes: 60 },
    })

    await page.goto('/guest')
    await page.getByRole('button', { name: 'View' }).click()
    await expect(page.getByRole('heading', { name: 'Briefing' })).toBeVisible()
    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })

    const timeline = page.locator('[data-testid="timeline-column"]')
    await timeline.first().click({ position: { x: 30, y: 80 } })

    await page.getByLabel('Name').fill('Bob Jones')
    await page.getByLabel('Email').fill('bob@test.com')
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.getByRole('cell', { name: 'Bob Jones' })).toBeVisible()

    await expect(page.locator('.mantine-Loader-root')).toHaveCount(0, { timeout: 10000 })
    await expect(page.locator('text=Busy').first()).toBeVisible()
  })
})
