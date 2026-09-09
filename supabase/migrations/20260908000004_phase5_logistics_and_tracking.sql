-- AgriLink Phase B: Smart Logistics & Delivery Tracking (SIH26033 MVP)
-- 1. Table Grants for delivery_tasks
-- 2. Scoped RLS policies for drivers, buyers, and farmers
-- 3. dispatch_and_assign_delivery_job RPC (Parameters without default before ones with default)
-- 4. update_delivery_status RPC
-- 5. get_available_delivery_partners RPC

-- 1. TABLE GRANTS
GRANT SELECT, INSERT, UPDATE ON public.delivery_tasks TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. ROW LEVEL SECURITY POLICIES (Idempotent cleanup & creation)
DROP POLICY IF EXISTS "Drivers view assigned tasks" ON public.delivery_tasks;
DROP POLICY IF EXISTS "Drivers update assigned tasks" ON public.delivery_tasks;
DROP POLICY IF EXISTS "Buyers view delivery tasks for their orders" ON public.delivery_tasks;
DROP POLICY IF EXISTS "Farmers view delivery tasks for their listings" ON public.delivery_tasks;
DROP POLICY IF EXISTS "Farmers and admins insert delivery tasks" ON public.delivery_tasks;

-- Drivers & Admins view assigned delivery tasks
CREATE POLICY "Drivers view assigned tasks" ON public.delivery_tasks
  FOR SELECT USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

-- Drivers & Admins update assigned delivery tasks
CREATE POLICY "Drivers update assigned tasks" ON public.delivery_tasks
  FOR UPDATE USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

-- Consumers (Buyers) view delivery tasks for their orders
CREATE POLICY "Buyers view delivery tasks for their orders" ON public.delivery_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

-- Farmers view delivery tasks for their produce listings
CREATE POLICY "Farmers view delivery tasks for their listings" ON public.delivery_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.produce_listings pl ON pl.id = o.listing_id
      WHERE o.id = order_id AND pl.farmer_id = auth.uid()
    )
  );

-- Farmers & Admins insert delivery tasks
CREATE POLICY "Farmers and admins insert delivery tasks" ON public.delivery_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('farmer_fpo'::public.user_role, 'admin'::public.user_role)
    )
  );

-- 3. RPC: dispatch_and_assign_delivery_job
-- Drop existing variants if previously attempted to guarantee clean, idempotent creation
DROP FUNCTION IF EXISTS public.dispatch_and_assign_delivery_job(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.dispatch_and_assign_delivery_job(UUID, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.dispatch_and_assign_delivery_job(
  p_order_id UUID,
  p_pickup_location TEXT,
  p_delivery_location TEXT,
  p_driver_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_order_status TEXT;
  v_listing_farmer_id UUID;
  v_task_id UUID;
BEGIN
  -- 1. Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request: User must be signed in';
  END IF;

  SELECT role::text INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

  -- 2. Validate locations
  IF p_pickup_location IS NULL OR trim(p_pickup_location) = '' THEN
    RAISE EXCEPTION 'Pickup location is required';
  END IF;

  IF p_delivery_location IS NULL OR trim(p_delivery_location) = '' THEN
    RAISE EXCEPTION 'Delivery location is required';
  END IF;

  -- 3. Lock and verify order
  SELECT pl.farmer_id, o.status::text
  INTO v_listing_farmer_id, v_order_status
  FROM public.orders o
  JOIN public.produce_listings pl ON pl.id = o.listing_id
  WHERE o.id = p_order_id
  FOR UPDATE OF o;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- 4. Check permissions: must be listing farmer or admin
  IF v_caller_id != v_listing_farmer_id AND v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: Only the listing producer or admin can dispatch this order';
  END IF;

  -- 5. Only confirmed orders can be dispatched
  IF v_order_status != 'confirmed' THEN
    RAISE EXCEPTION 'Order cannot be dispatched: current status is ''%'' (must be ''confirmed'')', v_order_status;
  END IF;

  -- 6. Insert delivery task record
  INSERT INTO public.delivery_tasks (
    order_id,
    driver_id,
    pickup_location,
    delivery_location,
    status
  ) VALUES (
    p_order_id,
    p_driver_id,
    trim(p_pickup_location),
    trim(p_delivery_location),
    'assigned'
  ) RETURNING id INTO v_task_id;

  -- 7. Update order status to dispatched
  UPDATE public.orders
  SET status = 'dispatched'
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'task_id', v_task_id,
    'order_id', p_order_id,
    'status', 'dispatched'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.dispatch_and_assign_delivery_job(UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_and_assign_delivery_job(UUID, TEXT, TEXT, UUID) TO authenticated;

-- 4. RPC: update_delivery_status
DROP FUNCTION IF EXISTS public.update_delivery_status(UUID, public.delivery_status);

CREATE OR REPLACE FUNCTION public.update_delivery_status(
  p_task_id UUID,
  p_status public.delivery_status
) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_task_driver_id UUID;
  v_order_id UUID;
  v_current_status public.delivery_status;
BEGIN
  -- 1. Authenticate caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request: User must be signed in';
  END IF;

  SELECT role::text INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

  -- 2. Lock and load delivery task
  SELECT driver_id, order_id, status
  INTO v_task_driver_id, v_order_id, v_current_status
  FROM public.delivery_tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery task not found';
  END IF;

  -- 3. Verify caller is the assigned driver or admin
  IF (v_task_driver_id IS NULL OR v_caller_id != v_task_driver_id) AND v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: Only the assigned delivery partner or admin can update this task';
  END IF;

  -- 4. Update delivery task status
  UPDATE public.delivery_tasks
  SET status = p_status
  WHERE id = p_task_id;

  -- 5. If delivered, automatically synchronize parent order status to delivered
  IF p_status = 'delivered'::public.delivery_status THEN
    UPDATE public.orders
    SET status = 'delivered'
    WHERE id = v_order_id;
  ELSIF p_status = 'in_transit'::public.delivery_status THEN
    UPDATE public.orders
    SET status = 'dispatched'
    WHERE id = v_order_id AND status != 'dispatched';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'new_status', p_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.update_delivery_status(UUID, public.delivery_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_delivery_status(UUID, public.delivery_status) TO authenticated;

-- 5. RPC: get_available_delivery_partners
DROP FUNCTION IF EXISTS public.get_available_delivery_partners();

CREATE OR REPLACE FUNCTION public.get_available_delivery_partners()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone_number TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.phone_number, p.email
  FROM public.profiles p
  WHERE p.role = 'delivery_partner'::public.user_role
  ORDER BY p.full_name ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_available_delivery_partners() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_available_delivery_partners() TO authenticated;
