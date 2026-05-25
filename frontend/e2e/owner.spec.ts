import { test, expect } from '@playwright/test'

test.describe('Owner flows', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.get('/api/owner/event-types')
    const types = await res.json()
    for (const t of types) {
      await page.request.delete(`/api/owner/event-types/${t.id}`)
    }
  })

  test('5: create an event type', async ({ page }) => {
    await page.goto('/owner')
    await expect(page.getByRole('heading', { name: 'Owner Area' })).toBeVisible()

    await page.getByRole('button', { name: '+ Create' }).click()
    await expect(page.getByRole('dialog', { name: 'Create Event Type' })).toBeVisible()

    await page.getByLabel('Title').fill('Team Standup')
    await page.getByLabel('Description').fill('Daily 15-min standup')
    await page.getByLabel('Duration (min)').fill('15')
    await page.getByRole('button', { name: 'Create', exact: true }).click()

    await expect(page.getByRole('cell', { name: 'Team Standup' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Daily 15-min standup' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '15 min' })).toBeVisible()
  })

  test('6: edit an event type', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'Old Title', description: 'Old desc', durationMinutes: 30 },
    })

    await page.goto('/owner')
    await expect(page.getByRole('cell', { name: 'Old Title' })).toBeVisible()
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('dialog', { name: 'Edit Event Type' })).toBeVisible()

    await page.getByLabel('Title').fill('New Title')
    await page.getByLabel('Description').fill('New desc')
    await page.getByLabel('Duration (min)').fill('45')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('cell', { name: 'New Title' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'New desc' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '45 min' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Old Title' })).toHaveCount(0)
  })

  test('7: delete an event type', async ({ page }) => {
    await page.request.post('/api/owner/event-types', {
      data: { title: 'To Delete', description: 'Will be removed', durationMinutes: 30 },
    })

    await page.goto('/owner')
    await expect(page.getByRole('cell', { name: 'To Delete' })).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByRole('cell', { name: 'To Delete' })).toHaveCount(0)
  })

  test('8: view bookings in calendar', async ({ page }) => {
    const etRes = await page.request.post('/api/owner/event-types', {
      data: { title: 'Calendar Test', description: 'Check calendar view', durationMinutes: 30 },
    })
    const et = await etRes.json()

    const slotsRes = await page.request.get(`/api/guest/event-types/${et.id}/slots`)
    const slots = await slotsRes.json()

    await page.request.post('/api/guest/bookings', {
      data: {
        eventTypeId: et.id,
        guestName: 'Calendar Guest',
        guestEmail: 'calendar@test.com',
        startTime: slots[0].startTime,
      },
    })

    await page.goto('/owner')
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible()
    await expect(page.getByText('Calendar Guest').first()).toBeVisible()
  })
})
