-- AgriLink Phase 4: Secure Atomic Direct Order & Inventory Stock Reduction
-- Solves price manipulation, identity spoofing, race conditions, and stock sync issues.

-- Drop previous function signatures if present
DROP FUNCTION IF EXISTS public.place_direct_order(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.place_direct_order(UUID, UUID, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION public.place_direct_order(
  p_listing_id UUID,
  p_quantity_kg NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_buyer_id UUID;
  v_current_stock NUMERIC;
  v_unit_price NUMERIC;
  v_total_price NUMERIC;
  v_order_id UUID;
BEGIN
  -- 1. Derive authenticated user ID securely from context
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request: User must be signed in to place an order';
  END IF;

  -- 2. Validate requested quantity
  IF p_quantity_kg IS NULL OR p_quantity_kg <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than 0';
  END IF;

  -- 3. Lock target produce listing row for update & verify active status and stock
  SELECT available_quantity_kg, price_per_kg
  INTO v_current_stock, v_unit_price
  FROM public.produce_listings
  WHERE id = p_listing_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produce listing not found or is no longer active';
  END IF;

  IF v_current_stock < p_quantity_kg THEN
    RAISE EXCEPTION 'Requested quantity (% kg) exceeds available stock (% kg)', p_quantity_kg, v_current_stock;
  END IF;

  -- 4. Calculate total price securely in database from actual listing price
  v_total_price := v_unit_price * p_quantity_kg;

  -- 5. Atomically decrement stock
  UPDATE public.produce_listings
  SET available_quantity_kg = available_quantity_kg - p_quantity_kg
  WHERE id = p_listing_id;

  -- 6. Insert order record with authenticated buyer_id
  INSERT INTO public.orders (
    buyer_id,
    listing_id,
    quantity_kg,
    total_price,
    status
  ) VALUES (
    v_buyer_id,
    p_listing_id,
    p_quantity_kg,
    v_total_price,
    'pending'
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'buyer_id', v_buyer_id,
    'total_price', v_total_price,
    'remaining_stock', v_current_stock - p_quantity_kg
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke default privileges from public and anon
REVOKE ALL ON FUNCTION public.place_direct_order(UUID, NUMERIC) FROM PUBLIC, anon;

-- Grant execution permission ONLY to authenticated API users
GRANT EXECUTE ON FUNCTION public.place_direct_order(UUID, NUMERIC) TO authenticated;
