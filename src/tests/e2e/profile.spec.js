import { test, expect } from '@playwright/test'

// Credentials come from the environment so the real password is never committed.
// Set E2E_PASSWORD (and optionally E2E_USERNAME) before running the e2e suite.
const E2E_USERNAME = process.env.E2E_USERNAME ?? 'surban'
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? ''

test.describe('Profile Management', () => {
  test('sign in and add a new profile', async ({ page }) => {
    test.skip(!E2E_PASSWORD, 'Set E2E_PASSWORD to run the sign-in e2e test')

    await page.goto('/login')

    await page.locator('input[placeholder="Enter username"]').fill(E2E_USERNAME)
    await page.locator('input[placeholder="Enter password"]').fill(E2E_PASSWORD)
    await page.getByRole('button', { name: 'LOGIN' }).click()

    await page.waitForURL('**/overview')
    await expect(page).toHaveURL(/\/overview/)

    await page.goto('/profile-settings')
    await expect(page).toHaveURL(/\/profile-settings/)

    await page.getByRole('button', { name: 'Add New Profile' }).click()

    await expect(page.locator('.dialog-card')).toBeVisible()
    await expect(page.getByText('Add New Profile').first()).toBeVisible()

    await page.locator('input[placeholder="Enter first name"]').fill('Test')
    await page.locator('input[placeholder="Enter last name"]').fill('User')
    await page.locator('input[placeholder="Enter email address"]').fill('test@example.com')
    await page.locator('input[placeholder="Enter phone number"]').fill('1234567890')

    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Profile added successfully')).toBeVisible()
    await expect(page.getByText('Test User')).toBeVisible()

    const profileCard = page.locator('.profile-card', { hasText: 'Test User' })
    await profileCard.locator('.delete-button').click()

    await expect(page.getByText('Are you sure you want to delete Test User?')).toBeVisible()
    await page.getByRole('button', { name: 'OK' }).click()

    await expect(profileCard).not.toBeAttached({ timeout: 10000 })
  })
})
