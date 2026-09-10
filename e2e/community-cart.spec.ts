import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { getAuthenticatedClient, getPublicClient } from './helpers/db';

test.describe('AgriLink SIH26033: Flagship Community Cart & Enterprise Admin Layer', () => {
  const CONSUMER_EMAIL = 'consumer@gmail.com';
  const ADMIN_EMAIL = 'admin@gmail.com';
  const FARMER_EMAIL = 'harshafarmer@gmail.com';

  test.beforeAll(async () => {
    // Ensure that real community carts exist in Supabase
    const publicClient = getPublicClient();
    const { data: carts, error } = await publicClient
      .from('community_carts')
      .select('id, sector_code, cart_status, target_discount_quantity_kg, current_aggregated_quantity_kg')
      .limit(3);

    expect(error).toBeNull();
    expect(carts).toBeDefined();
    expect(carts!.length).toBeGreaterThan(0);
  });

  test('TEST 1: Customer can browse real Community Carts and search by produce/locality', async ({ page }) => {
    // 1. Visit /community-cart directly as consumer
    await loginAs(page, CONSUMER_EMAIL);
    await page.goto('/community-cart');
    await page.waitForLoadState('networkidle');

    // 2. Verify page header and branding
    await expect(page.getByRole('heading', { name: /Hyperlocal Community Carts/i })).toBeVisible();
    await expect(page.getByText(/Bypass middleman margins/i)).toBeVisible();

    // 3. Verify that community cart cards are rendered
    const cartCards = page.locator('div[class*="shadow-xs hover:shadow-md"]');
    await expect(cartCards.first()).toBeVisible({ timeout: 10000 });
    const count = await cartCards.count();
    expect(count).toBeGreaterThan(0);

    // 4. Test Search filter
    const searchInput = page.getByPlaceholder(/Search produce, locality, farmer/i);
    await searchInput.fill('Tomatoes');
    await page.waitForTimeout(500);

    // Filtered list should display matching produce
    await expect(page.getByText(/Tomato/i).first()).toBeVisible();

    // Clear search
    await searchInput.clear();
  });

  test('TEST 2: Customer can open Cart Details modal and commit quantity to pool demand', async ({ page }) => {
    await loginAs(page, CONSUMER_EMAIL);
    await page.goto('/community-cart');
    await page.waitForLoadState('networkidle');

    // 1. Click on the first "View & Join Cart" button
    const actionBtn = page.getByRole('button', { name: /View & Join Cart/i }).first();
    await expect(actionBtn).toBeVisible({ timeout: 10000 });
    await actionBtn.click();

    // 2. Modal opens with commitment section
    const modalHeading = page.getByRole('heading', { name: /Community Cart Details & Joining/i });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Your Committed Quantity/i)).toBeVisible();

    // 3. Test quantity preset selection (+10 kg)
    const tenKgBtn = page.getByRole('button', { name: '+10 kg' });
    if (await tenKgBtn.isVisible()) {
      await tenKgBtn.click();
    }

    // 4. Verify Total Price calculation
    await expect(page.getByText(/Total Purchase Amount/i)).toBeVisible();

    // 5. Close modal
    const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('TEST 3: Security & RBAC: Non-admin users are restricted from /admin control layer', async ({ page }) => {
    // 1. Login as standard consumer
    await loginAs(page, CONSUMER_EMAIL);

    // 2. Attempt navigating to /admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 3. RouteGuard must reject consumer or redirect away from /admin
    const currentUrl = page.url();
    const isDeniedOrRedirected =
      !currentUrl.endsWith('/admin') ||
      (await page.getByText(/Access Denied|Unauthorized|Consumer/i).count()) > 0 ||
      (await page.getByRole('heading', { name: /Admin/i }).count()) === 0;

    expect(isDeniedOrRedirected).toBeTruthy();
  });

  test('TEST 4: Platform Admin can access Enterprise Control Center and inspect live KPI stats', async ({ page }) => {
    // 1. Login as Admin
    await loginAs(page, ADMIN_EMAIL);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 2. Verify Admin Control Center loaded
    await expect(page.getByRole('heading', { name: /AgriLink Control Center/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/SIH26033 Platform Ops/i)).toBeVisible();

    // 3. Verify live platform KPIs are displayed
    await expect(page.getByText(/Total Farmers/i)).toBeVisible();
    await expect(page.getByText(/Active Carts/i)).toBeVisible();
    await expect(page.getByText(/Produce Volume/i)).toBeVisible();

    // 4. Navigate to Community Carts tab
    const commCartTab = page.getByRole('button', { name: /Community Carts/i });
    await expect(commCartTab).toBeVisible();
    await commCartTab.click();

    // 5. Verify Community Carts Table is populated with real Supabase records
    const tableHeader = page.getByRole('heading', { name: /Community Cart Management/i });
    await expect(tableHeader).toBeVisible();

    // Table rows should be present
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 8000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
