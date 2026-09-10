-- AgriLink Phase 6: Community Cart & Admin Control Schema Enhancements (SIH26033)
-- Adds relational linkage between community carts, produce listings, and farmer profiles,
-- and grants necessary table permissions for cart lifecycle progression.

-- 1. Add columns to public.community_carts safely if not already present
ALTER TABLE public.community_carts
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.produce_listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS community_price NUMERIC(10,2) CHECK (community_price >= 0),
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS closing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS min_commitment_kg NUMERIC(10,2) DEFAULT 1.00 CHECK (min_commitment_kg > 0);

-- 2. Create index for fast locality and listing lookup
CREATE INDEX IF NOT EXISTS idx_community_carts_listing_id ON public.community_carts(listing_id);
CREATE INDEX IF NOT EXISTS idx_community_carts_locality ON public.community_carts(locality);
CREATE INDEX IF NOT EXISTS idx_community_carts_status ON public.community_carts(cart_status);

-- 3. Grant table permissions for authenticated users to update community carts
GRANT SELECT ON public.community_carts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_carts TO authenticated;

-- 4. Enable Row Level Security (RLS) on community_carts
ALTER TABLE public.community_carts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Public community carts select" ON public.community_carts;
CREATE POLICY "Public community carts select" ON public.community_carts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert community carts" ON public.community_carts;
CREATE POLICY "Authenticated users insert community carts" ON public.community_carts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users update community carts" ON public.community_carts;
CREATE POLICY "Authenticated users update community carts" ON public.community_carts
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users delete community carts" ON public.community_carts;
CREATE POLICY "Authenticated users delete community carts" ON public.community_carts
  FOR DELETE USING (auth.role() = 'authenticated');
