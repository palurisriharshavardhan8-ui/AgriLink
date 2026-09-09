-- AgriLink Phase 4 Hardening: Prevent Farmer Self-Purchase
-- Updates place_direct_order to reject orders when buyer_id matches listing farmer_id

CREATE OR REPLACE FUNCTION public.place_direct_order(
  p_listing_id UUID,
  p_quantity_kg NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_buyer_id UUID;
  v_farmer_id UUID;
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

  -- 3. Lock target produce listing row for update & retrieve stock, unit price, and owner
  SELECT available_quantity_kg, price_per_kg, farmer_id
  INTO v_current_stock, v_unit_price, v_farmer_id
  FROM public.produce_listings
  WHERE id = p_listing_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produce listing not found or is no longer active';
  END IF;

  -- 4. Reject self-purchase at database layer: seller cannot purchase own produce
  IF v_buyer_id = v_farmer_id THEN
    RAISE EXCEPTION 'Self-purchase is not allowed: Producers cannot purchase their own produce listings';
  END IF;

  IF v_current_stock < p_quantity_kg THEN
    RAISE EXCEPTION 'Requested quantity (% kg) exceeds available stock (% kg)', p_quantity_kg, v_current_stock;
  END IF;

  -- 5. Calculate total price securely in database from actual listing price
  v_total_price := v_unit_price * p_quantity_kg;

  -- 6. Atomically decrement stock
  UPDATE public.produce_listings
  SET available_quantity_kg = available_quantity_kg - p_quantity_kg
  WHERE id = p_listing_id;

  -- 7. Insert order record with authenticated buyer_id
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

REVOKE ALL ON FUNCTION public.place_direct_order(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_direct_order(UUID, NUMERIC) TO authenticated;
