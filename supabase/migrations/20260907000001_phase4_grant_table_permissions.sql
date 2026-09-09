-- AgriLink Phase 4: Least-Privilege PostgreSQL Table & Schema Grants
-- Solves PostgreSQL error 42501 (permission denied for table) so that
-- Row Level Security (RLS) policies take effect properly.

-- 1. Grant Schema Usage to API Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grants for Unauthenticated Public Visitors (anon role)
-- Allows reading public marketplace listings, farmer profiles, farms, and community carts.
GRANT SELECT ON public.produce_listings TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.farms_fpos TO anon;
GRANT SELECT ON public.community_carts TO anon;

-- 3. Grants for Authenticated Users (authenticated role)
-- Allows reading records (subject to RLS filter rules).
GRANT SELECT ON public.produce_listings TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.farms_fpos TO authenticated;
GRANT SELECT ON public.community_carts TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.delivery_tasks TO authenticated;

-- Allows producers to insert, update, and delete produce listings (subject to RLS: auth.uid() = farmer_id).
GRANT INSERT, UPDATE, DELETE ON public.produce_listings TO authenticated;

-- Allows buyers to insert orders (subject to RLS: auth.uid() = buyer_id).
GRANT INSERT ON public.orders TO authenticated;

-- Allows users to update their own profile (subject to RLS: auth.uid() = id).
GRANT UPDATE ON public.profiles TO authenticated;

-- Allows producers to insert, update, and delete farm records (subject to RLS: auth.uid() = profile_id).
GRANT INSERT, UPDATE, DELETE ON public.farms_fpos TO authenticated;

-- Allows authenticated users to create community carts (subject to RLS).
GRANT INSERT ON public.community_carts TO authenticated;

-- Allows delivery drivers to update assigned tasks (subject to RLS: driver_id = auth.uid()).
GRANT UPDATE ON public.delivery_tasks TO authenticated;

-- 4. Grant Sequence Privileges
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
