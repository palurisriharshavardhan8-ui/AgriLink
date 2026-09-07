-- AgriLink Phase 3: Backend Foundation & Supabase Schema Initialization
-- Problem Statement: SIH26033 (Farm-to-Consumer Direct Marketplace & AI Logistics)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'farmer_fpo',
    'consumer',
    'bulk_buyer',
    'delivery_partner',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.produce_category AS ENUM (
    'vegetables',
    'fruits',
    'grains_pulses',
    'spices',
    'dairy_other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'community_grouped',
    'confirmed',
    'dispatched',
    'delivered',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM (
    'assigned',
    'picked_up',
    'in_transit',
    'delivered'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES DEFINITION

-- User Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role public.user_role NOT NULL DEFAULT 'consumer'::public.user_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Farms & FPO Producer Records
CREATE TABLE IF NOT EXISTS public.farms_fpos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  district TEXT,
  state TEXT,
  is_fpo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Produce Listings (Marketplace)
CREATE TABLE IF NOT EXISTS public.produce_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category public.produce_category NOT NULL,
  description TEXT,
  price_per_kg NUMERIC(10,2) NOT NULL CHECK (price_per_kg >= 0),
  mandi_benchmark_price NUMERIC(10,2) CHECK (mandi_benchmark_price >= 0),
  available_quantity_kg NUMERIC(10,2) NOT NULL CHECK (available_quantity_kg >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hyperlocal Community Carts (Order Aggregation)
CREATE TABLE IF NOT EXISTS public.community_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_code TEXT NOT NULL,
  delivery_landmark TEXT,
  cart_status TEXT NOT NULL DEFAULT 'open',
  target_discount_quantity_kg NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  current_aggregated_quantity_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders (Customer & Bulk Purchases)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.produce_listings(id) ON DELETE RESTRICT,
  community_cart_id UUID REFERENCES public.community_carts(id) ON DELETE SET NULL,
  quantity_kg NUMERIC(10,2) NOT NULL CHECK (quantity_kg > 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  status public.order_status NOT NULL DEFAULT 'pending'::public.order_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery Tasks (Smart Logistics Routes)
CREATE TABLE IF NOT EXISTS public.delivery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  status public.delivery_status NOT NULL DEFAULT 'assigned'::public.delivery_status,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. USER CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'consumer'::public.user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms_fpos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Farms & FPOs Policies
CREATE POLICY "Public farms select" ON public.farms_fpos
  FOR SELECT USING (true);

CREATE POLICY "Producers manage own farm info" ON public.farms_fpos
  FOR ALL USING (auth.uid() = profile_id);

-- Produce Listings Policies
CREATE POLICY "Public produce listings select" ON public.produce_listings
  FOR SELECT USING (is_active = true OR auth.uid() = farmer_id);

CREATE POLICY "Farmers manage own listings" ON public.produce_listings
  FOR ALL USING (auth.uid() = farmer_id);

-- Community Carts Policies
CREATE POLICY "Public community carts select" ON public.community_carts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users insert community carts" ON public.community_carts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Orders Policies
CREATE POLICY "Buyers view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = buyer_id OR
    EXISTS (
      SELECT 1 FROM public.produce_listings pl
      WHERE pl.id = listing_id AND pl.farmer_id = auth.uid()
    )
  );

CREATE POLICY "Buyers insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Delivery Tasks Policies
CREATE POLICY "Drivers view assigned tasks" ON public.delivery_tasks
  FOR SELECT USING (
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Drivers update assigned tasks" ON public.delivery_tasks
  FOR UPDATE USING (driver_id = auth.uid());

-- 6. STORAGE BUCKETS (SAFE INITIALIZATION)
INSERT INTO storage.buckets (id, name, public)
VALUES ('produce-images', 'produce-images', true),
       ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;
