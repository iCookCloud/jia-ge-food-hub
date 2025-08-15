export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
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
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount: number
          expires_at: string | null
          id: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string | null
          discount: number
          expires_at?: string | null
          id?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          discount?: number
          expires_at?: string | null
          id?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      customer_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          customer_email: string
          customer_name: string | null
          expires_at: string
          id: string
          invitation_code: string
          product_list_id: string
          status: string
          supplier_id: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          customer_email: string
          customer_name?: string | null
          expires_at?: string
          id?: string
          invitation_code: string
          product_list_id: string
          status?: string
          supplier_id: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          expires_at?: string
          id?: string
          invitation_code?: string
          product_list_id?: string
          status?: string
          supplier_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_invitations_product_list"
            columns: ["product_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
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
      orders: {
        Row: {
          created_at: string | null
          id: string
          sheet_id: string | null
          shipping_address: string | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sheet_id?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sheet_id?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
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
          user_id: string | null
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
          user_id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
          user_id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      uploaded_images: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          category: string
          tags: string[]
          file_path: string
          public_url: string
          file_size: number
          mime_type: string
          uploaded_by: string
          bucket_name: string
          folder_path: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          category?: string
          tags?: string[]
          file_path: string
          public_url: string
          file_size: number
          mime_type: string
          uploaded_by: string
          bucket_name: string
          folder_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          category?: string
          tags?: string[]
          file_path?: string
          public_url?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string
          bucket_name?: string
          folder_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      image_product_associations: {
        Row: {
          id: string
          image_id: string
          original_product_id: string
          product_snapshot: Json
          product_sku: string
          product_name: string
          snapshot_source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_id: string
          original_product_id: string
          product_snapshot: Json
          product_sku: string
          product_name: string
          snapshot_source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_id?: string
          original_product_id?: string
          product_snapshot?: Json
          product_sku?: string
          product_name?: string
          snapshot_source?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_product_associations_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "uploaded_images"
            referencedColumns: ["id"]
          }
        ]
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
          cloudflare_video_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          status: string
          supplier_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          cloudflare_video_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          status?: string
          supplier_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          cloudflare_video_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          status?: string
          supplier_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
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
          outer_box_dimensions: string | null
          outer_size_cm: string | null
          package_outer_size: string | null
          price: string | null
          product_image: string | null
          quantity: string | null
          remarks: string | null
          requires_cold_chain: boolean | null
          requires_fda_label: boolean | null
          sku: string
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
          outer_box_dimensions?: string | null
          outer_size_cm?: string | null
          package_outer_size?: string | null
          price?: string | null
          product_image?: string | null
          quantity?: string | null
          remarks?: string | null
          requires_cold_chain?: boolean | null
          requires_fda_label?: boolean | null
          sku: string
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
          outer_box_dimensions?: string | null
          outer_size_cm?: string | null
          package_outer_size?: string | null
          price?: string | null
          product_image?: string | null
          quantity?: string | null
          remarks?: string | null
          requires_cold_chain?: boolean | null
          requires_fda_label?: boolean | null
          sku?: string
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
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          nickname: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          nickname?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          nickname?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      user_coupons: {
        Row: {
          coupon_id: string | null
          id: string
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          id?: string
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          id?: string
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "profiles"
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
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          product_snapshot: Json | null
          snapshot_source: string | null
          snapshot_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          snapshot_source?: string | null
          snapshot_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          product_sku?: string | null
          product_snapshot?: Json | null
          snapshot_source?: string | null
          snapshot_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          user_uuid: string
          required_role: Database["public"]["Enums"]["user_role"]
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