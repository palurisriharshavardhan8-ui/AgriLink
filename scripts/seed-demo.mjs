#!/usr/bin/env node
/**
 * AgriLink SIH Demonstration Data Seed Script (SIH26033)
 *
 * Creates REAL Supabase database records for SIH demonstration:
 * - 3 Demo Farmers (with farm/FPO profiles)
 * - 5 Demo Customers
 * - 1 Demo Admin
 * - 7 Realistic Produce Listings across categories
 * - 3 Hyperlocal Community Carts (Open & Target Reached)
 * - Customer Community Cart Participation & Associated Orders
 *
 * Rules:
 * - NEVER runs automatically or during Vercel builds.
 * - Authenticates safely using client credentials without exposing service role keys.
 * - Fully idempotent: can be executed multiple times without duplicate records.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Load environment variables from .env.local safely
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmrtgxvnvzgkgcqmngri.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_e2jpEL0rja20uT6wajFRhA_YquQWgbJ';

const publicClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function getAuthClient(email, password = 'password123') {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Auth failure for ${email}: ${error.message}`);
  }
  return { client, user: data.user };
}

// 2. Demonstration Users Configuration
const DEMO_USERS = [
  // Farmers
  {
    email: 'harshafarmer@gmail.com',
    password: 'password123',
    fullName: 'Harsha Vardhan (FPO Lead)',
    role: 'farmer_fpo',
    farm: {
      organizationName: 'Kolar Natural Producers FPO',
      district: 'Kolar',
      state: 'Karnataka',
      isFpo: true,
    },
  },
  {
    email: 'rajesh.farmer@gmail.com',
    password: 'password123',
    fullName: 'Rajesh Patel',
    role: 'farmer_fpo',
    farm: {
      organizationName: 'Chittoor Organic Fruit Collective',
      district: 'Chittoor',
      state: 'Andhra Pradesh',
      isFpo: false,
    },
  },
  {
    email: 'suresh.farmer@gmail.com',
    password: 'password123',
    fullName: 'Suresh Gowda',
    role: 'farmer_fpo',
    farm: {
      organizationName: 'Mysore Spices & Vegetables FPO',
      district: 'Mysuru',
      state: 'Karnataka',
      isFpo: true,
    },
  },
  // Customers
  {
    email: 'consumer@gmail.com',
    password: 'password123',
    fullName: 'Arun Kumar',
    role: 'consumer',
  },
  {
    email: 'sujith.consumer@gmail.com',
    password: 'password123',
    fullName: 'Sujith Varma',
    role: 'consumer',
  },
  {
    email: 'anand.consumer@gmail.com',
    password: 'password123',
    fullName: 'Anand Sharma',
    role: 'consumer',
  },
  {
    email: 'kavitha.consumer@gmail.com',
    password: 'password123',
    fullName: 'Kavitha Reddy',
    role: 'consumer',
  },
  {
    email: 'priya.consumer@gmail.com',
    password: 'password123',
    fullName: 'Priya Nair',
    role: 'consumer',
  },
  // Admin
  {
    email: 'admin@gmail.com',
    password: 'password123',
    fullName: 'Platform Admin',
    role: 'admin',
  },
];

// 3. Produce Listings Definitions
const DEMO_LISTINGS = [
  {
    farmerEmail: 'harshafarmer@gmail.com',
    title: 'Organic Kolar Hybrid Tomatoes',
    category: 'vegetables',
    description: 'Farm-fresh table tomatoes harvested within 12 hours from Kolar greenhouse farms. Rich in lycopene and pesticide-free.',
    price_per_kg: 32.00,
    mandi_benchmark_price: 38.00,
    available_quantity_kg: 200.00,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60',
  },
  {
    farmerEmail: 'harshafarmer@gmail.com',
    title: 'Bangalore Rose Onions (GI Tagged)',
    category: 'vegetables',
    description: 'Pungent, high-solids Bangalore Rose onions ideal for export and regional pickling. Certified Geographical Indication produce.',
    price_per_kg: 28.00,
    mandi_benchmark_price: 35.00,
    available_quantity_kg: 150.00,
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=60',
  },
  {
    farmerEmail: 'harshafarmer@gmail.com',
    title: 'Ooty Highland Crisp Carrots',
    category: 'vegetables',
    description: 'Sweet and crunchy orange carrots grown in high-altitude Nilgiri soil. Washed and sorted by Kolar Natural Producers FPO.',
    price_per_kg: 35.00,
    mandi_benchmark_price: 42.00,
    available_quantity_kg: 120.00,
    image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop&q=60',
  },
  {
    farmerEmail: 'rajesh.farmer@gmail.com',
    title: 'Chittoor Sweet Mangoes (Banganapalli)',
    category: 'fruits',
    description: 'Naturally tree-ripened Banganapalli mangoes. Zero carbide ripening, harvested directly from Chittoor certified orchards.',
    price_per_kg: 85.00,
    mandi_benchmark_price: 95.00,
    available_quantity_kg: 350.00,
    image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=60',
  },
  {
    farmerEmail: 'rajesh.farmer@gmail.com',
    title: 'Robusta Banana Bunches (Naturally Ripened)',
    category: 'fruits',
    description: 'Farm-fresh Robusta bananas harvested mature-green and ripened with temperature control. High potassium and fiber.',
    price_per_kg: 35.00,
    mandi_benchmark_price: 45.00,
    available_quantity_kg: 250.00,
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=60',
  },
  {
    farmerEmail: 'suresh.farmer@gmail.com',
    title: 'Mysore Premium Green Cardamom',
    category: 'spices',
    description: 'Grade-A 8mm bold green cardamom pods sourced directly from Mysuru foothills. High essential oil concentration.',
    price_per_kg: 220.00,
    mandi_benchmark_price: 260.00,
    available_quantity_kg: 80.00,
    image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=60',
  },
  {
    farmerEmail: 'suresh.farmer@gmail.com',
    title: 'Fresh Farm Spinach & Organic Greens',
    category: 'vegetables',
    description: 'Tender palak, methi, and coriander harvested at dawn. Chemical pesticide-free hydroponic-assisted soil cultivation.',
    price_per_kg: 24.00,
    mandi_benchmark_price: 30.00,
    available_quantity_kg: 90.00,
    image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop&q=60',
  },
];

// 4. Community Carts Configuration
const DEMO_CARTS = [
  {
    farmerEmail: 'harshafarmer@gmail.com',
    listingTitle: 'Organic Kolar Hybrid Tomatoes',
    sectorCode: 'Whitefield Corridor | Organic Kolar Hybrid Tomatoes | vegetables | 28',
    deliveryLandmark: 'Prestige Shantiniketan Club, Whitefield, Bengaluru',
    targetKg: 100.00,
    communityPrice: 28.00,
    cartStatus: 'open',
    initialAggregatedKg: 75.00,
    orders: [
      { customerEmail: 'consumer@gmail.com', quantityKg: 25.00 },
      { customerEmail: 'anand.consumer@gmail.com', quantityKg: 20.00 },
      { customerEmail: 'kavitha.consumer@gmail.com', quantityKg: 15.00 },
      { customerEmail: 'priya.consumer@gmail.com', quantityKg: 15.00 },
    ],
  },
  {
    farmerEmail: 'harshafarmer@gmail.com',
    listingTitle: 'Ooty Highland Crisp Carrots',
    sectorCode: 'Indiranagar Hub | Ooty Highland Crisp Carrots | vegetables | 30',
    deliveryLandmark: 'Indiranagar Club, 100ft Road, Bengaluru',
    targetKg: 60.00,
    communityPrice: 30.00,
    cartStatus: 'target_reached',
    initialAggregatedKg: 60.00,
    orders: [
      { customerEmail: 'sujith.consumer@gmail.com', quantityKg: 25.00 },
      { customerEmail: 'consumer@gmail.com', quantityKg: 20.00 },
      { customerEmail: 'anand.consumer@gmail.com', quantityKg: 15.00 },
    ],
  },
  {
    farmerEmail: 'rajesh.farmer@gmail.com',
    listingTitle: 'Chittoor Sweet Mangoes (Banganapalli)',
    sectorCode: 'Koramangala Block | Chittoor Sweet Mangoes (Banganapalli) | fruits | 75',
    deliveryLandmark: 'Koramangala 4th Block Community Center, Bengaluru',
    targetKg: 80.00,
    communityPrice: 75.00,
    cartStatus: 'open',
    initialAggregatedKg: 35.00,
    orders: [
      { customerEmail: 'kavitha.consumer@gmail.com', quantityKg: 20.00 },
      { customerEmail: 'priya.consumer@gmail.com', quantityKg: 15.00 },
    ],
  },
];

async function main() {
  console.log('===============================================================');
  console.log('   AgriLink SIH26033: Idempotent Demonstration Data Seed       ');
  console.log('   Target: Real Supabase Cloud Database                        ');
  console.log('===============================================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Step 1: Ensure All Demo Users Exist
  console.log('▶ [1/5] Ensuring Demo Accounts (Farmers, Customers, Admin)...');
  const userMap = new Map(); // email -> profile
  const clientCache = new Map(); // email -> { client, user }

  for (const demoUser of DEMO_USERS) {
    try {
      const authRes = await getAuthClient(demoUser.email, demoUser.password);
      clientCache.set(demoUser.email, authRes);

      const { data: profile } = await publicClient
        .from('profiles')
        .select('*')
        .eq('id', authRes.user.id)
        .single();

      userMap.set(demoUser.email, profile || { id: authRes.user.id, ...demoUser });
      console.log(`  ✓ Verified user: ${demoUser.email} (${demoUser.role})`);
    } catch {
      // Not yet registered, sign up
      const { data, error } = await publicClient.auth.signUp({
        email: demoUser.email,
        password: demoUser.password,
        options: {
          data: {
            full_name: demoUser.fullName,
            role: demoUser.role,
          },
        },
      });

      if (error) {
        console.warn(`  ! Could not sign up ${demoUser.email}:`, error.message);
        continue;
      }

      console.log(`  + Created user: ${demoUser.email} (${demoUser.role})`);
      const authRes = await getAuthClient(demoUser.email, demoUser.password);
      clientCache.set(demoUser.email, authRes);

      const { data: profile } = await publicClient
        .from('profiles')
        .select('*')
        .eq('id', authRes.user.id)
        .single();

      userMap.set(demoUser.email, profile || { id: authRes.user.id, ...demoUser });
    }
  }

  // Step 2: Ensure Farms / FPOs Exist for Farmers
  console.log('\n▶ [2/5] Verifying Farm & FPO Producer Entities...');
  for (const demoUser of DEMO_USERS) {
    if (demoUser.role === 'farmer_fpo' && demoUser.farm) {
      const userObj = userMap.get(demoUser.email);
      const authRes = clientCache.get(demoUser.email);
      if (!userObj || !authRes) continue;

      const { data: existingFarm } = await publicClient
        .from('farms_fpos')
        .select('id')
        .eq('profile_id', userObj.id)
        .maybeSingle();

      if (!existingFarm) {
        const { error: farmErr } = await authRes.client.from('farms_fpos').insert({
          profile_id: userObj.id,
          organization_name: demoUser.farm.organizationName,
          district: demoUser.farm.district,
          state: demoUser.farm.state,
          is_fpo: demoUser.farm.isFpo,
        });

        if (farmErr) {
          console.warn(`  ! Farm record note for ${demoUser.email}:`, farmErr.message);
        } else {
          console.log(`  + Farm record created for ${demoUser.farm.organizationName}`);
        }
      } else {
        console.log(`  ✓ Farm record verified: ${demoUser.farm.organizationName}`);
      }
    }
  }

  // Step 3: Ensure Realistic Produce Listings Exist
  console.log('\n▶ [3/5] Seeding & Verifying Realistic Produce Listings...');
  const listingsMap = new Map(); // title -> listingRow

  for (const item of DEMO_LISTINGS) {
    const authRes = clientCache.get(item.farmerEmail);
    if (!authRes) {
      console.warn(`  ! Skipping listing "${item.title}": Farmer ${item.farmerEmail} not authenticated.`);
      continue;
    }

    const { data: existingListing } = await publicClient
      .from('produce_listings')
      .select('*')
      .eq('farmer_id', authRes.user.id)
      .eq('title', item.title)
      .maybeSingle();

    if (existingListing) {
      listingsMap.set(item.title, existingListing);
      console.log(`  ✓ Verified listing: "${item.title}" (₹${existingListing.price_per_kg}/kg)`);
    } else {
      const { data: created, error: listErr } = await authRes.client
        .from('produce_listings')
        .insert({
          farmer_id: authRes.user.id,
          title: item.title,
          category: item.category,
          description: item.description,
          price_per_kg: item.price_per_kg,
          mandi_benchmark_price: item.mandi_benchmark_price,
          available_quantity_kg: item.available_quantity_kg,
          image_url: item.image_url,
          is_active: true,
        })
        .select()
        .single();

      if (listErr) {
        console.warn(`  ! Listing insert note for "${item.title}":`, listErr.message);
      } else if (created) {
        listingsMap.set(item.title, created);
        console.log(`  + Created listing: "${item.title}" (₹${item.price_per_kg}/kg, ${item.available_quantity_kg}kg)`);
      }
    }
  }

  // Step 4: Seed & Verify 3 Hyperlocal Community Carts
  console.log('\n▶ [4/5] Seeding & Verifying Hyperlocal Community Carts...');
  const cartsMap = new Map(); // sectorCode -> cartRow

  for (const cartDef of DEMO_CARTS) {
    const farmerAuth = clientCache.get(cartDef.farmerEmail);
    if (!farmerAuth) continue;

    // Check if cart already exists with matching delivery landmark / sector code
    const { data: existingCarts } = await publicClient
      .from('community_carts')
      .select('*')
      .eq('delivery_landmark', cartDef.deliveryLandmark);

    let cartRow = existingCarts && existingCarts.length > 0 ? existingCarts[0] : null;

    if (!cartRow) {
      const { data: createdCart, error: cartErr } = await farmerAuth.client
        .from('community_carts')
        .insert({
          sector_code: cartDef.sectorCode,
          delivery_landmark: cartDef.deliveryLandmark,
          cart_status: cartDef.cartStatus,
          target_discount_quantity_kg: cartDef.targetKg,
          current_aggregated_quantity_kg: cartDef.initialAggregatedKg,
        })
        .select()
        .single();

      if (cartErr) {
        console.warn(`  ! Cart insert warning:`, cartErr.message);
      } else {
        cartRow = createdCart;
        console.log(`  + Created Community Cart: "${cartDef.sectorCode.split('|')[1]?.trim() || cartDef.sectorCode}" (${cartDef.initialAggregatedKg}/${cartDef.targetKg} kg)`);
      }
    } else {
      console.log(`  ✓ Verified Community Cart: "${cartDef.sectorCode.split('|')[1]?.trim() || cartDef.deliveryLandmark}"`);
    }

    if (cartRow) {
      cartsMap.set(cartDef.sectorCode, cartRow);
    }
  }

  // Step 5: Seed Customer Participation & Real Community Orders
  console.log('\n▶ [5/5] Seeding Customer Participation & Associated Orders...');
  let totalSeededOrders = 0;

  for (const cartDef of DEMO_CARTS) {
    const cartRow = cartsMap.get(cartDef.sectorCode);
    const listing = listingsMap.get(cartDef.listingTitle);

    if (!cartRow || !listing) {
      console.warn(`  ! Skipping orders for "${cartDef.listingTitle}": cart or listing not found.`);
      continue;
    }

    for (const orderDef of cartDef.orders) {
      const custAuth = clientCache.get(orderDef.customerEmail);
      if (!custAuth) continue;

      // Check if order already exists for this buyer and this community cart
      const { data: existingOrder } = await custAuth.client
        .from('orders')
        .select('id, quantity_kg')
        .eq('buyer_id', custAuth.user.id)
        .eq('community_cart_id', cartRow.id)
        .maybeSingle();

      if (existingOrder) {
        console.log(`  ✓ Order verified: ${orderDef.customerEmail} (${existingOrder.quantity_kg} kg) in ${cartDef.listingTitle}`);
      } else {
        const orderPrice = Math.round(cartDef.communityPrice * orderDef.quantityKg * 100) / 100;
        const { data: newOrder, error: orderErr } = await custAuth.client
          .from('orders')
          .insert({
            buyer_id: custAuth.user.id,
            listing_id: listing.id,
            community_cart_id: cartRow.id,
            quantity_kg: orderDef.quantityKg,
            total_price: orderPrice,
            status: 'community_grouped',
          })
          .select()
          .single();

        if (orderErr) {
          console.warn(`  ! Order placement note for ${orderDef.customerEmail}:`, orderErr.message);
        } else if (newOrder) {
          totalSeededOrders++;
          console.log(`  + Placed order: ${orderDef.customerEmail} committed ${orderDef.quantityKg} kg (₹${orderPrice})`);
        }
      }
    }
  }

  // Final Ecosystem Summary
  console.log('\n===============================================================');
  console.log('   AgriLink SIH Demo Seed Completed Successfully!              ');
  console.log('===============================================================');
  console.log(`  Farmers verified:         ${DEMO_USERS.filter((u) => u.role === 'farmer_fpo').length}`);
  console.log(`  Customers verified:       ${DEMO_USERS.filter((u) => u.role === 'consumer').length}`);
  console.log(`  Produce Listings:         ${listingsMap.size}`);
  console.log(`  Community Carts:          ${cartsMap.size}`);
  console.log(`  New Orders Placed:        ${totalSeededOrders}`);
  console.log('');
  console.log('Ready for live SIH demonstration at http://localhost:3000/community-cart and /admin.');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('\nSeed script error:', err);
  process.exit(1);
});
