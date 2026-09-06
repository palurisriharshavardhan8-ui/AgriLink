import { UserRoleOption } from '@/types';

export const APP_NAME = 'AgriLink';
export const PROBLEM_STATEMENT_ID = 'SIH26033';
export const APP_TAGLINE = 'Farm-to-Consumer Direct Marketplace & AI Logistics';

export const AGRI_ROLES: UserRoleOption[] = [
  {
    id: 'farmer_fpo',
    label: 'Farmer / FPO',
    description: 'Create produce listings, discover fair mandi pricing, and manage farm sales.',
    badgeVariant: 'evergreen',
  },
  {
    id: 'consumer',
    label: 'Consumer',
    description: 'Purchase fresh, local produce directly from farmers with transparent pricing.',
    badgeVariant: 'sprout',
  },
  {
    id: 'bulk_buyer',
    label: 'Bulk Buyer',
    description: 'Source high-volume produce directly from FPOs and verified regional farms.',
    badgeVariant: 'harvest',
  },
  {
    id: 'delivery_partner',
    label: 'Delivery Partner',
    description: 'Fulfill optimized hyperlocal and community cart logistics routes.',
    badgeVariant: 'sand',
  },
  {
    id: 'admin',
    label: 'Platform Admin',
    description: 'Monitor ecosystem health, quality compliance, and ONDC network operations.',
    badgeVariant: 'earth',
  },
];
