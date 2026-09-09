export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'farmer_fpo'
  | 'consumer'
  | 'bulk_buyer'
  | 'delivery_partner'
  | 'admin';

export type ProduceCategory =
  | 'vegetables'
  | 'fruits'
  | 'grains_pulses'
  | 'spices'
  | 'dairy_other';

export type OrderStatus =
  | 'pending'
  | 'community_grouped'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone_number: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      farms_fpos: {
        Row: {
          id: string;
          profile_id: string;
          organization_name: string;
          district: string | null;
          state: string | null;
          is_fpo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          organization_name: string;
          district?: string | null;
          state?: string | null;
          is_fpo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          organization_name?: string;
          district?: string | null;
          state?: string | null;
          is_fpo?: boolean;
          created_at?: string;
        };
      };
      produce_listings: {
        Row: {
          id: string;
          farmer_id: string;
          title: string;
          category: ProduceCategory;
          description: string | null;
          price_per_kg: number;
          mandi_benchmark_price: number | null;
          available_quantity_kg: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          title: string;
          category: ProduceCategory;
          description?: string | null;
          price_per_kg: number;
          mandi_benchmark_price?: number | null;
          available_quantity_kg: number;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          title?: string;
          category?: ProduceCategory;
          description?: string | null;
          price_per_kg?: number;
          mandi_benchmark_price?: number | null;
          available_quantity_kg?: number;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      community_carts: {
        Row: {
          id: string;
          sector_code: string;
          delivery_landmark: string | null;
          cart_status: string;
          target_discount_quantity_kg: number;
          current_aggregated_quantity_kg: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sector_code: string;
          delivery_landmark?: string | null;
          cart_status?: string;
          target_discount_quantity_kg?: number;
          current_aggregated_quantity_kg?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sector_code?: string;
          delivery_landmark?: string | null;
          cart_status?: string;
          target_discount_quantity_kg?: number;
          current_aggregated_quantity_kg?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          listing_id: string;
          community_cart_id: string | null;
          quantity_kg: number;
          total_price: number;
          status: OrderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          listing_id: string;
          community_cart_id?: string | null;
          quantity_kg: number;
          total_price: number;
          status?: OrderStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          listing_id?: string;
          community_cart_id?: string | null;
          quantity_kg?: number;
          total_price?: number;
          status?: OrderStatus;
          created_at?: string;
        };
      };
      delivery_tasks: {
        Row: {
          id: string;
          order_id: string;
          driver_id: string | null;
          pickup_location: string;
          delivery_location: string;
          status: DeliveryStatus;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          driver_id?: string | null;
          pickup_location: string;
          delivery_location: string;
          status?: DeliveryStatus;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          driver_id?: string | null;
          pickup_location?: string;
          delivery_location?: string;
          status?: DeliveryStatus;
          assigned_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      place_direct_order: {
        Args: {
          p_listing_id: string;
          p_quantity_kg: number;
        };
        Returns: Json;
      };
      cancel_order: {
        Args: {
          p_order_id: string;
        };
        Returns: Json;
      };
      confirm_order: {
        Args: {
          p_order_id: string;
        };
        Returns: Json;
      };
      dispatch_and_assign_delivery_job: {
        Args: {
          p_order_id: string;
          p_driver_id: string | null;
          p_pickup_location: string;
          p_delivery_location: string;
        };
        Returns: Json;
      };
      update_delivery_status: {
        Args: {
          p_task_id: string;
          p_status: DeliveryStatus;
        };
        Returns: Json;
      };
      get_available_delivery_partners: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          full_name: string | null;
          phone_number: string | null;
          email: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      produce_category: ProduceCategory;
      order_status: OrderStatus;
      delivery_status: DeliveryStatus;
    };
  };
}
