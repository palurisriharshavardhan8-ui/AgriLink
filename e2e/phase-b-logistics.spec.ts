import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import {
  createConfirmedOrder,
  getDeliveryTaskForOrder,
  getOrder,
  cleanupOrder,
  CreatedTestOrder,
} from './helpers/db';

test.describe('Phase B: Smart Logistics & Delivery Tracking (SIH26033)', () => {
  // Execute tests serially as a continuous fulfillment lifecycle
  test.describe.configure({ mode: 'serial' });

  let testOrder: CreatedTestOrder;
  const FARMER_EMAIL = 'harshafarmer@gmail.com';
  const DRIVER_EMAIL = 'delivery@gmail.com';
  const CONSUMER_EMAIL = 'consumer@gmail.com';

  test.beforeAll(async () => {
    // Dynamically seed an isolated confirmed test order
    testOrder = await createConfirmedOrder({
      farmerEmail: FARMER_EMAIL,
      consumerEmail: CONSUMER_EMAIL,
      quantityKg: 1,
    });
    console.log(`[Test Setup] Created confirmed test order: ${testOrder.orderId}`);
  });

  test.afterAll(async () => {
    // Safely remove only the test order and its delivery task
    if (testOrder?.orderId) {
      await cleanupOrder(testOrder.orderId);
      console.log(`[Test Teardown] Cleaned up test order: ${testOrder.orderId}`);
    }
  });

  // TEST 1 — Dispatch Order
  test('TEST 1: Farmer can open dispatch modal, assign delivery partner, and dispatch order', async ({ page }) => {
    // 1. Log in as farmer
    await loginAs(page, FARMER_EMAIL);

    // 2. Navigate to Orders page
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // 3. Locate the test order card using order ID snippet
    const orderSnippet = testOrder.orderId.slice(0, 8);
    const orderCard = page.locator('div.border-agri-earth-200').filter({ hasText: `#${orderSnippet}` }).first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // 4. Click the "Dispatch Order" button for this specific order
    const dispatchBtn = orderCard.getByRole('button', { name: /Dispatch Order/i });
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();

    // 5. Verify Dispatch Modal appears
    await expect(page.getByText('Dispatch Order Consignment')).toBeVisible();

    // 6. Verify and select available delivery partner
    const partnerSelect = page.locator('select');
    if (await partnerSelect.isVisible()) {
      const options = await partnerSelect.locator('option').allInnerTexts();
      expect(options.length).toBeGreaterThan(0);
      // Select the first delivery partner (Test Delivery)
      await partnerSelect.selectOption({ index: 0 });
    }

    // 7. Verify pickup and delivery location inputs
    const pickupInput = page.getByLabel('Farm Pickup Location');
    const deliveryInput = page.getByLabel('Delivery Destination / Landmark');

    await expect(pickupInput).toBeVisible();
    await expect(deliveryInput).toBeVisible();

    // Fill deterministic test waypoints if empty
    if (!(await pickupInput.inputValue())) {
      await pickupInput.fill('Kolar Organic Farm Cluster A');
    }
    await deliveryInput.fill('Koramangala Sector-12 Community Drop');

    // 8. Submit dispatch
    const confirmDispatchBtn = page.getByRole('button', { name: /Confirm Dispatch/i });
    await confirmDispatchBtn.click();

    // 9. Verify UI updates to "Dispatched / Out for Delivery"
    await expect(page.getByText(/Dispatched \/ Out for Delivery/i).first()).toBeVisible({ timeout: 15000 });

    // 10. Database verification
    const dbTask = await getDeliveryTaskForOrder(testOrder.orderId);
    expect(dbTask).not.toBeNull();
    expect(dbTask?.status).toBe('assigned');
    expect(dbTask?.pickup_location).toBeTruthy();
    expect(dbTask?.delivery_location).toContain('Koramangala Sector-12');

    const dbOrder = await getOrder(testOrder.orderId);
    expect(dbOrder.status).toBe('dispatched');
  });

  // TEST 2 — Delivery Partner Assignment
  test('TEST 2: Assigned delivery partner can view the task on /delivery', async ({ page }) => {
    // 1. Sign in as delivery partner
    await loginAs(page, DRIVER_EMAIL);

    // 2. Open /delivery
    await page.goto('/delivery');
    await page.waitForLoadState('networkidle');

    // 3. Switch to All Tasks view tab
    await page.getByRole('button', { name: /All Tasks/i }).click();

    // 4. Verify assigned task appears with order ID
    const orderSnippet = testOrder.orderId.slice(0, 8);
    const taskCard = page.locator('div.border-agri-earth-200').filter({ hasText: `#${orderSnippet}` }).first();
    await expect(taskCard).toBeVisible({ timeout: 10000 });

    // 5. Verify task details: initial status is "Assigned"
    await expect(taskCard.getByText('Assigned', { exact: true })).toBeVisible();
    await expect(taskCard.getByText(/Koramangala Sector-12/i)).toBeVisible();
  });

  // TEST 3 & 4 — Delivery Status Lifecycle & Order Synchronization
  test('TEST 3 & 4: Full status lifecycle: assigned -> picked_up -> in_transit -> delivered and order sync', async ({ page }) => {
    // 1. Login as delivery partner
    await loginAs(page, DRIVER_EMAIL);
    await page.goto('/delivery');
    await page.waitForLoadState('networkidle');

    // Go to All Tasks tab to directly test task action buttons
    await page.getByRole('button', { name: /All Tasks/i }).click();

    const orderSnippet = testOrder.orderId.slice(0, 8);
    const taskCard = page.locator('div.border-agri-earth-200').filter({ hasText: `#${orderSnippet}` }).first();
    await expect(taskCard).toBeVisible({ timeout: 10000 });

    // TRANSITION 1: Assigned -> Picked Up
    const markPickedUpBtn = taskCard.getByRole('button', { name: /Mark Picked Up/i });
    await expect(markPickedUpBtn).toBeVisible();
    await markPickedUpBtn.click();

    // Verify UI reflects "Picked Up"
    await expect(taskCard.getByText('Picked Up', { exact: true })).toBeVisible({ timeout: 10000 });

    // Verify Database state for Transition 1
    let dbTask = await getDeliveryTaskForOrder(testOrder.orderId);
    expect(dbTask?.status).toBe('picked_up');

    // TRANSITION 2: Picked Up -> Out for Delivery (in_transit)
    const outForDeliveryBtn = taskCard.getByRole('button', { name: /Out for Delivery/i });
    await expect(outForDeliveryBtn).toBeVisible();
    await outForDeliveryBtn.click();

    // Verify UI reflects "Out for Delivery"
    await expect(taskCard.getByText('Out for Delivery', { exact: true })).toBeVisible({ timeout: 10000 });

    // Verify Database state for Transition 2
    dbTask = await getDeliveryTaskForOrder(testOrder.orderId);
    expect(dbTask?.status).toBe('in_transit');

    // Verify Order status is dispatched
    let dbOrder = await getOrder(testOrder.orderId);
    expect(dbOrder.status).toBe('dispatched');

    // TRANSITION 3: Out for Delivery -> Delivered
    const markDeliveredBtn = taskCard.getByRole('button', { name: /Mark Delivered/i });
    await expect(markDeliveredBtn).toBeVisible();
    await markDeliveredBtn.click();

    // Verify UI reflects "Delivered"
    await expect(taskCard.getByText('Delivered', { exact: true })).toBeVisible({ timeout: 10000 });

    // Verify Database state for Transition 3
    dbTask = await getDeliveryTaskForOrder(testOrder.orderId);
    expect(dbTask?.status).toBe('delivered');

    // TEST 4 SYNCHRONIZATION: Verify parent order status automatically synchronized to 'delivered'
    dbOrder = await getOrder(testOrder.orderId);
    expect(dbOrder.status).toBe('delivered');
  });

  // TEST 5 — Consumer/Farmer Live Tracking
  test('TEST 5: Consumer can open live delivery tracking drawer and view 4-stage fulfillment journey', async ({ page }) => {
    // 1. Sign in as consumer
    await loginAs(page, CONSUMER_EMAIL);

    // 2. Open /orders
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // 3. Locate the test order
    const orderSnippet = testOrder.orderId.slice(0, 8);
    const orderCard = page.locator('div.border-agri-earth-200').filter({ hasText: `#${orderSnippet}` }).first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // 4. Click "Track Delivery"
    const trackDeliveryBtn = orderCard.getByRole('button', { name: /Track Delivery/i });
    await expect(trackDeliveryBtn).toBeVisible();
    await trackDeliveryBtn.click();

    // 5. Verify Tracking Modal opens
    await expect(page.getByText('Delivery Fulfillment Tracking')).toBeVisible();

    // 6. Verify 4-stage visual journey
    await expect(page.getByText('1. Order Placed')).toBeVisible();
    await expect(page.getByText('2. Confirmed by Producer')).toBeVisible();
    await expect(page.getByText('3. Out for Delivery / In Transit')).toBeVisible();
    await expect(page.getByText('4. Delivered to Destination')).toBeVisible();

    // 7. Verify waypoints and courier information
    await expect(page.getByText(/Pickup Origin/i)).toBeVisible();
    await expect(page.getByText('Destination', { exact: true })).toBeVisible();
    await expect(page.getByText(/Courier:/i)).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Close Tracking' }).click();
    await expect(page.getByText('Delivery Fulfillment Tracking')).not.toBeVisible();
  });

  // TEST 6 — Delivery Route Console
  test('TEST 6: Delivery partner can inspect deterministic route stops and sequential waypoints', async ({ page }) => {
    // 1. Sign in as delivery partner
    await loginAs(page, DRIVER_EMAIL);

    // 2. Navigate to /delivery
    await page.goto('/delivery');
    await page.waitForLoadState('networkidle');

    // 3. Verify Route Console is active
    await page.getByRole('button', { name: /Route Console/i }).click();

    // 4. Verify route console headers and metadata
    await expect(page.getByText('Active Dispatch Route Console')).toBeVisible();
    await expect(page.getByText(/Deterministic Stop Order/i)).toBeVisible();
    await expect(page.getByText(/Total Route Distance:/i)).toBeVisible();

    // 5. Verify sequential stop types (Pickups, Hubs, Deliveries)
    const stopBadges = page.locator('span:has-text("STOP"), span:has-text("PICKUP"), span:has-text("HUB")');
    const badgeCount = await stopBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(3);

    // 6. Verify summary metrics row
    await expect(page.getByText('Assigned Jobs')).toBeVisible();
    await expect(page.getByText('Out for Delivery')).toBeVisible();
    await expect(page.getByText('Completed Deliveries')).toBeVisible();
    await expect(page.getByText('Route Stops')).toBeVisible();
  });
});
