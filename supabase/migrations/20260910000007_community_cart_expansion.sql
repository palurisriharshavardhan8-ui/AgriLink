-- AgriLink Phase 6 Expansion: Community Cart & Enterprise Admin Schema (SIH26033)
-- Safely expands public.community_carts and configures Admin visibility policies.

-- 1. Safely add missing columns to community_carts
ALTER TABLE public.community_carts
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.produce_listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS category public.produce_category DEFAULT 'vegetables'::public.produce_category,
  ADD COLUMN IF NOT EXISTS community_price NUMERIC(10,2) CHECK (community_price >= 0),
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS closing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS min_commitment_kg NUMERIC(10,2) DEFAULT 2.00 CHECK (min_commitment_kg > 0),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_carts_listing_id ON public.community_carts(listing_id);
CREATE INDEX IF NOT EXISTS idx_community_carts_farmer_id ON public.community_carts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_community_carts_locality ON public.community_carts(locality);
CREATE INDEX IF NOT EXISTS idx_community_carts_cart_status ON public.community_carts(cart_status);

-- 3. Community Cart Members table (for granular member commitment records)
CREATE TABLE IF NOT EXISTS public.community_cart_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_cart_id UUID NOT NULL REFERENCES public.community_carts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity_kg NUMERIC(10,2) NOT NULL CHECK (quantity_kg > 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  delivery_option TEXT NOT NULL DEFAULT 'neighborhood_delivery',
  delivery_landmark TEXT,
  status TEXT NOT NULL DEFAULT 'joined',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_cart_members_cart ON public.community_cart_members(community_cart_id);
CREATE INDEX IF NOT EXISTS idx_comm_cart_members_customer ON public.community_cart_members(customer_id);

-- 4. Enable RLS
ALTER TABLE public.community_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_cart_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for community_carts
DROP POLICY IF EXISTS "Public community carts select" ON public.community_carts;
CREATE POLICY "Public community carts select" ON public.community_carts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert community carts" ON public.community_carts;
CREATE POLICY "Authenticated users insert community carts" ON public.community_carts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users update community carts" ON public.community_carts;
CREATE POLICY "Authenticated users update community carts" ON public.community_carts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. RLS Policies for community_cart_members
DROP POLICY IF EXISTS "Public community cart members select" ON public.community_cart_members;
CREATE POLICY "Public community cart members select" ON public.community_cart_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert community cart members" ON public.community_cart_members;
CREATE POLICY "Authenticated users insert community cart members" ON public.community_cart_members
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 7. Admin policies for Orders Monitoring: Allow platform admin to view all orders
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
CREATE POLICY "Admins view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );
