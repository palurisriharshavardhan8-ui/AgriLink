import { UserRole } from '@/types';
import {
  Store,
  Sprout,
  ShoppingBag,
  Building2,
  Truck,
  ShieldCheck,
  Package,
  User,
  LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const ALL_NAV_ITEMS: Record<string, NavItemConfig> = {
  marketplace: {
    label: 'Marketplace',
    href: '/marketplace',
    icon: Store,
    badge: 'Core',
  },
  farmer: {
    label: 'Farmer / FPO',
    href: '/farmer',
    icon: Sprout,
    badge: 'Producer',
  },
  consumer: {
    label: 'Consumer Hub',
    href: '/consumer',
    icon: ShoppingBag,
    badge: 'Retail',
  },
  'bulk-buyer': {
    label: 'Bulk Buyer',
    href: '/bulk-buyer',
    icon: Building2,
    badge: 'B2B',
  },
  delivery: {
    label: 'Delivery & Route',
    href: '/delivery',
    icon: Truck,
    badge: 'Logistics',
  },
  admin: {
    label: 'Platform Admin',
    href: '/admin',
    icon: ShieldCheck,
    badge: 'Ops',
  },
  orders: {
    label: 'Orders & Tracking',
    href: '/orders',
    icon: Package,
  },
  profile: {
    label: 'Profile & Roles',
    href: '/profile',
    icon: User,
  },
};

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  farmer_fpo: '/farmer',
  consumer: '/consumer',
  bulk_buyer: '/bulk-buyer',
  delivery_partner: '/delivery',
  admin: '/admin',
};

/**
 * Filtered navigation items for each role as per AgriLink specification:
 * - Consumer: Marketplace, Consumer Hub, Orders & Tracking, Profile & Roles
 * - Farmer/FPO: Marketplace, Farmer/FPO, Orders & Tracking, Profile & Roles
 * - Bulk Buyer: Marketplace, Bulk Buyer, Orders & Tracking, Profile & Roles
 * - Delivery Partner: Delivery & Route, Orders & Tracking, Profile & Roles
 * - Admin: All modules
 */
export const ROLE_NAV_ITEMS: Record<UserRole, NavItemConfig[]> = {
  consumer: [
    ALL_NAV_ITEMS.marketplace,
    ALL_NAV_ITEMS.consumer,
    ALL_NAV_ITEMS.orders,
    ALL_NAV_ITEMS.profile,
  ],
  farmer_fpo: [
    ALL_NAV_ITEMS.marketplace,
    ALL_NAV_ITEMS.farmer,
    ALL_NAV_ITEMS.orders,
    ALL_NAV_ITEMS.profile,
  ],
  bulk_buyer: [
    ALL_NAV_ITEMS.marketplace,
    ALL_NAV_ITEMS['bulk-buyer'],
    ALL_NAV_ITEMS.orders,
    ALL_NAV_ITEMS.profile,
  ],
  delivery_partner: [
    ALL_NAV_ITEMS.delivery,
    ALL_NAV_ITEMS.orders,
    ALL_NAV_ITEMS.profile,
  ],
  admin: [
    ALL_NAV_ITEMS.marketplace,
    ALL_NAV_ITEMS.farmer,
    ALL_NAV_ITEMS.consumer,
    ALL_NAV_ITEMS['bulk-buyer'],
    ALL_NAV_ITEMS.delivery,
    ALL_NAV_ITEMS.admin,
    ALL_NAV_ITEMS.orders,
    ALL_NAV_ITEMS.profile,
  ],
};

/**
 * Explicit route-level permissions per role:
 * - Consumer: cannot access /admin, /farmer, /bulk-buyer, /delivery
 * - Farmer/FPO: cannot access /admin, /bulk-buyer, /delivery
 * - Bulk Buyer: cannot access /admin, /farmer, /delivery
 * - Delivery Partner: cannot access /admin, /farmer, /bulk-buyer, /marketplace
 * - Admin: all routes allowed
 */
export const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  consumer: ['/marketplace', '/consumer', '/orders', '/profile'],
  farmer_fpo: ['/marketplace', '/farmer', '/orders', '/profile'],
  bulk_buyer: ['/marketplace', '/bulk-buyer', '/orders', '/profile'],
  delivery_partner: ['/delivery', '/orders', '/profile'],
  admin: [
    '/marketplace',
    '/farmer',
    '/consumer',
    '/bulk-buyer',
    '/delivery',
    '/admin',
    '/orders',
    '/profile',
  ],
};

export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || ROLE_ALLOWED_ROUTES.consumer;
  return allowedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
