export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_attributes: {
        Row: {
          attribute_name: string
          attribute_type: string
          category_id: number
          created_at: string | null
          id: number
          is_active: boolean | null
          is_required: boolean | null
          options: Json | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          attribute_name: string
          attribute_type: string
          category_id: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          attribute_name?: string
          attribute_type?: string
          category_id?: number
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          is_required?: boolean | null
          options?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_category_info"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["primary_category_id"]
          },
        ]
      }
      chat_negotiations: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          message_content: string
          message_type: string
          order_list_id: string
          price_status: string | null
          proposed_price: number | null
          quotation_id: string
          sender_id: string
          supplier_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          message_content: string
          message_type: string
          order_list_id: string
          price_status?: string | null
          proposed_price?: number | null
          quotation_id: string
          sender_id: string
          supplier_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          message_content?: string
          message_type?: string
          order_list_id?: string
          price_status?: string | null
          proposed_price?: number | null
          quotation_id?: string
          sender_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_negotiations_order_list_id_fkey"
            columns: ["order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_negotiations_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      image_product_associations: {
        Row: {
          created_at: string | null
          id: string
          image_id: string
          original_product_id: string
          product_name: string
          product_sku: string
          product_snapshot: Json
          snapshot_source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_id: string
          original_product_id: string
          product_name: string
          product_sku: string
          product_snapshot: Json
          snapshot_source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_id?: string
          original_product_id?: string
          product_name?: string
          product_sku?: string
          product_snapshot?: Json
          snapshot_source?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_product_associations_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "uploaded_images"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          product_snapshot: Json | null
          quantity: number
          snapshot_source: string | null
          snapshot_time: string | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          snapshot_source?: string | null
          snapshot_time?: string | null
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          snapshot_source?: string | null
          snapshot_time?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_list_quotations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          generated_order_id: string | null
          id: string
          message: string | null
          order_list_id: string
          original_total_amount: number | null
          quoted_by: string
          quoted_items: Json | null
          quoted_total_amount: number | null
          shared_by: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          generated_order_id?: string | null
          id?: string
          message?: string | null
          order_list_id: string
          original_total_amount?: number | null
          quoted_by: string
          quoted_items?: Json | null
          quoted_total_amount?: number | null
          shared_by: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          generated_order_id?: string | null
          id?: string
          message?: string | null
          order_list_id?: string
          original_total_amount?: number | null
          quoted_by?: string
          quoted_items?: Json | null
          quoted_total_amount?: number | null
          shared_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_list_quotations_generated_order_id_fkey"
            columns: ["generated_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_order_list_id_fkey"
            columns: ["order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_quoted_by_fkey"
            columns: ["quoted_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_quoted_by_fkey"
            columns: ["quoted_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_quoted_by_fkey"
            columns: ["quoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_quotations_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_list_responses: {
        Row: {
          created_at: string | null
          expires_at: string | null
          forwarded_order_list_id: string | null
          id: string
          message: string | null
          modified_items: Json
          modified_total_amount: number | null
          original_order_list_id: string
          original_total_amount: number | null
          received_by: string
          response_type: string
          shared_by: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          forwarded_order_list_id?: string | null
          id?: string
          message?: string | null
          modified_items?: Json
          modified_total_amount?: number | null
          original_order_list_id: string
          original_total_amount?: number | null
          received_by: string
          response_type: string
          shared_by: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          forwarded_order_list_id?: string | null
          id?: string
          message?: string | null
          modified_items?: Json
          modified_total_amount?: number | null
          original_order_list_id?: string
          original_total_amount?: number | null
          received_by?: string
          response_type?: string
          shared_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_list_responses_forwarded_order_list_id_fkey"
            columns: ["forwarded_order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_original_order_list_id_fkey"
            columns: ["original_order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_responses_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_list_shares: {
        Row: {
          created_at: string | null
          id: string
          order_list_id: string
          quotation_id: string | null
          quoted_at: string | null
          responded_at: string | null
          response_id: string | null
          share_message: string | null
          shared_at: string | null
          shared_by: string
          shared_to: string
          shared_to_type: string | null
          status: string | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_list_id: string
          quotation_id?: string | null
          quoted_at?: string | null
          responded_at?: string | null
          response_id?: string | null
          share_message?: string | null
          shared_at?: string | null
          shared_by: string
          shared_to: string
          shared_to_type?: string | null
          status?: string | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_list_id?: string
          quotation_id?: string | null
          quoted_at?: string | null
          responded_at?: string | null
          response_id?: string | null
          share_message?: string | null
          shared_at?: string | null
          shared_by?: string
          shared_to?: string
          shared_to_type?: string | null
          status?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_list_shares_order_list_id_fkey"
            columns: ["order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "order_list_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "order_list_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_shared_to_fkey"
            columns: ["shared_to"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_shared_to_fkey"
            columns: ["shared_to"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_list_shares_shared_to_fkey"
            columns: ["shared_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          design_case_id: number | null
          estimated_completion_date: string | null
          id: string
          installation_required: boolean | null
          is_confirmed: boolean | null
          project_type: string | null
          quotation_id: string | null
          sheet_id: string | null
          shipping_address: string | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          design_case_id?: number | null
          estimated_completion_date?: string | null
          id?: string
          installation_required?: boolean | null
          is_confirmed?: boolean | null
          project_type?: string | null
          quotation_id?: string | null
          sheet_id?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          design_case_id?: number | null
          estimated_completion_date?: string | null
          id?: string
          installation_required?: boolean | null
          is_confirmed?: boolean | null
          project_type?: string | null
          quotation_id?: string | null
          sheet_id?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "order_list_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attribute_values: {
        Row: {
          attribute_id: number
          created_at: string | null
          id: number
          product_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          attribute_id: number
          created_at?: string | null
          id?: number
          product_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          attribute_id?: number
          created_at?: string | null
          id?: number
          product_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "category_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          level: number
          metadata: Json | null
          name: string
          parent_id: number | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          level?: number
          metadata?: Json | null
          name: string
          parent_id?: number | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          level?: number
          metadata?: Json | null
          name?: string
          parent_id?: number | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_category_info"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["primary_category_id"]
          },
        ]
      }
      product_category_relations: {
        Row: {
          category_id: number
          created_at: string | null
          id: number
          is_primary: boolean | null
          product_id: string
        }
        Insert: {
          category_id: number
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          product_id: string
        }
        Update: {
          category_id?: number
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_category_info"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "product_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "products_with_categories"
            referencedColumns: ["primary_category_id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      product_list_items: {
        Row: {
          created_at: string
          custom_price: number | null
          id: string
          markup_percentage: number | null
          position: number | null
          product_id: string
          product_list_id: string
          product_name: string | null
          product_sku: string | null
          product_snapshot: Json | null
          quantity: number | null
          snapshot_source: string | null
          snapshot_time: string | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          custom_price?: number | null
          id?: string
          markup_percentage?: number | null
          position?: number | null
          product_id: string
          product_list_id: string
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number | null
          snapshot_source?: string | null
          snapshot_time?: string | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          custom_price?: number | null
          id?: string
          markup_percentage?: number | null
          position?: number | null
          product_id?: string
          product_list_id?: string
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number | null
          snapshot_source?: string | null
          snapshot_time?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_list_items_list"
            columns: ["product_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          share_code: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          share_code?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          share_code?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_videos: {
        Row: {
          category: string | null
          cloudflare_video_id: string | null
          content: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          status: string
          supplier_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          cloudflare_video_id?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          status?: string
          supplier_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          cloudflare_video_id?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          status?: string
          supplier_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      product_view_history: {
        Row: {
          created_at: string | null
          id: number
          product_category: string | null
          product_id: string
          product_name: string | null
          referrer_id: string | null
          referrer_type: string | null
          user_id: string | null
          view_duration: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          product_category?: string | null
          product_id: string
          product_name?: string | null
          referrer_id?: string | null
          referrer_type?: string | null
          user_id?: string | null
          view_duration?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          product_category?: string | null
          product_id?: string
          product_name?: string | null
          referrer_id?: string | null
          referrer_type?: string | null
          user_id?: string | null
          view_duration?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_chinese: string | null
          category_english: string | null
          category_id: string | null
          created_at: string | null
          ctn: string | null
          dimensions_cm: string | null
          id: string
          is_active: boolean | null
          is_fragile: boolean | null
          is_public: boolean | null
          last_sync_at: string | null
          outer_box_dimensions: string | null
          outer_size_cm: string | null
          package_outer_size: string | null
          price: string | null
          product_image: string | null
          quantity: string | null
          remarks: string | null
          requires_cold_chain: boolean | null
          requires_fda_label: boolean | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sku: string
          source_id: string | null
          source_type: string | null
          specification: string | null
          specifications: string | null
          standard_chinese_name: string | null
          standard_english_name: string | null
          storage_requirements: string | null
          subcategory: string | null
          type: string | null
          unit: string | null
          unit_price: string | null
          updated_at: string | null
          user_id: string | null
          vendor: string | null
          Vendor: string | null
          volume_cbm: string | null
        }
        Insert: {
          category_chinese?: string | null
          category_english?: string | null
          category_id?: string | null
          created_at?: string | null
          ctn?: string | null
          dimensions_cm?: string | null
          id: string
          is_active?: boolean | null
          is_fragile?: boolean | null
          is_public?: boolean | null
          last_sync_at?: string | null
          outer_box_dimensions?: string | null
          outer_size_cm?: string | null
          package_outer_size?: string | null
          price?: string | null
          product_image?: string | null
          quantity?: string | null
          remarks?: string | null
          requires_cold_chain?: boolean | null
          requires_fda_label?: boolean | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku: string
          source_id?: string | null
          source_type?: string | null
          specification?: string | null
          specifications?: string | null
          standard_chinese_name?: string | null
          standard_english_name?: string | null
          storage_requirements?: string | null
          subcategory?: string | null
          type?: string | null
          unit?: string | null
          unit_price?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor?: string | null
          Vendor?: string | null
          volume_cbm?: string | null
        }
        Update: {
          category_chinese?: string | null
          category_english?: string | null
          category_id?: string | null
          created_at?: string | null
          ctn?: string | null
          dimensions_cm?: string | null
          id?: string
          is_active?: boolean | null
          is_fragile?: boolean | null
          is_public?: boolean | null
          last_sync_at?: string | null
          outer_box_dimensions?: string | null
          outer_size_cm?: string | null
          package_outer_size?: string | null
          price?: string | null
          product_image?: string | null
          quantity?: string | null
          remarks?: string | null
          requires_cold_chain?: boolean | null
          requires_fda_label?: boolean | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string
          source_id?: string | null
          source_type?: string | null
          specification?: string | null
          specifications?: string | null
          standard_chinese_name?: string | null
          standard_english_name?: string | null
          storage_requirements?: string | null
          subcategory?: string | null
          type?: string | null
          unit?: string | null
          unit_price?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor?: string | null
          Vendor?: string | null
          volume_cbm?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          business_license: string | null
          company_address: string | null
          company_description: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          id: string
          is_supplier: boolean | null
          nickname: string | null
          phone: string | null
          supplier_applied_at: string | null
          supplier_approved_at: string | null
          supplier_approved_by: string | null
          supplier_status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_license?: string | null
          company_address?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          id: string
          is_supplier?: boolean | null
          nickname?: string | null
          phone?: string | null
          supplier_applied_at?: string | null
          supplier_approved_at?: string | null
          supplier_approved_by?: string | null
          supplier_status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_license?: string | null
          company_address?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          id?: string
          is_supplier?: boolean | null
          nickname?: string | null
          phone?: string | null
          supplier_applied_at?: string | null
          supplier_approved_at?: string | null
          supplier_approved_by?: string | null
          supplier_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_supplier_approved_by_fkey"
            columns: ["supplier_approved_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supplier_approved_by_fkey"
            columns: ["supplier_approved_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supplier_approved_by_fkey"
            columns: ["supplier_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participants: Json
          quotation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participants: Json
          quotation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participants?: Json
          quotation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_conversations_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          id: string
          markup_percentage: number | null
          product_id: string
          product_name: string | null
          product_sku: string | null
          product_snapshot: Json | null
          quantity: number
          quotation_id: string
          snapshot_source: string | null
          snapshot_time: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          markup_percentage?: number | null
          product_id: string
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          quotation_id: string
          snapshot_source?: string | null
          snapshot_time?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          markup_percentage?: number | null
          product_id?: string
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          quotation_id?: string
          snapshot_source?: string | null
          snapshot_time?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotation_items_quotation"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_id: string | null
          has_messages: boolean | null
          id: string
          is_shareable: boolean | null
          last_message_at: string | null
          markup_percentage: number | null
          notes: string | null
          product_list_id: string
          sheet_name: string | null
          sheet_type: string | null
          status: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          has_messages?: boolean | null
          id?: string
          is_shareable?: boolean | null
          last_message_at?: string | null
          markup_percentage?: number | null
          notes?: string | null
          product_list_id: string
          sheet_name?: string | null
          sheet_type?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          has_messages?: boolean | null
          id?: string
          is_shareable?: boolean | null
          last_message_at?: string | null
          markup_percentage?: number | null
          notes?: string | null
          product_list_id?: string
          sheet_name?: string | null
          sheet_type?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotations_product_list"
            columns: ["product_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_feedback: {
        Row: {
          action: string
          created_at: string | null
          id: number
          metadata: Json | null
          product_id: string
          recommendation_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          product_id: string
          recommendation_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: number
          metadata?: Json | null
          product_id?: string
          recommendation_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recommendation_quality: {
        Row: {
          algorithm_version: string | null
          computed_at: string | null
          diversity_score: number | null
          id: number
          novelty_score: number | null
          precision_score: number | null
          recall_score: number | null
          recommendation_session_id: string | null
          user_satisfaction: number | null
        }
        Insert: {
          algorithm_version?: string | null
          computed_at?: string | null
          diversity_score?: number | null
          id?: number
          novelty_score?: number | null
          precision_score?: number | null
          recall_score?: number | null
          recommendation_session_id?: string | null
          user_satisfaction?: number | null
        }
        Update: {
          algorithm_version?: string | null
          computed_at?: string | null
          diversity_score?: number | null
          id?: number
          novelty_score?: number | null
          precision_score?: number | null
          recall_score?: number | null
          recommendation_session_id?: string | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_quality_recommendation_session_id_fkey"
            columns: ["recommendation_session_id"]
            isOneToOne: false
            referencedRelation: "recommendation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_sessions: {
        Row: {
          context_data: Json
          conversion_count: number | null
          created_at: string | null
          id: string
          interactions_count: number | null
          recommendations_count: number | null
          session_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_data?: Json
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          interactions_count?: number | null
          recommendations_count?: number | null
          session_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_data?: Json
          conversion_count?: number | null
          created_at?: string | null
          id?: string
          interactions_count?: number | null
          recommendations_count?: number | null
          session_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          product_id: string | null
          rating: number
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating: number
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      supplier_profiles: {
        Row: {
          business_license: string | null
          company_name: string | null
          contact_info: Json | null
          created_at: string | null
          delivery_info: Json | null
          id: string
          is_active: boolean | null
          name: string
          product_categories: string[] | null
          quality_certifications: string[] | null
          rating_info: Json | null
          service_areas: string[] | null
          updated_at: string | null
          verification_date: string | null
          verification_status: string | null
        }
        Insert: {
          business_license?: string | null
          company_name?: string | null
          contact_info?: Json | null
          created_at?: string | null
          delivery_info?: Json | null
          id: string
          is_active?: boolean | null
          name: string
          product_categories?: string[] | null
          quality_certifications?: string[] | null
          rating_info?: Json | null
          service_areas?: string[] | null
          updated_at?: string | null
          verification_date?: string | null
          verification_status?: string | null
        }
        Update: {
          business_license?: string | null
          company_name?: string | null
          contact_info?: Json | null
          created_at?: string | null
          delivery_info?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_categories?: string[] | null
          quality_certifications?: string[] | null
          rating_info?: Json | null
          service_areas?: string[] | null
          updated_at?: string | null
          verification_date?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      supplier_quotations: {
        Row: {
          buyer_confirmed: boolean | null
          buyer_id: string
          created_at: string | null
          current_amount: number
          id: string
          negotiation_count: number | null
          order_list_id: string
          original_amount: number
          status: string
          supplier_confirmed: boolean | null
          supplier_id: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_confirmed?: boolean | null
          buyer_id: string
          created_at?: string | null
          current_amount: number
          id?: string
          negotiation_count?: number | null
          order_list_id: string
          original_amount: number
          status?: string
          supplier_confirmed?: boolean | null
          supplier_id: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_confirmed?: boolean | null
          buyer_id?: string
          created_at?: string | null
          current_amount?: number
          id?: string
          negotiation_count?: number | null
          order_list_id?: string
          original_amount?: number
          status?: string
          supplier_confirmed?: boolean | null
          supplier_id?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_order_list_id_fkey"
            columns: ["order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_ratings: {
        Row: {
          created_at: string | null
          delivery_rating: number | null
          id: number
          images: string[] | null
          order_id: string | null
          quality_rating: number | null
          rating: number | null
          review: string | null
          service_rating: number | null
          supplier_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_rating?: number | null
          id?: number
          images?: string[] | null
          order_id?: string | null
          quality_rating?: number | null
          rating?: number | null
          review?: string | null
          service_rating?: number | null
          supplier_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_rating?: number | null
          id?: number
          images?: string[] | null
          order_id?: string | null
          quality_rating?: number | null
          rating?: number | null
          review?: string | null
          service_rating?: number | null
          supplier_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      uploaded_images: {
        Row: {
          bucket_name: string
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number
          folder_path: string | null
          id: string
          images_data: Json | null
          is_active: boolean | null
          mime_type: string
          public_url: string
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          bucket_name: string
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size: number
          folder_path?: string | null
          id?: string
          images_data?: Json | null
          is_active?: boolean | null
          mime_type: string
          public_url: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          bucket_name?: string
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number
          folder_path?: string | null
          id?: string
          images_data?: Json | null
          is_active?: boolean | null
          mime_type?: string
          public_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      user_footprints: {
        Row: {
          id: string
          product_id: string | null
          user_id: string
          visited_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          user_id: string
          visited_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          user_id?: string
          visited_at?: string | null
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          quotation_id: string | null
          receiver_id: string
          referenced_order_list_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          quotation_id?: string | null
          receiver_id: string
          referenced_order_list_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          quotation_id?: string | null
          receiver_id?: string
          referenced_order_list_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_referenced_order_list_id_fkey"
            columns: ["referenced_order_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_preferences: {
        Row: {
          brand_preferences: string[] | null
          id: number
          last_activity_at: string | null
          price_priority: number | null
          price_range_max: number | null
          price_range_min: number | null
          product_category: string[] | null
          quality_priority: number | null
          recent_cases: number[] | null
          recent_views: string[] | null
          style_preference: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand_preferences?: string[] | null
          id?: number
          last_activity_at?: string | null
          price_priority?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          product_category?: string[] | null
          quality_priority?: number | null
          recent_cases?: number[] | null
          recent_views?: string[] | null
          style_preference?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand_preferences?: string[] | null
          id?: number
          last_activity_at?: string | null
          price_priority?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          product_category?: string[] | null
          quality_priority?: number | null
          recent_cases?: number[] | null
          recent_views?: string[] | null
          style_preference?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "available_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_product_associations: {
        Row: {
          created_at: string
          id: string
          original_product_id: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          product_snapshot: Json | null
          snapshot_source: string | null
          snapshot_time: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_product_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          snapshot_source?: string | null
          snapshot_time?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_product_id?: string | null
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          snapshot_source?: string | null
          snapshot_time?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_video_product_associations_video"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "product_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_users_view: {
        Row: {
          auth_created_at: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string | null
          nickname: string | null
          phone: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      available_suppliers: {
        Row: {
          avatar_url: string | null
          company_address: string | null
          company_description: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          id: string | null
          nickname: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_address?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          id?: string | null
          nickname?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_address?: string | null
          company_description?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          id?: string | null
          nickname?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_paths: {
        Row: {
          full_path: string | null
          full_slug_path: string | null
          id: number | null
          is_active: boolean | null
          level: number | null
          name: string | null
          parent_id: number | null
          path_ids: number[] | null
          path_names: string[] | null
          path_slugs: string[] | null
          slug: string | null
          sort_order: number | null
        }
        Relationships: []
      }
      category_statistics: {
        Row: {
          level1_count: number | null
          level2_count: number | null
          level3_count: number | null
          total_categories: number | null
        }
        Relationships: []
      }
      materials_unified: {
        Row: {
          bucket_name: string | null
          category: string | null
          cloudflare_video_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_path: string | null
          file_size: number | null
          folder_path: string | null
          id: string | null
          mime_type: string | null
          public_url: string | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          uploaded_by: string | null
          video_url: string | null
        }
        Relationships: []
      }
      product_category_info: {
        Row: {
          assigned_at: string | null
          category_id: number | null
          category_level: number | null
          category_name: string | null
          category_slug: string | null
          full_path: string | null
          full_slug_path: string | null
          is_primary: boolean | null
          path_ids: number[] | null
          path_names: string[] | null
          product_id: string | null
        }
        Relationships: []
      }
      products_with_categories: {
        Row: {
          all_category_ids: number[] | null
          all_category_names: string[] | null
          all_category_paths: string[] | null
          category_chinese: string | null
          category_english: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_fragile: boolean | null
          is_public: boolean | null
          outer_box_dimensions: string | null
          primary_category_id: number | null
          primary_category_level: number | null
          primary_category_name: string | null
          primary_category_path: string | null
          primary_category_path_ids: number[] | null
          primary_category_slug: string | null
          product_image: string | null
          quantity: string | null
          requires_cold_chain: boolean | null
          review_status: string | null
          search_text: string | null
          searchable_category_ids: number[] | null
          sku: string | null
          source_type: string | null
          specifications: string | null
          standard_chinese_name: string | null
          standard_english_name: string | null
          storage_requirements: string | null
          subcategory: string | null
          unit: string | null
          unit_price: string | null
          updated_at: string | null
          user_id: string | null
          vendor: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_unconfirmed_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      clean_old_view_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      confirm_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      create_supplier_quotation_order: {
        Args:
          | {
              p_buyer_user_id: string
              p_order_items: Json
              p_quotation_id: string
              p_supplier_user_id: string
              p_total_amount: number
            }
          | {
              p_buyer_user_id: string
              p_order_items: Json
              p_quotation_id: string
              p_total_amount: number
            }
        Returns: string
      }
      create_system_message: {
        Args: {
          p_buyer_id: string
          p_message_content: string
          p_order_list_id: string
          p_quotation_id: string
          p_supplier_id: string
        }
        Returns: string
      }
      ensure_user_is_supplier: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_verified_suppliers: {
        Args: { search_query?: string }
        Returns: {
          avatar_url: string
          company_name: string
          created_at: string
          id: string
          nickname: string
          verification_status: string
        }[]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "buyer" | "supplier" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["buyer", "supplier", "admin"],
    },
  },
} as const