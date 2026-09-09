-- AgriLink Phase 4: Secure Order Cancellation with Atomic Stock Restoration
-- Implements idempotent order cancellation: cancels pending orders and restores stock exactly once.

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_order_buyer_id UUID;
  v_order_listing_id UUID;
  v_order_status TEXT;
  v_order_qty NUMERIC;
  v_listing_farmer_id UUID;
BEGIN
  -- 1. Verify caller is authenticated
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request: User must be signed in';
  END IF;

  -- 2. Lock the order row and load required fields
  SELECT buyer_id, listing_id, status, quantity_kg
  INTO v_order_buyer_id, v_order_listing_id, v_order_status, v_order_qty
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- 3. Verify caller is the buyer OR the farmer who owns the listing
  SELECT farmer_id INTO v_listing_farmer_id
  FROM public.produce_listings
  WHERE id = v_order_listing_id;

  IF v_caller_id != v_order_buyer_id AND v_caller_id != v_listing_farmer_id THEN
    RAISE EXCEPTION 'Permission denied: You are not authorised to cancel this order';
  END IF;

  -- 4. Idempotency: if already cancelled, return current state without changing anything
  IF v_order_status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'message', 'Order was already cancelled — no changes made'
    );
  END IF;

  -- 5. Only allow cancellation from pending or confirmed states
  IF v_order_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Order cannot be cancelled: current status is ''%''', v_order_status;
  END IF;

  -- 6. Update order status to cancelled
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id;

  -- 7. Restore stock atomically
  UPDATE public.produce_listings
  SET available_quantity_kg = available_quantity_kg + v_order_qty
  WHERE id = v_order_listing_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'restored_qty', v_order_qty,
    'message', 'Order cancelled and stock restored'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.cancel_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(UUID) TO authenticated;

-- Secure order confirmation: only the farmer who owns the listing can confirm
CREATE OR REPLACE FUNCTION public.confirm_order(
  p_order_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_order_listing_id UUID;
  v_order_status TEXT;
  v_listing_farmer_id UUID;
BEGIN
  -- 1. Verify caller is authenticated
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request: User must be signed in';
  END IF;

  -- 2. Lock and load the order
  SELECT listing_id, status
  INTO v_order_listing_id, v_order_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- 3. Verify caller is the farmer who owns the listing
  SELECT farmer_id INTO v_listing_farmer_id
  FROM public.produce_listings
  WHERE id = v_order_listing_id;

  IF v_caller_id != v_listing_farmer_id THEN
    RAISE EXCEPTION 'Permission denied: Only the producer can confirm this order';
  END IF;

  -- 4. Only allow confirmation from pending state
  IF v_order_status != 'pending' THEN
    RAISE EXCEPTION 'Order cannot be confirmed: current status is ''%''', v_order_status;
  END IF;

  -- 5. Confirm the order
  UPDATE public.orders
  SET status = 'confirmed'
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'new_status', 'confirmed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.confirm_order(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_order(UUID) TO authenticated;

-- Add RLS SELECT policy for farmers to see orders on their listings
-- Drop if exists first to avoid duplicate policy errors
DROP POLICY IF EXISTS "Farmers view orders for their listings" ON public.orders;
CREATE POLICY "Farmers view orders for their listings" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.produce_listings pl
      WHERE pl.id = listing_id AND pl.farmer_id = auth.uid()
    )
  );
