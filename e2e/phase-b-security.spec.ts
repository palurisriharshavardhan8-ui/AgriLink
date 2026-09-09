import { test, expect } from '@playwright/test';
import {
  getAuthenticatedClient,
  getPublicClient,
  createConfirmedOrder,
  cleanupOrder,
  CreatedTestOrder,
} from './helpers/db';

test.describe('TEST 7: Security, RLS & Authorization Guarantees for Phase B', () => {
  let testOrder: CreatedTestOrder;
  const FARMER_EMAIL = 'harshafarmer@gmail.com';
  const DRIVER_EMAIL = 'delivery@gmail.com';
  const CONSUMER_EMAIL = 'consumer@gmail.com';
  let createdTaskId: string;

  test.beforeAll(async () => {
    // 1. Create a confirmed order
    testOrder = await createConfirmedOrder({
      farmerEmail: FARMER_EMAIL,
      consumerEmail: CONSUMER_EMAIL,
      quantityKg: 1,
    });

    // 2. Dispatch the order to delivery partner using the farmer's client
    const farmerClient = await getAuthenticatedClient(FARMER_EMAIL);
    const { data: dispatchRes, error: dispatchErr } = await farmerClient.rpc(
      'dispatch_and_assign_delivery_job',
      {
        p_order_id: testOrder.orderId,
        p_pickup_location: 'Security Test Farm',
        p_delivery_location: 'Security Test Consumer Address',
      }
    );

    if (dispatchErr) {
      throw new Error(`Setup failed: ${dispatchErr.message}`);
    }

    const resObj = typeof dispatchRes === 'string' ? JSON.parse(dispatchRes) : dispatchRes;
    createdTaskId = resObj.task_id;
  });

  test.afterAll(async () => {
    if (testOrder?.orderId) {
      await cleanupOrder(testOrder.orderId);
    }
  });

  test('SECURITY 1: Consumer cannot dispatch an order (Producer/Admin only)', async () => {
    const consumerClient = await getAuthenticatedClient(CONSUMER_EMAIL);

    const { error } = await consumerClient.rpc('dispatch_and_assign_delivery_job', {
      p_order_id: testOrder.orderId,
      p_pickup_location: 'Unauthorized Origin',
      p_delivery_location: 'Unauthorized Drop',
    });

    // Must be rejected with permission denied
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/Permission denied|Only the listing producer/i);
  });

  test('SECURITY 2: Unauthenticated / Anon cannot call logistics RPCs', async () => {
    const anonClient = getPublicClient();

    const { error } = await anonClient.rpc('dispatch_and_assign_delivery_job', {
      p_order_id: testOrder.orderId,
      p_pickup_location: 'Anon Origin',
      p_delivery_location: 'Anon Drop',
    });

    expect(error).not.toBeNull();
    // 42501 permission denied for function
    expect(error?.code).toBe('42501');
  });

  test('SECURITY 3: Non-assigned user cannot mutate delivery task status', async () => {
    const consumerClient = await getAuthenticatedClient(CONSUMER_EMAIL);

    // Consumer attempts to advance task status
    const { error } = await consumerClient.rpc('update_delivery_status', {
      p_task_id: createdTaskId,
      p_status: 'delivered',
    });

    // Must be rejected with permission denied
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/Permission denied|Only the assigned delivery partner/i);
  });

  test('SECURITY 4: Consumer can view delivery task for their own order under RLS', async () => {
    const consumerClient = await getAuthenticatedClient(CONSUMER_EMAIL);

    const { data, error } = await consumerClient
      .from('delivery_tasks')
      .select('*')
      .eq('id', createdTaskId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.id).toBe(createdTaskId);
  });

  test('SECURITY 5: Anon / Unrelated user cannot read delivery tasks under RLS', async () => {
    const anonClient = getPublicClient();

    const { data, error } = await anonClient
      .from('delivery_tasks')
      .select('*')
      .eq('id', createdTaskId);

    // Anon has no table SELECT privilege on delivery_tasks (strict permission denied)
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});
