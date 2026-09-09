import { Page, expect } from '@playwright/test';

export async function loginAs(
  page: Page,
  email: string,
  password = 'password123'
) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials using input types
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Submit login form
  await page.getByRole('button', { name: /Sign In/i }).click();

  // Wait for redirect out of login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  const signOutBtn = page.getByRole('button', { name: 'Sign Out' });
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  }
}
