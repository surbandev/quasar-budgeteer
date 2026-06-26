import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test('sign in and add a new profile', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input[placeholder="Enter username"]').fill('surban')
    await page.locator('input[placeholder="Enter password"]').fill('tacos')
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
