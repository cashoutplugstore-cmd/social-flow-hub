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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          admin_note: string | null
          amount: number
          checkout_url: string | null
          created_at: string
          credited_at: string | null
          crypto_address: string | null
          crypto_amount: number | null
          crypto_confirmations: number
          currency: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          meta: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider: string | null
          provider_intent_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          checkout_url?: string | null
          created_at?: string
          credited_at?: string | null
          crypto_address?: string | null
          crypto_amount?: number | null
          crypto_confirmations?: number
          currency?: string
          expires_at?: string
          failure_reason?: string | null
          id?: string
          idempotency_key: string
          meta?: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider?: string | null
          provider_intent_id?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          checkout_url?: string | null
          created_at?: string
          credited_at?: string | null
          crypto_address?: string | null
          crypto_amount?: number | null
          crypto_confirmations?: number
          currency?: string
          expires_at?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string
          meta?: Json
          method?: Database["public"]["Enums"]["deposit_method"]
          provider?: string | null
          provider_intent_id?: string | null
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          updated_at?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_note: string | null
          created_at: string
          extra_note: string | null
          id: string
          order_number: number
          platform: string
          quantity: number
          service_id: string | null
          service_name: string
          status: Database["public"]["Enums"]["order_status"]
          target_input: string | null
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          extra_note?: string | null
          id?: string
          order_number?: number
          platform: string
          quantity: number
          service_id?: string | null
          service_name: string
          status?: Database["public"]["Enums"]["order_status"]
          target_input?: string | null
          total_price: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          extra_note?: string | null
          id?: string
          order_number?: number
          platform?: string
          quantity?: number
          service_id?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["order_status"]
          target_input?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deposit_request_id: string
          error_message: string | null
          id: string
          provider: string
          provider_intent_id: string | null
          raw: Json
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          deposit_request_id: string
          error_message?: string | null
          id?: string
          provider: string
          provider_intent_id?: string | null
          raw?: Json
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deposit_request_id?: string
          error_message?: string | null
          id?: string
          provider?: string
          provider_intent_id?: string | null
          raw?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_deposit_request_id_fkey"
            columns: ["deposit_request_id"]
            isOneToOne: false
            referencedRelation: "deposit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          deposit_request_id: string | null
          error_message: string | null
          event_id: string
          event_type: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          provider: string
          signature_verified: boolean
        }
        Insert: {
          created_at?: string
          deposit_request_id?: string | null
          error_message?: string | null
          event_id: string
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider: string
          signature_verified?: boolean
        }
        Update: {
          created_at?: string
          deposit_request_id?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          provider?: string
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_deposit_request_id_fkey"
            columns: ["deposit_request_id"]
            isOneToOne: false
            referencedRelation: "deposit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          meta: Json
          method: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          meta?: Json
          method: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          meta?: Json
          method?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_orders: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          last_sync_at: string | null
          order_id: string
          payload: Json
          provider_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          order_id: string
          payload?: Json
          provider_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync_at?: string | null
          order_id?: string
          payload?: Json
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          adapter: string
          api_base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          adapter?: string
          api_base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          adapter?: string
          api_base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_response: string | null
          comment: string | null
          created_at: string
          display_name: string | null
          id: string
          is_demo: boolean
          order_id: string | null
          rating: number
          service_id: string
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string | null
          verified_purchase: boolean
        }
        Insert: {
          admin_response?: string | null
          comment?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_demo?: boolean
          order_id?: string | null
          rating: number
          service_id: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_purchase?: boolean
        }
        Update: {
          admin_response?: string | null
          comment?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_demo?: boolean
          order_id?: string | null
          rating?: number
          service_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          user_id?: string | null
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          accent: string | null
          created_at: string
          description_ar: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          accent?: string | null
          created_at?: string
          description_ar?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string
          created_at: string
          delivery_time_ar: string
          description_ar: string | null
          id: string
          input_label_ar: string | null
          input_type: string
          instructions_ar: string | null
          is_active: boolean
          is_demo: boolean
          max_quantity: number
          min_quantity: number
          name_ar: string
          notes_ar: string | null
          popularity: number
          price_per_unit: number
          short_description_ar: string | null
          slug: string
          unit_size: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          delivery_time_ar?: string
          description_ar?: string | null
          id?: string
          input_label_ar?: string | null
          input_type?: string
          instructions_ar?: string | null
          is_active?: boolean
          is_demo?: boolean
          max_quantity?: number
          min_quantity?: number
          name_ar: string
          notes_ar?: string | null
          popularity?: number
          price_per_unit?: number
          short_description_ar?: string | null
          slug: string
          unit_size?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          delivery_time_ar?: string
          description_ar?: string | null
          id?: string
          input_label_ar?: string | null
          input_type?: string
          instructions_ar?: string | null
          is_active?: boolean
          is_demo?: boolean
          max_quantity?: number
          min_quantity?: number
          name_ar?: string
          notes_ar?: string | null
          popularity?: number
          price_per_unit?: number
          short_description_ar?: string | null
          slug?: string
          unit_size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_staff: boolean
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          department: string
          id: string
          priority: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          department?: string
          id?: string
          priority?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          department?: string
          id?: string
          priority?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          country_code: string | null
          created_at: string
          device: string | null
          id: string
          language: string | null
          path: string
          referrer_host: string | null
          session_hash: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          language?: string | null
          path: string
          referrer_host?: string | null
          session_hash: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          language?: string | null
          path?: string
          referrer_host?: string | null
          session_hash?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description_ar: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          description_ar?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description_ar?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          total_deposited: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_balance: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: number
      }
      admin_analytics: { Args: { _from: string; _to: string }; Returns: Json }
      admin_confirm_deposit: {
        Args: { _deposit_id: string; _reason: string }
        Returns: {
          admin_note: string | null
          amount: number
          checkout_url: string | null
          created_at: string
          credited_at: string | null
          crypto_address: string | null
          crypto_amount: number | null
          crypto_confirmations: number
          currency: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          meta: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider: string | null
          provider_intent_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deposit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_delete_review: { Args: { _review_id: string }; Returns: undefined }
      admin_moderate_review: {
        Args: {
          _response?: string
          _review_id: string
          _status: Database["public"]["Enums"]["review_status"]
        }
        Returns: {
          admin_response: string | null
          comment: string | null
          created_at: string
          display_name: string | null
          id: string
          is_demo: boolean
          order_id: string | null
          rating: number
          service_id: string
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string | null
          verified_purchase: boolean
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reject_deposit: {
        Args: { _deposit_id: string; _reason: string }
        Returns: {
          admin_note: string | null
          amount: number
          checkout_url: string | null
          created_at: string
          credited_at: string | null
          crypto_address: string | null
          crypto_amount: number | null
          crypto_confirmations: number
          currency: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          meta: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider: string | null
          provider_intent_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deposit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reply_ticket: {
        Args: {
          _body: string
          _status?: Database["public"]["Enums"]["ticket_status"]
          _ticket_id: string
        }
        Returns: undefined
      }
      admin_set_order_status: {
        Args: {
          _admin_note?: string
          _order_id: string
          _status: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          admin_note: string | null
          created_at: string
          extra_note: string | null
          id: string
          order_number: number
          platform: string
          quantity: number
          service_id: string | null
          service_name: string
          status: Database["public"]["Enums"]["order_status"]
          target_input: string | null
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_payment_status: {
        Args: {
          _payment_id: string
          _status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          meta: Json
          method: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_stats: { Args: never; Returns: Json }
      admin_toggle_user: {
        Args: { _active: boolean; _user_id: string }
        Returns: undefined
      }
      bootstrap_current_user: {
        Args: { _display_name?: string }
        Returns: undefined
      }
      create_deposit_request: {
        Args: {
          _amount: number
          _idempotency_key?: string
          _method: Database["public"]["Enums"]["deposit_method"]
        }
        Returns: {
          admin_note: string | null
          amount: number
          checkout_url: string | null
          created_at: string
          credited_at: string | null
          crypto_address: string | null
          crypto_amount: number | null
          crypto_confirmations: number
          currency: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          meta: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider: string | null
          provider_intent_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deposit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      credit_deposit_request: {
        Args: {
          _deposit_id: string
          _provider_reference?: string
          _source?: string
        }
        Returns: {
          admin_note: string | null
          amount: number
          checkout_url: string | null
          created_at: string
          credited_at: string | null
          crypto_address: string | null
          crypto_amount: number | null
          crypto_confirmations: number
          currency: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          meta: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider: string | null
          provider_intent_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deposit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      place_order: {
        Args: {
          _extra_note?: string
          _quantity: number
          _service_id: string
          _target_input: string
        }
        Returns: {
          admin_note: string | null
          created_at: string
          extra_note: string | null
          id: string
          order_number: number
          platform: string
          quantity: number
          service_id: string | null
          service_name: string
          status: Database["public"]["Enums"]["order_status"]
          target_input: string | null
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      public_stats: {
        Args: never
        Returns: {
          completed_orders: number
          total_orders: number
          total_services: number
          total_users: number
        }[]
      }
      request_topup: {
        Args: { _amount: number; _method: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          meta: Json
          method: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      service_rating_summary: {
        Args: never
        Returns: {
          avg_rating: number
          review_count: number
          service_id: string
        }[]
      }
      set_deposit_state: {
        Args: {
          _confirmations?: number
          _deposit_id: string
          _reason?: string
          _status: Database["public"]["Enums"]["deposit_status"]
        }
        Returns: {
          admin_note: string | null
          amount: number
          checkout_url: string | null
          created_at: string
          credited_at: string | null
          crypto_address: string | null
          crypto_amount: number | null
          crypto_confirmations: number
          currency: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          meta: Json
          method: Database["public"]["Enums"]["deposit_method"]
          provider: string | null
          provider_intent_id: string | null
          provider_reference: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deposit_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_review: {
        Args: {
          _comment?: string
          _order_id: string
          _rating: number
          _title?: string
        }
        Returns: {
          admin_response: string | null
          comment: string | null
          created_at: string
          display_name: string | null
          id: string
          is_demo: boolean
          order_id: string | null
          rating: number
          service_id: string
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          user_id: string | null
          verified_purchase: boolean
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      deposit_method:
        | "card"
        | "bitcoin"
        | "google_pay"
        | "bank_transfer"
        | "manual"
      deposit_status:
        | "pending"
        | "detected"
        | "confirmed"
        | "failed"
        | "expired"
        | "cancelled"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "completed"
        | "cancelled"
        | "refunded"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      review_status: "pending" | "approved" | "hidden" | "flagged"
      ticket_status: "open" | "pending" | "answered" | "closed"
      tx_type: "deposit" | "purchase" | "refund" | "adjustment"
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
      app_role: ["admin", "user"],
      deposit_method: [
        "card",
        "bitcoin",
        "google_pay",
        "bank_transfer",
        "manual",
      ],
      deposit_status: [
        "pending",
        "detected",
        "confirmed",
        "failed",
        "expired",
        "cancelled",
      ],
      order_status: [
        "pending",
        "paid",
        "processing",
        "completed",
        "cancelled",
        "refunded",
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      review_status: ["pending", "approved", "hidden", "flagged"],
      ticket_status: ["open", "pending", "answered", "closed"],
      tx_type: ["deposit", "purchase", "refund", "adjustment"],
    },
  },
} as const
