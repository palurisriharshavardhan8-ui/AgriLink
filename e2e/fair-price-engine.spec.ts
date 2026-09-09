import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import {
  calculateFairPrice,
  lookupMandiRate,
  SEEDED_MANDI_RATES,
} from '../src/lib/services/fairPrice';

test.describe('AgriLink Fair Price Engine (SIH26033)', () => {
  const FARMER_EMAIL = 'harshafarmer@gmail.com';

  // --------------------------------------------------------------------------
  // 1. DETERMINISTIC UNIT CALCULATION TESTS
  // --------------------------------------------------------------------------
  test('FAIR-PRICE 1: Seeded dataset contains valid APMC benchmarks with normalized per-kg rates', async () => {
    expect(SEEDED_MANDI_RATES.length).toBeGreaterThanOrEqual(10);

    for (const rate of SEEDED_MANDI_RATES) {
      expect(rate.modalPricePerQuintal).toBeGreaterThan(0);
      expect(rate.normalizedModalPerKg).toBe(rate.modalPricePerQuintal / 100);
      expect(rate.normalizedMinPerKg).toBe(rate.minPricePerQuintal / 100);
      expect(rate.normalizedMaxPerKg).toBe(rate.maxPricePerQuintal / 100);
      expect(rate.source).toMatch(/APMC Mandi Price Index|Co-op Dairy Board Benchmark/);
      expect(rate.recordedDate).toBeTruthy();
    }
  });

  test('FAIR-PRICE 2: Calculation is 100% deterministic and reproducible for identical inputs', async () => {
    const input = {
      category: 'vegetables' as const,
      produceName: 'Fresh Tomatoes',
      quantityKg: 200,
    };

    const res1 = calculateFairPrice(input);
    const res2 = calculateFairPrice(input);

    expect(res1.suggestedPricePerKg).toBe(res2.suggestedPricePerKg);
    expect(res1.mandiBenchmarkPricePerKg).toBe(res2.mandiBenchmarkPricePerKg);
    expect(res1.directProducerMarginPerKg).toBe(res2.directProducerMarginPerKg);
    expect(res1.totalEstimatedFarmerPayout).toBe(res2.totalEstimatedFarmerPayout);
    expect(res1.mandiRate.id).toBe(res2.mandiRate.id);
  });

  test('FAIR-PRICE 3: Produce categories correctly scale volume tiers (Tomato 50kg, 200kg, 1000kg, Wheat, Turmeric)', async () => {
    // 1. Tomato 50kg -> retail_small (+10%)
    const tomato50 = calculateFairPrice({
      category: 'vegetables',
      produceName: 'Tomato',
      quantityKg: 50,
    });
    expect(tomato50.mandiBenchmarkPricePerKg).toBe(32.0);
    expect(tomato50.volumeTier).toBe('retail_small');
    expect(tomato50.volumeAdjustmentFactor).toBe(1.10);
    expect(tomato50.suggestedPricePerKg).toBe(35.0); // 32 * 1.10 = 35.2 -> rounded to 35.0

    // 2. Tomato 200kg -> standard (+8%)
    const tomato200 = calculateFairPrice({
      category: 'vegetables',
      produceName: 'Tomato',
      quantityKg: 200,
    });
    expect(tomato200.volumeTier).toBe('standard');
    expect(tomato200.volumeAdjustmentFactor).toBe(1.08);
    expect(tomato200.suggestedPricePerKg).toBe(34.5); // 32 * 1.08 = 34.56 -> rounded to 34.5

    // 3. Tomato 1000kg -> bulk_wholesale (+5%)
    const tomato1000 = calculateFairPrice({
      category: 'vegetables',
      produceName: 'Tomato',
      quantityKg: 1000,
    });
    expect(tomato1000.volumeTier).toBe('bulk_wholesale');
    expect(tomato1000.volumeAdjustmentFactor).toBe(1.05);
    expect(tomato1000.suggestedPricePerKg).toBe(33.5); // 32 * 1.05 = 33.6 -> rounded to 33.5

    // Verification: Tomato prices scale with volume: 50kg >= 200kg >= 1000kg
    expect(tomato50.suggestedPricePerKg).toBeGreaterThanOrEqual(tomato200.suggestedPricePerKg);
    expect(tomato200.suggestedPricePerKg).toBeGreaterThanOrEqual(tomato1000.suggestedPricePerKg);

    // 4. Wheat (Grains & Pulses)
    const wheat = calculateFairPrice({
      category: 'grains_pulses',
      produceName: 'Wheat',
      quantityKg: 500,
    });
    expect(wheat.mandiBenchmarkPricePerKg).toBe(26.5); // Khanna Mandi modal
    expect(wheat.suggestedPricePerKg).toBe(28.5); // 26.5 * 1.08 = 28.62 -> 28.5
    expect(wheat.mandiRate.mandiName).toContain('Khanna');

    // 5. Turmeric (Spices)
    const turmeric = calculateFairPrice({
      category: 'spices',
      produceName: 'Turmeric',
      quantityKg: 100,
    });
    expect(turmeric.mandiBenchmarkPricePerKg).toBe(135.0); // Nizamabad APMC modal
    expect(turmeric.suggestedPricePerKg).toBe(148.5); // 135 * 1.10 = 148.5
    expect(turmeric.mandiRate.mandiName).toContain('Nizamabad');
  });

  test('FAIR-PRICE 4: Transparent calculation basis outlines each pricing step with source attribution', async () => {
    const res = calculateFairPrice({
      category: 'fruits',
      produceName: 'Alphonso Mango',
      quantityKg: 300,
    });

    expect(res.calculationBasis.length).toBe(4);
    expect(res.calculationBasis[0].step).toContain('Agmarknet Benchmark Normalization');
    expect(res.calculationBasis[1].step).toContain('Direct Trade Surplus');
    expect(res.calculationBasis[2].step).toContain('Volume Efficiency');
    expect(res.calculationBasis[3].step).toContain('Buyer Direct Trade Value');

    expect(res.dataSourceLabel).toContain('Agmarknet APMC Mandi Benchmark');
    expect(res.isSeededDemoData).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. END-TO-END UI & MODAL INTERACTION TESTS
  // --------------------------------------------------------------------------
  test('FAIR-PRICE 5: Farmer can open modal, inspect Fair Price Engine card, and view calculation basis', async ({ page }) => {
    await loginAs(page, FARMER_EMAIL);

    // Navigate to farmer dashboard
    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Click "Create New Listing"
    await page.getByRole('button', { name: /Create New Listing/i }).click();

    // Verify modal is visible
    await expect(page.getByText('List Produce Batch')).toBeVisible();

    // Verify Fair Price Card is rendered inside the modal
    await expect(page.getByText('AgriLink Fair Price Engine')).toBeVisible();
    await expect(page.getByText(/SIH26033 Benchmark/i)).toBeVisible();
    await expect(page.getByText('Mandi Modal Benchmark')).toBeVisible();
    await expect(page.getByText('Suggested Fair Price', { exact: true })).toBeVisible();

    // Fill Produce Title
    const titleInput = page.getByLabel('Produce Title / Name');
    await titleInput.fill('Fresh Kolar Tomatoes');

    // Fill Quantity
    const qtyInput = page.getByLabel('Available Stock Quantity (kg)');
    await qtyInput.fill('200');

    // Expand transparent calculation basis
    const toggleBasisBtn = page.getByRole('button', { name: /Calculation Basis/i });
    await expect(toggleBasisBtn).toBeVisible();
    await toggleBasisBtn.click();

    // Verify calculation breakdown is visible
    await expect(page.getByText('Deterministic Pricing Breakdown')).toBeVisible();
    await expect(page.getByText(/Direct Trade Surplus/i)).toBeVisible();
    await expect(page.getByText(/Agmarknet APMC Mandi Benchmark/i)).toBeVisible();
  });

  test('FAIR-PRICE 6: Farmer can accept suggested fair price and verify inputs populate automatically', async ({ page }) => {
    await loginAs(page, FARMER_EMAIL);

    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.getByRole('button', { name: /Create New Listing/i }).click();
    await expect(page.getByText('List Produce Batch')).toBeVisible();

    // Set produce title and quantity
    await page.getByLabel('Produce Title / Name').fill('Tomato');
    await page.getByLabel('Available Stock Quantity (kg)').fill('200');

    // Locate the "Apply Suggested Fair Price" button
    const applyBtn = page.getByRole('button', { name: /Apply Suggested Fair Price/i });
    await expect(applyBtn).toBeVisible();

    // Click apply
    await applyBtn.click();

    // Verify input fields are populated
    const priceInput = page.getByLabel('Selling Price (₹ per kg)');
    const mandiInput = page.getByLabel('Mandi Benchmark (₹ per kg)');

    const priceVal = await priceInput.inputValue();
    const mandiVal = await mandiInput.inputValue();

    // Expected values for Tomato 200kg: suggested 34.5, benchmark 32
    expect(priceVal).toBe('34.5');
    expect(mandiVal).toBe('32');

    // Verify UI reflects "Fair Price Applied" badge
    await expect(page.getByText('Fair Price Applied', { exact: true })).toBeVisible();
  });

  test('FAIR-PRICE 7: Farmer can manually override price and UI reflects custom price override state', async ({ page }) => {
    await loginAs(page, FARMER_EMAIL);

    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.getByRole('button', { name: /Create New Listing/i }).click();

    // Set title and quantity
    await page.getByLabel('Produce Title / Name').fill('Tomato');
    await page.getByLabel('Available Stock Quantity (kg)').fill('100');

    // Accept recommendation first
    await page.getByRole('button', { name: /Apply Suggested Fair Price/i }).click();
    await expect(page.getByText('Fair Price Applied', { exact: true })).toBeVisible();

    // Now manually edit the price
    const priceInput = page.getByLabel('Selling Price (₹ per kg)');
    await priceInput.fill('45');

    // Verify "Custom Price" override indicator appears
    await expect(page.getByText(/Custom Price: ₹45\/kg/i)).toBeVisible();

    // Mandi benchmark should still be preserved
    const mandiInput = page.getByLabel('Mandi Benchmark (₹ per kg)');
    expect(await mandiInput.inputValue()).toBe('32');
  });

  test('FAIR-PRICE 8: Creating a listing persists the fair price and displays benchmark savings on Marketplace', async ({ page }) => {
    await loginAs(page, FARMER_EMAIL);

    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.getByRole('button', { name: /Create New Listing/i }).click();

    const uniqueBatchTitle = `Kolar Test Tomatoes ${Date.now()}`;
    await page.getByLabel('Produce Title / Name').fill(uniqueBatchTitle);
    await page.getByLabel('Available Stock Quantity (kg)').fill('150');

    // Apply Fair Price
    await page.getByRole('button', { name: /Apply Suggested Fair Price/i }).click();

    // Submit the form
    await page.getByRole('button', { name: /Publish Listing/i }).click();

    // Wait for success toast / modal close
    await expect(page.getByText(/Produce listing published successfully/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Marketplace to verify new listing displays with price and benchmark
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Search for the newly created listing
    const searchInput = page.getByPlaceholder(/Search produce name or description/i);
    await searchInput.fill(uniqueBatchTitle);

    // Verify listing card appears and check details within that card
    const card = page.locator('.space-y-4', { hasText: uniqueBatchTitle }).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Verify selling price is rendered within that card
    await expect(card.getByText('₹34.5 / kg')).toBeVisible();
    // Verify Mandi benchmark is rendered
    await expect(card.getByText('Mandi Benchmark')).toBeVisible();
    await expect(card.getByText('₹32/kg')).toBeVisible();
  });

  test('FAIR-PRICE 9: Changing Mandi Benchmark after applying Fair Price invalidates "Fair Price Applied" and displays custom benchmark status', async ({ page }) => {
    await loginAs(page, FARMER_EMAIL);

    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.getByRole('button', { name: /Create New Listing/i }).click();

    // Set produce title and quantity
    await page.getByLabel('Produce Title / Name').fill('Tomato');
    await page.getByLabel('Available Stock Quantity (kg)').fill('200');

    // Apply Suggested Fair Price
    const applyBtn = page.getByRole('button', { name: /Apply Suggested Fair Price/i });
    await applyBtn.click();

    // Verify initial applied state
    await expect(page.getByText('Fair Price Applied', { exact: true })).toBeVisible();

    // Now modify the Mandi Benchmark input
    const mandiInput = page.getByLabel('Mandi Benchmark (₹ per kg)');
    await mandiInput.fill('40');

    // "Fair Price Applied" MUST be invalidated immediately
    await expect(page.getByText('Fair Price Applied', { exact: true })).not.toBeVisible();

    // Custom Mandi Benchmark status badge MUST appear
    await expect(page.getByText(/Custom Mandi Benchmark: ₹40\/kg/i)).toBeVisible();

    // Selling price remains preserved
    const priceInput = page.getByLabel('Selling Price (₹ per kg)');
    expect(await priceInput.inputValue()).toBe('34.5');

    // Restoring Mandi Benchmark back to 32 restores the matching Fair Price Applied state
    await mandiInput.fill('32');
    await expect(page.getByText('Fair Price Applied', { exact: true })).toBeVisible();
  });

  test('FAIR-PRICE 10: Farmer cannot purchase their own produce listing on Marketplace', async ({ page }) => {
    await loginAs(page, FARMER_EMAIL);

    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Create a unique listing owned by this farmer
    await page.getByRole('button', { name: /Create New Listing/i }).click();
    const selfListingTitle = `Self Order Guard Batch ${Date.now()}`;
    await page.getByLabel('Produce Title / Name').fill(selfListingTitle);
    await page.getByLabel('Available Stock Quantity (kg)').fill('100');
    await page.getByRole('button', { name: /Apply Suggested Fair Price/i }).click();
    await page.getByRole('button', { name: /Publish Listing/i }).click();

    await expect(page.getByText(/Produce listing published successfully/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Marketplace
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Search for farmer's own listing
    const searchInput = page.getByPlaceholder(/Search produce name or description/i);
    await searchInput.fill(selfListingTitle);

    const card = page.locator('.space-y-4', { hasText: selfListingTitle }).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Click "View Details" to open produce modal
    await card.getByRole('button', { name: /View Details/i }).click();

    // Verify modal displays "Your Listing" badge
    await expect(page.getByText('Your Listing', { exact: true })).toBeVisible();

    // Verify Self-Purchase Prohibited warning is displayed
    await expect(page.getByText('Self-Purchase Prohibited')).toBeVisible();
    await expect(page.getByText(/Producers cannot place orders on their own listings/i)).toBeVisible();

    // Verify order placement button "Confirm Order" is NOT rendered
    await expect(page.getByRole('button', { name: /Confirm Order/i })).not.toBeVisible();
  });

  test('FAIR-PRICE 11: Reference Mandi dropdown remains usable without overflow and handles category switching', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13 mobile width
    await loginAs(page, FARMER_EMAIL);

    await page.goto('/farmer');
    await page.waitForLoadState('networkidle');

    // Open modal
    await page.getByRole('button', { name: /Create New Listing/i }).click();
    await page.getByLabel('Produce Title / Name').fill('Fresh Apple');

    // Locate Reference Mandi select
    const mandiSelect = page.locator('select[title="Select reference APMC Mandi market"]');
    if (await mandiSelect.isVisible()) {
      // Check that select element does not horizontally exceed its container
      const selectBox = await mandiSelect.boundingBox();
      expect(selectBox).not.toBeNull();
      expect(selectBox!.width).toBeLessThanOrEqual(360);
    }

    // Switch categories (Vegetables -> Fruits -> Spices)
    await page.getByRole('button', { name: /Fresh Fruits/i }).click();
    await expect(page.getByText('AgriLink Fair Price Engine')).toBeVisible();

    await page.getByRole('button', { name: /Organic Spices/i }).click();
    await expect(page.getByText('AgriLink Fair Price Engine')).toBeVisible();

    await page.getByRole('button', { name: /Fresh Vegetables/i }).click();
    await expect(page.getByText('AgriLink Fair Price Engine')).toBeVisible();
  });
});
