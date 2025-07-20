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
      commission_distributions: {
        Row: {
          commission_amount: number
          commission_rate: number
          contribution_score: number | null
          created_at: string | null
          distribution_type: string | null
          id: string
          order_id: string
          order_total: number
          share_chain_id: string
          sheet_id: string
          user_id: string
        }
        Insert: {
          commission_amount: number
          commission_rate: number
          contribution_score?: number | null
          created_at?: string | null
          distribution_type?: string | null
          id?: string
          order_id: string
          order_total: number
          share_chain_id: string
          sheet_id: string
          user_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          contribution_score?: number | null
          created_at?: string | null
          distribution_type?: string | null
          id?: string
          order_id?: string
          order_total?: number
          share_chain_id?: string
          sheet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_distributions_share_chain_id_fkey"
            columns: ["share_chain_id"]
            isOneToOne: false
            referencedRelation: "share_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_distributions_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "quotations"
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
          {
            foreignKeyName: "fk_customer_invitations_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      distribution_applications: {
        Row: {
          applicant_id: string
          application_reason: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          application_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          application_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_distribution_applications_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      distribution_authorizations: {
        Row: {
          authorized_at: string
          created_at: string
          distributor_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_markup_percentage: number | null
          supplier_id: string
        }
        Insert: {
          authorized_at?: string
          created_at?: string
          distributor_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_markup_percentage?: number | null
          supplier_id: string
        }
        Update: {
          authorized_at?: string
          created_at?: string
          distributor_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_markup_percentage?: number | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_distribution_authorizations_distributor"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_distribution_authorizations_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
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
            foreignKeyName: "fk_order_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          origin_supplier_id: string | null
          rebate_chain: string | null
          rebate_total: number | null
          share_chain_id: string | null
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
          origin_supplier_id?: string | null
          rebate_chain?: string | null
          rebate_total?: number | null
          share_chain_id?: string | null
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
          origin_supplier_id?: string | null
          rebate_chain?: string | null
          rebate_total?: number | null
          share_chain_id?: string | null
          sheet_id?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_share_chain_id_fkey"
            columns: ["share_chain_id"]
            isOneToOne: false
            referencedRelation: "share_chains"
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
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
        }
        Insert: {
          created_at?: string
          custom_price?: number | null
          id?: string
          markup_percentage?: number | null
          position?: number | null
          product_id: string
          product_list_id: string
        }
        Update: {
          created_at?: string
          custom_price?: number | null
          id?: string
          markup_percentage?: number | null
          position?: number | null
          product_id?: string
          product_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_list_items_list"
            columns: ["product_list_id"]
            isOneToOne: false
            referencedRelation: "product_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_list_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          share_code?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          share_code?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_lists_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          original_price: number | null
          price: number | null
          product_id: string
          sku: string
          stock: number
          updated_at: string
          variant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          original_price?: number | null
          price?: number | null
          product_id: string
          sku: string
          stock?: number
          updated_at?: string
          variant_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          original_price?: number | null
          price?: number | null
          product_id?: string
          sku?: string
          stock?: number
          updated_at?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          supplier_id: string
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
          supplier_id: string
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
          supplier_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_videos_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
          },
        ]
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
          quantity: number
          quotation_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          markup_percentage?: number | null
          product_id: string
          quantity?: number
          quotation_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          markup_percentage?: number | null
          product_id?: string
          quantity?: number
          quotation_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quotation_items_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
          origin_supplier_id: string | null
          product_list_id: string
          rebate_total: number | null
          sheet_name: string | null
          sheet_type: string | null
          status: string
          supplier_id: string
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
          origin_supplier_id?: string | null
          product_list_id: string
          rebate_total?: number | null
          sheet_name?: string | null
          sheet_type?: string | null
          status?: string
          supplier_id: string
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
          origin_supplier_id?: string | null
          product_list_id?: string
          rebate_total?: number | null
          sheet_name?: string | null
          sheet_type?: string | null
          status?: string
          supplier_id?: string
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
          {
            foreignKeyName: "fk_quotations_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_credentials"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      share_chains: {
        Row: {
          children_count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          parent_id: string | null
          share_code: string
          share_depth: number | null
          sheet_id: string
          total_commission: number | null
          total_orders: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          children_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          share_code: string
          share_depth?: number | null
          sheet_id: string
          total_commission?: number | null
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          children_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          share_code?: string
          share_depth?: number | null
          sheet_id?: string
          total_commission?: number | null
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_chains_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "share_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_chains_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_credentials: {
        Row: {
          business_license: string | null
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verification_date: string | null
          verification_status: string
        }
        Insert: {
          business_license?: string | null
          company_name: string
          contact_email: string
          contact_person: string
          contact_phone: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verification_date?: string | null
          verification_status?: string
        }
        Update: {
          business_license?: string | null
          company_name?: string
          contact_email?: string
          contact_person?: string
          contact_phone?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verification_date?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_credentials_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_footprints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      variant_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string
          created_at: string
          id: string
          variant_id: string
        }
        Insert: {
          attribute_name: string
          attribute_value: string
          created_at?: string
          id?: string
          variant_id: string
        }
        Update: {
          attribute_name?: string
          attribute_value?: string
          created_at?: string
          id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_attributes_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      video_product_associations: {
        Row: {
          created_at: string
          id: string
          product_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_video_product_associations_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wishlist_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
