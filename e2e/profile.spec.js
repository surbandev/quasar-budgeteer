import { test, expect } from '@playwright/test'

test.describe('Profile Management', () => {
  test('sign in and add a new profile', async ({ page }) => {
    // Navigate to login page
    await page.goto('/#/login')

    // Fill in credentials
    await page.locator('input[placeholder="Enter username"]').fill('surban')
    await page.locator('input[placeholder="Enter password"]').fill('tacos')

    // Click the LOGIN button
    await page.getByRole('button', { name: 'LOGIN' }).click()

    // Wait for redirect to overview after successful login
    await page.waitForURL('**/#/overview')
    await expect(page).toHaveURL(/\/#\/overview/)

    // Navigate to Profile Settings
    await page.goto('/#/profile-settings')
    await expect(page).toHaveURL(/\/#\/profile-settings/)

    // Click "Add New Profile" button
    await page.getByRole('button', { name: 'Add New Profile' }).click()

    // Wait for the dialog to appear
    await expect(page.locator('.dialog-card')).toBeVisible()
    await expect(page.getByText('Add New Profile').first()).toBeVisible()

    // Fill in the profile form
    await page.locator('input[placeholder="Enter first name"]').fill('Test')
    await page.locator('input[placeholder="Enter last name"]').fill('User')
    await page.locator('input[placeholder="Enter email address"]').fill('test@example.com')
    await page.locator('input[placeholder="Enter phone number"]').fill('1234567890')

    // Submit the form
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify the success notification appears
    await expect(page.getByText('Profile added successfully')).toBeVisible()

    // Verify the new profile appears in the list
    await expect(page.getByText('Test User')).toBeVisible()

    // Click the delete button on the Test User profile card
    const profileCard = page.locator('.profile-card', { hasText: 'Test User' })
    await profileCard.locator('.delete-button').click()

    // Confirm deletion in the Quasar dialog
    await expect(page.getByText('Are you sure you want to delete Test User?')).toBeVisible()
    await page.getByRole('button', { name: 'OK' }).click()

    // Verify the Test User profile card is fully removed from the DOM
    await expect(profileCard).not.toBeAttached({ timeout: 10000 })
  })
})
