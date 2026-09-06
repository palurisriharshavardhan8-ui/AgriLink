/**
 * AgriLink Core User Roles
 * Preserving all 5 application roles as defined in product specification.
 */
export type UserRole =
  | 'farmer_fpo'
  | 'consumer'
  | 'bulk_buyer'
  | 'delivery_partner'
  | 'admin';

export interface UserRoleOption {
  id: UserRole;
  label: string;
  description: string;
  badgeVariant: 'evergreen' | 'sprout' | 'harvest' | 'sand' | 'earth';
}

export interface UserProfileShell {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface SystemStatus {
  status: 'operational' | 'maintenance';
  version: string;
  environment: string;
}
