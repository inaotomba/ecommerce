export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          country: string;
          created_at: string | null;
          full_name: string;
          id: string;
          is_default: boolean | null;
          phone: string | null;
          postal_code: string;
          profile_id: string;
          state: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          country: string;
          created_at?: string | null;
          full_name: string;
          id?: string;
          is_default?: boolean | null;
          phone?: string | null;
          postal_code: string;
          profile_id: string;
          state: string;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          country?: string;
          created_at?: string | null;
          full_name?: string;
          id?: string;
          is_default?: boolean | null;
          phone?: string | null;
          postal_code?: string;
          profile_id?: string;
          state?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string | null;
          id: string;
          product_id: string;
          quantity: number;
          unit_price_snapshot: number;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          cart_id: string;
          created_at?: string | null;
          id?: string;
          product_id: string;
          quantity: number;
          unit_price_snapshot: number;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          cart_id?: string;
          created_at?: string | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_snapshot?: number;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [];
      };
      carts: {
        Row: {
          created_at: string | null;
          id: string;
          profile_id: string | null;
          session_id: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          profile_id?: string | null;
          session_id?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          profile_id?: string | null;
          session_id?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          message: string;
          name: string;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          message: string;
          name: string;
          status?: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          status?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          source: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          source?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          source?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          id: string;
          line_total: number;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          quantity: number;
          size_snapshot: string | null;
          sku_snapshot: string | null;
          unit_price_snapshot: number;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          line_total: number;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          quantity: number;
          size_snapshot?: string | null;
          sku_snapshot?: string | null;
          unit_price_snapshot: number;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          line_total?: number;
          order_id?: string;
          product_id?: string;
          product_name_snapshot?: string;
          quantity?: number;
          size_snapshot?: string | null;
          sku_snapshot?: string | null;
          unit_price_snapshot?: number;
          variant_id?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          billing_address_snapshot: Json | null;
          created_at: string | null;
          discount_amount: number;
          fulfillment_status: string;
          guest_email: string | null;
          id: string;
          order_number: string;
          payment_status: string;
          profile_id: string | null;
          shipping_address_snapshot: Json | null;
          shipping_amount: number;
          status: string;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          billing_address_snapshot?: Json | null;
          created_at?: string | null;
          discount_amount?: number;
          fulfillment_status?: string;
          guest_email?: string | null;
          id?: string;
          order_number: string;
          payment_status?: string;
          profile_id?: string | null;
          shipping_address_snapshot?: Json | null;
          shipping_amount?: number;
          status?: string;
          subtotal: number;
          tax_amount?: number;
          total_amount: number;
          updated_at?: string | null;
        };
        Update: {
          billing_address_snapshot?: Json | null;
          created_at?: string | null;
          discount_amount?: number;
          fulfillment_status?: string;
          guest_email?: string | null;
          id?: string;
          order_number?: string;
          payment_status?: string;
          profile_id?: string | null;
          shipping_address_snapshot?: Json | null;
          shipping_amount?: number;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string | null;
          id: string;
          image_type: string | null;
          image_url: string;
          product_id: string;
          sort_order: number | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string | null;
          id?: string;
          image_type?: string | null;
          image_url: string;
          product_id: string;
          sort_order?: number | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string | null;
          id?: string;
          image_type?: string | null;
          image_url?: string;
          product_id?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          color: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          product_id: string;
          size: string;
          sku: string | null;
          stock_quantity: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id: string;
          size: string;
          sku?: string | null;
          stock_quantity?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          product_id?: string;
          size?: string;
          sku?: string | null;
          stock_quantity?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_new: boolean | null;
          is_sale: boolean | null;
          label: string | null;
          name: string;
          original_price: number | null;
          price: number;
          release_order: number | null;
          short_description: string | null;
          slug: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_new?: boolean | null;
          is_sale?: boolean | null;
          label?: string | null;
          name: string;
          original_price?: number | null;
          price: number;
          release_order?: number | null;
          short_description?: string | null;
          slug: string;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_new?: boolean | null;
          is_sale?: boolean | null;
          label?: string | null;
          name?: string;
          original_price?: number | null;
          price?: number;
          release_order?: number | null;
          short_description?: string | null;
          slug?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string;
          profile_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order_from_checkout: {
        Args: {
          p_billing_address: Json;
          p_items: Json;
          p_shipping_address: Json;
          p_shipping_method?: string;
        };
        Returns: Json;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
