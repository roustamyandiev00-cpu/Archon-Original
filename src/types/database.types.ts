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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bedrijf_reviews: {
        Row: {
          commentaar: string
          created_at: string
          id: string
          rating: number
          reviewer_company_id: number
          target_company_id: number
        }
        Insert: {
          commentaar: string
          created_at?: string
          id?: string
          rating: number
          reviewer_company_id: number
          target_company_id: number
        }
        Update: {
          commentaar?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_company_id?: number
          target_company_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bedrijf_reviews_reviewer_company_id_fkey"
            columns: ["reviewer_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bedrijf_reviews_reviewer_company_id_fkey"
            columns: ["reviewer_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bedrijf_reviews_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bedrijf_reviews_target_company_id_fkey"
            columns: ["target_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          }
        ]
      }
      dak_bedrijven: {
        Row: {
          adres: string | null
          beschrijving: string | null
          categorie: string
          created_at: string
          fotos: string[]
          id: number
          lat: number | null
          lng: number | null
          naam: string
          postcode: string | null
          regio: string | null
          stad: string | null
          telefoon: string | null
          toegevoegd_door: string | null
          website: string | null
        }
        Insert: {
          adres?: string | null
          beschrijving?: string | null
          categorie?: string
          created_at?: string
          fotos?: string[]
          id?: number
          lat?: number | null
          lng?: number | null
          naam: string
          postcode?: string | null
          regio?: string | null
          stad?: string | null
          telefoon?: string | null
          toegevoegd_door?: string | null
          website?: string | null
        }
        Update: {
          adres?: string | null
          beschrijving?: string | null
          categorie?: string
          created_at?: string
          fotos?: string[]
          id?: number
          lat?: number | null
          lng?: number | null
          naam?: string
          postcode?: string | null
          regio?: string | null
          stad?: string | null
          telefoon?: string | null
          toegevoegd_door?: string | null
          website?: string | null
        }
        Relationships: []
      }
      dak_bedrijf_reviews: {
        Row: {
          commentaar: string
          created_at: string
          dak_bedrijf_id: number
          id: string
          naam: string
          rating: number
        }
        Insert: {
          commentaar: string
          created_at?: string
          dak_bedrijf_id: number
          id?: string
          naam?: string
          rating: number
        }
        Update: {
          commentaar?: string
          created_at?: string
          dak_bedrijf_id?: number
          id?: string
          naam?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "dak_bedrijf_reviews_dak_bedrijf_id_fkey"
            columns: ["dak_bedrijf_id"]
            isOneToOne: false
            referencedRelation: "dak_bedrijven"
            referencedColumns: ["id"]
          }
        ]
      }
      abonnementen: {
        Row: {
          company_id: number | null
          created_at: string | null
          eind_datum: string | null
          gebruiker_id: number | null
          id: number
          plan: string
          prijs: number | null
          start_datum: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          eind_datum?: string | null
          gebruiker_id?: number | null
          id?: number
          plan: string
          prijs?: number | null
          start_datum?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          eind_datum?: string | null
          gebruiker_id?: number | null
          id?: number
          plan?: string
          prijs?: number | null
          start_datum?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abonnementen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnementen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          module: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          module: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          module?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      afspraken: {
        Row: {
          assigned_to: string | null
          bedrijf_id: number | null
          beschrijving: string | null
          contact_id: number | null
          created_at: string | null
          deelnemers: Json | null
          eind_tijd: string | null
          id: number
          locatie: string | null
          project_id: number | null
          start_tijd: string
          status: string | null
          titel: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          bedrijf_id?: number | null
          beschrijving?: string | null
          contact_id?: number | null
          created_at?: string | null
          deelnemers?: Json | null
          eind_tijd?: string | null
          id?: number
          locatie?: string | null
          project_id?: number | null
          start_tijd: string
          status?: string | null
          titel: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          bedrijf_id?: number | null
          beschrijving?: string | null
          contact_id?: number | null
          created_at?: string | null
          deelnemers?: Json | null
          eind_tijd?: string | null
          id?: number
          locatie?: string | null
          project_id?: number | null
          start_tijd?: string
          status?: string | null
          titel?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afspraken_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afspraken_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afspraken_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacten"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_items: {
        Row: {
          created_at: string
          datum_label: string
          id: string
          locatie: string | null
          project_id: string | null
          tijd_label: string
          titel: string
          type: string
        }
        Insert: {
          created_at?: string
          datum_label?: string
          id?: string
          locatie?: string | null
          project_id?: string | null
          tijd_label?: string
          titel: string
          type?: string
        }
        Update: {
          created_at?: string
          datum_label?: string
          id?: string
          locatie?: string | null
          project_id?: string | null
          tijd_label?: string
          titel?: string
          type?: string
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          action_type: string
          agent_name: string
          agent_task_id: number | null
          approved_at: string | null
          approved_by: string | null
          company_id: number
          confidence: number | null
          created_at: string
          executed_at: string | null
          id: number
          payload_json: Json | null
          reason: string | null
          rejected_at: string | null
          rejected_by: string | null
          requires_approval: boolean
          status: string
          target_entity_id: number | null
          target_entity_type: string | null
          target_route: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          agent_name: string
          agent_task_id?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: number
          confidence?: number | null
          created_at?: string
          executed_at?: string | null
          id?: number
          payload_json?: Json | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          requires_approval?: boolean
          status?: string
          target_entity_id?: number | null
          target_entity_type?: string | null
          target_route?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          agent_name?: string
          agent_task_id?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: number
          confidence?: number | null
          created_at?: string
          executed_at?: string | null
          id?: number
          payload_json?: Json | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          requires_approval?: boolean
          status?: string
          target_entity_id?: number | null
          target_entity_type?: string | null
          target_route?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_agent_task_id_fkey"
            columns: ["agent_task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_activity_logs: {
        Row: {
          action_type: string
          agent_name: string
          company_id: number
          created_at: string
          created_by_user_id: string | null
          error_message: string | null
          id: number
          input_json: Json | null
          message: string
          output_json: Json | null
        }
        Insert: {
          action_type: string
          agent_name: string
          company_id: number
          created_at?: string
          created_by_user_id?: string | null
          error_message?: string | null
          id?: number
          input_json?: Json | null
          message: string
          output_json?: Json | null
        }
        Update: {
          action_type?: string
          agent_name?: string
          company_id?: number
          created_at?: string
          created_by_user_id?: string | null
          error_message?: string | null
          id?: number
          input_json?: Json | null
          message?: string
          output_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_permissions: {
        Row: {
          agent_name: string
          company_id: number
          created_at: string
          enabled: boolean
          id: number
          permission_key: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          company_id: number
          created_at?: string
          enabled?: boolean
          id?: number
          permission_key: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          company_id?: number
          created_at?: string
          enabled?: boolean
          id?: number
          permission_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          approved_by_user_id: string | null
          assigned_agent: string
          company_id: number
          created_at: string
          created_by_user_id: string | null
          description: string | null
          error_message: string | null
          id: number
          input_json: Json | null
          priority: string
          requested_by_agent: string | null
          requires_approval: boolean
          result_json: Json | null
          status: string
          target_entity_id: number | null
          target_entity_type: string | null
          target_route: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_by_user_id?: string | null
          assigned_agent: string
          company_id: number
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          error_message?: string | null
          id?: number
          input_json?: Json | null
          priority?: string
          requested_by_agent?: string | null
          requires_approval?: boolean
          result_json?: Json | null
          status?: string
          target_entity_id?: number | null
          target_entity_type?: string | null
          target_route?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          approved_by_user_id?: string | null
          assigned_agent?: string
          company_id?: number
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          error_message?: string | null
          id?: number
          input_json?: Json | null
          priority?: string
          requested_by_agent?: string | null
          requires_approval?: boolean
          result_json?: Json | null
          status?: string
          target_entity_id?: number | null
          target_entity_type?: string | null
          target_route?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_memory: {
        Row: {
          company_id: number
          content: string
          created_at: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          importance: number | null
          memory_type: string
          metadata: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id: number
          content: string
          created_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type?: string
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chats: {
        Row: {
          company_id: number
          created_at: string | null
          customer_id: number | null
          id: string
          is_pinned: boolean | null
          persona: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: number
          created_at?: string | null
          customer_id?: number | null
          id?: string
          is_pinned?: boolean | null
          persona?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: number
          created_at?: string | null
          customer_id?: number | null
          id?: string
          is_pinned?: boolean | null
          persona?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_packages: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name: string
          price_eur: number
          sort_order: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          name: string
          price_eur: number
          sort_order?: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name?: string
          price_eur?: number
          sort_order?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      ai_credit_transactions: {
        Row: {
          amount: number
          company_id: number
          created_at: string
          credits_after: number
          credits_before: number
          description: string | null
          id: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          type: string
        }
        Insert: {
          amount: number
          company_id: number
          created_at?: string
          credits_after: number
          credits_before: number
          description?: string | null
          id?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          company_id?: number
          created_at?: string
          credits_after?: number
          credits_before?: number
          description?: string | null
          id?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_base: {
        Row: {
          company_id: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_token_packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_eur: number
          sort_order: number | null
          stripe_price_id: string | null
          token_amount: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_eur: number
          sort_order?: number | null
          stripe_price_id?: string | null
          token_amount: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_eur?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          token_amount?: number
        }
        Relationships: []
      }
      ai_token_purchases: {
        Row: {
          amount_eur: number
          company_id: number
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tokens_purchased: number
        }
        Insert: {
          amount_eur: number
          company_id: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tokens_purchased: number
        }
        Update: {
          amount_eur?: number
          company_id?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tokens_purchased?: number
        }
        Relationships: []
      }
      artikelen: {
        Row: {
          afbeelding_url: string | null
          auteur: string | null
          created_at: string | null
          created_by: string | null
          featured_order: number | null
          id: number
          inhoud: string | null
          is_uitgelicht: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          samenvatting: string | null
          slug: string
          status: string | null
          thumbnail_url: string | null
          titel: string
          type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          afbeelding_url?: string | null
          auteur?: string | null
          created_at?: string | null
          created_by?: string | null
          featured_order?: number | null
          id?: number
          inhoud?: string | null
          is_uitgelicht?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          samenvatting?: string | null
          slug: string
          status?: string | null
          thumbnail_url?: string | null
          titel: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          afbeelding_url?: string | null
          auteur?: string | null
          created_at?: string | null
          created_by?: string | null
          featured_order?: number | null
          id?: number
          inhoud?: string | null
          is_uitgelicht?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          samenvatting?: string | null
          slug?: string
          status?: string | null
          thumbnail_url?: string | null
          titel?: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_id: string | null
          company_id: number
          created_at: string
          event_category: string
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          severity: string
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          company_id: number
          created_at?: string
          event_category?: string
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          company_id?: number
          created_at?: string
          event_category?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      bedrijf_smtp_instellingen: {
        Row: {
          bedrijf_id: number
          created_at: string
          from_email: string
          from_name: string
          smtp_host: string
          smtp_pass: string | null
          smtp_port: number
          smtp_user: string
          updated_at: string
        }
        Insert: {
          bedrijf_id: number
          created_at?: string
          from_email: string
          from_name?: string
          smtp_host?: string
          smtp_pass?: string | null
          smtp_port?: number
          smtp_user: string
          updated_at?: string
        }
        Update: {
          bedrijf_id?: number
          created_at?: string
          from_email?: string
          from_name?: string
          smtp_host?: string
          smtp_pass?: string | null
          smtp_port?: number
          smtp_user?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bedrijf_smtp_instellingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bedrijf_smtp_instellingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      bedrijven: {
        Row: {
          adres: string | null
          ai_assistant: string | null
          algemene_voorwaarden: string | null
          betaalterm: number
          btw: string | null
          created_at: string | null
          default_advance_template: string
          default_invoice_template: string
          default_quote_template: string
          email: string | null
          footer_tekst: string | null
          iban: string | null
          id: number
          is_active: boolean | null
          kvk: string | null
          last_activity_at: string | null
          logo_url: string | null
          naam: string
          owner_user_id: string | null
          plan: string | null
          postcode: string | null
          slug: string | null
          stad: string | null
          status: string
          subscription_status: string | null
          telefoon: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          adres?: string | null
          ai_assistant?: string | null
          algemene_voorwaarden?: string | null
          betaalterm?: number
          btw?: string | null
          created_at?: string | null
          default_advance_template?: string
          default_invoice_template?: string
          default_quote_template?: string
          email?: string | null
          footer_tekst?: string | null
          iban?: string | null
          id?: number
          is_active?: boolean | null
          kvk?: string | null
          last_activity_at?: string | null
          logo_url?: string | null
          naam: string
          owner_user_id?: string | null
          plan?: string | null
          postcode?: string | null
          slug?: string | null
          stad?: string | null
          status?: string
          subscription_status?: string | null
          telefoon?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          adres?: string | null
          ai_assistant?: string | null
          algemene_voorwaarden?: string | null
          betaalterm?: number
          btw?: string | null
          created_at?: string | null
          default_advance_template?: string
          default_invoice_template?: string
          default_quote_template?: string
          email?: string | null
          footer_tekst?: string | null
          iban?: string | null
          id?: number
          is_active?: boolean | null
          kvk?: string | null
          last_activity_at?: string | null
          logo_url?: string | null
          naam?: string
          owner_user_id?: string | null
          plan?: string | null
          postcode?: string | null
          slug?: string | null
          stad?: string | null
          status?: string
          subscription_status?: string | null
          telefoon?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      betalingen: {
        Row: {
          bedrag: number
          bedrijf_id: number | null
          betaalmethode: string | null
          created_at: string | null
          datum: string
          factuur_id: number | null
          id: number
          offerte_id: number | null
          referentie: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bedrag?: number
          bedrijf_id?: number | null
          betaalmethode?: string | null
          created_at?: string | null
          datum?: string
          factuur_id?: number | null
          id?: number
          offerte_id?: number | null
          referentie?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bedrag?: number
          bedrijf_id?: number | null
          betaalmethode?: string | null
          created_at?: string | null
          datum?: string
          factuur_id?: number | null
          id?: number
          offerte_id?: number | null
          referentie?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "betalingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      betalingsschema_sjablonen: {
        Row: {
          bedrijf_id: number | null
          created_at: string
          id: number
          is_standaard: boolean
          naam: string
          schijven: Json
        }
        Insert: {
          bedrijf_id?: number | null
          created_at?: string
          id?: number
          is_standaard?: boolean
          naam: string
          schijven?: Json
        }
        Update: {
          bedrijf_id?: number | null
          created_at?: string
          id?: number
          is_standaard?: boolean
          naam?: string
          schijven?: Json
        }
        Relationships: [
          {
            foreignKeyName: "betalingsschema_sjablonen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingsschema_sjablonen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      betalingsschemas: {
        Row: {
          bedrijf_id: number
          created_at: string
          factuur_id: number | null
          id: number
          naam: string
          notities: string | null
          offerte_id: number | null
          totaal_bedrag: number
          updated_at: string
        }
        Insert: {
          bedrijf_id: number
          created_at?: string
          factuur_id?: number | null
          id?: number
          naam?: string
          notities?: string | null
          offerte_id?: number | null
          totaal_bedrag?: number
          updated_at?: string
        }
        Update: {
          bedrijf_id?: number
          created_at?: string
          factuur_id?: number | null
          id?: number
          naam?: string
          notities?: string | null
          offerte_id?: number | null
          totaal_bedrag?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "betalingsschemas_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingsschemas_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      betalingsschijven: {
        Row: {
          bedrijf_id: number
          berekend_bedrag: number | null
          betaald_op: string | null
          betaling_id: number | null
          created_at: string
          factuur_id: number | null
          id: number
          label: string
          notities: string | null
          percentage: number | null
          schema_id: number
          status: string
          updated_at: string
          vast_bedrag: number | null
          vervaldatum: string | null
          volgorde: number
        }
        Insert: {
          bedrijf_id: number
          berekend_bedrag?: number | null
          betaald_op?: string | null
          betaling_id?: number | null
          created_at?: string
          factuur_id?: number | null
          id?: number
          label: string
          notities?: string | null
          percentage?: number | null
          schema_id: number
          status?: string
          updated_at?: string
          vast_bedrag?: number | null
          vervaldatum?: string | null
          volgorde?: number
        }
        Update: {
          bedrijf_id?: number
          berekend_bedrag?: number | null
          betaald_op?: string | null
          betaling_id?: number | null
          created_at?: string
          factuur_id?: number | null
          id?: number
          label?: string
          notities?: string | null
          percentage?: number | null
          schema_id?: number
          status?: string
          updated_at?: string
          vast_bedrag?: number | null
          vervaldatum?: string | null
          volgorde?: number
        }
        Relationships: [
          {
            foreignKeyName: "betalingsschijven_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingsschijven_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingsschijven_betaling_id_fkey"
            columns: ["betaling_id"]
            isOneToOne: false
            referencedRelation: "betalingen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "betalingsschijven_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "betalingsschemas"
            referencedColumns: ["id"]
          },
        ]
      }
      bouwnetwerk_channel_members: {
        Row: {
          channel_id: string | null
          company_id: number | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          role: string | null
        }
        Insert: {
          channel_id?: string | null
          company_id?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
        }
        Update: {
          channel_id?: string | null
          company_id?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bouwnetwerk_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "bouwnetwerk_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_channel_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_channel_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      bouwnetwerk_channels: {
        Row: {
          created_at: string | null
          created_by_company_id: number
          created_by_user_id: string | null
          description: string | null
          id: string
          last_message_at: string | null
          name: string | null
          type: string
          werkpost_id: string | null
          werkpost_reactie_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_company_id: number
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
          werkpost_id?: string | null
          werkpost_reactie_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_company_id?: number
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
          werkpost_id?: string | null
          werkpost_reactie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bouwnetwerk_channels_created_by_company_id_fkey"
            columns: ["created_by_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_channels_created_by_company_id_fkey"
            columns: ["created_by_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_channels_werkpost_id_fkey"
            columns: ["werkpost_id"]
            isOneToOne: false
            referencedRelation: "werkposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_channels_werkpost_reactie_id_fkey"
            columns: ["werkpost_reactie_id"]
            isOneToOne: false
            referencedRelation: "werkpost_reacties"
            referencedColumns: ["id"]
          },
        ]
      }
      bouwnetwerk_messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          reply_to_message_id: string | null
          sender_company_id: number | null
          sender_user_id: string | null
          type: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          reply_to_message_id?: string | null
          sender_company_id?: number | null
          sender_user_id?: string | null
          type?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          reply_to_message_id?: string | null
          sender_company_id?: number | null
          sender_user_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bouwnetwerk_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "bouwnetwerk_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "bouwnetwerk_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_messages_sender_company_id_fkey"
            columns: ["sender_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_messages_sender_company_id_fkey"
            columns: ["sender_company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      bouwnetwerk_typing: {
        Row: {
          channel_id: string | null
          company_id: number | null
          expires_at: string | null
          id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          company_id?: number | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          company_id?: number | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bouwnetwerk_typing_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "bouwnetwerk_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_typing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouwnetwerk_typing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ai_credits: {
        Row: {
          auto_recharge: boolean
          auto_recharge_amount: number | null
          company_id: number
          created_at: string
          credits_remaining: number
          credits_used: number
          id: string
          last_purchase_at: string | null
          low_balance_notified: boolean
          low_balance_threshold: number | null
          stripe_customer_id: string | null
          total_purchased: number
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          auto_recharge?: boolean
          auto_recharge_amount?: number | null
          company_id: number
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          last_purchase_at?: string | null
          low_balance_notified?: boolean
          low_balance_threshold?: number | null
          stripe_customer_id?: string | null
          total_purchased?: number
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          auto_recharge?: boolean
          auto_recharge_amount?: number | null
          company_id?: number
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          id?: string
          last_purchase_at?: string | null
          low_balance_notified?: boolean
          low_balance_threshold?: number | null
          stripe_customer_id?: string | null
          total_purchased?: number
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ai_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ai_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ai_tokens: {
        Row: {
          company_id: number
          created_at: string
          created_by: string
          encrypted_token: string
          id: string
          is_active: boolean
          monthly_limit: number | null
          provider: string
          token_name: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          company_id: number
          created_at?: string
          created_by: string
          encrypted_token: string
          id?: string
          is_active?: boolean
          monthly_limit?: number | null
          provider?: string
          token_name: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          company_id?: number
          created_at?: string
          created_by?: string
          encrypted_token?: string
          id?: string
          is_active?: boolean
          monthly_limit?: number | null
          provider?: string
          token_name?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_ai_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ai_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_api_keys: {
        Row: {
          company_id: number
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          company_id: number
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          company_id?: number
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "company_api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_einvoicing_settings: {
        Row: {
          auto_send: boolean
          bedrijf_id: number | null
          created_at: string | null
          encrypted_credentials: Json | null
          environment: string
          id: string
          is_enabled: boolean
          peppol_api_key_encrypted: string | null
          peppol_credentials_version: number | null
          peppol_endpoint_url: string | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          auto_send?: boolean
          bedrijf_id?: number | null
          created_at?: string | null
          encrypted_credentials?: Json | null
          environment?: string
          id?: string
          is_enabled?: boolean
          peppol_api_key_encrypted?: string | null
          peppol_credentials_version?: number | null
          peppol_endpoint_url?: string | null
          provider_id?: string
          updated_at?: string | null
        }
        Update: {
          auto_send?: boolean
          bedrijf_id?: number | null
          created_at?: string | null
          encrypted_credentials?: Json | null
          environment?: string
          id?: string
          is_enabled?: boolean
          peppol_api_key_encrypted?: string | null
          peppol_credentials_version?: number | null
          peppol_endpoint_url?: string | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_einvoicing_settings_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_einvoicing_settings_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_legal_entities: {
        Row: {
          bedrijf_id: number | null
          bic: string | null
          city: string | null
          country_code: string | null
          created_at: string | null
          enterprise_number: string
          house_number: string | null
          iban: string | null
          id: string
          legal_name: string
          postal_code: string | null
          street: string | null
          updated_at: string | null
          vat_number: string
        }
        Insert: {
          bedrijf_id?: number | null
          bic?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          enterprise_number: string
          house_number?: string | null
          iban?: string | null
          id?: string
          legal_name: string
          postal_code?: string | null
          street?: string | null
          updated_at?: string | null
          vat_number: string
        }
        Update: {
          bedrijf_id?: number | null
          bic?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          enterprise_number?: string
          house_number?: string | null
          iban?: string | null
          id?: string
          legal_name?: string
          postal_code?: string | null
          street?: string | null
          updated_at?: string | null
          vat_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_legal_entities_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_legal_entities_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_memberships: {
        Row: {
          activated_at: string | null
          company_id: number
          created_at: string | null
          custom_permissions: Json | null
          deactivated_at: string | null
          deactivated_by: string | null
          id: number
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          company_id: number
          created_at?: string | null
          custom_permissions?: Json | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: number
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          company_id?: number
          created_at?: string | null
          custom_permissions?: Json | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: number
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      community_wall_posts: {
        Row: {
          author_name: string
          body: string
          company: string | null
          created_at: string
          id: string
          kind: string
          status: string
        }
        Insert: {
          author_name?: string
          body: string
          company?: string | null
          created_at?: string
          id?: string
          kind: string
          status?: string
        }
        Update: {
          author_name?: string
          body?: string
          company?: string | null
          created_at?: string
          id?: string
          kind?: string
          status?: string
        }
        Relationships: []
      }
      contacten: {
        Row: {
          achternaam: string
          bedrijf_id: number | null
          created_at: string | null
          email: string | null
          functie: string | null
          id: number
          telefoon: string | null
          updated_at: string | null
          user_id: string | null
          voornaam: string
        }
        Insert: {
          achternaam: string
          bedrijf_id?: number | null
          created_at?: string | null
          email?: string | null
          functie?: string | null
          id?: number
          telefoon?: string | null
          updated_at?: string | null
          user_id?: string | null
          voornaam: string
        }
        Update: {
          achternaam?: string
          bedrijf_id?: number | null
          created_at?: string | null
          email?: string | null
          functie?: string | null
          id?: number
          telefoon?: string | null
          updated_at?: string | null
          user_id?: string | null
          voornaam?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacten_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacten_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          company_id: number
          created_at: string | null
          customer_id: number
          description: string | null
          document_id: number | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_visible_in_portal: boolean | null
          mime_type: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: number
          created_at?: string | null
          customer_id: number
          description?: string | null
          document_id?: number | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_visible_in_portal?: boolean | null
          mime_type?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: number
          created_at?: string | null
          customer_id?: number
          description?: string | null
          document_id?: number | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_visible_in_portal?: boolean | null
          mime_type?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_audit_log: {
        Row: {
          company_id: number
          created_at: string | null
          customer_id: number | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          portal_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          company_id: number
          created_at?: string | null
          customer_id?: number | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          portal_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          company_id?: number
          created_at?: string | null
          customer_id?: number | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          portal_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_audit_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_audit_log_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "customer_portal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_invitations: {
        Row: {
          accepted_at: string | null
          company_id: number
          created_at: string | null
          customer_id: number
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: number
          created_at?: string | null
          customer_id: number
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          status?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: number
          created_at?: string | null
          customer_id?: number
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_invitations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_users: {
        Row: {
          auth_user_id: string
          company_id: number
          created_at: string | null
          customer_id: number
          id: string
          is_active: boolean | null
          last_login_at: string | null
          login_count: number | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id: string
          company_id: number
          created_at?: string | null
          customer_id: number
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          company_id?: number
          created_at?: string | null
          customer_id?: number
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_portal_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          btw: string | null
          company_id: number
          company_name: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          first_name: string | null
          id: number
          is_active: boolean | null
          kvk: string | null
          last_name: string | null
          name: string
          notes: string | null
          phone: string | null
          portal_activated_at: string | null
          portal_enabled: boolean | null
          portal_invited_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          btw?: string | null
          company_id: number
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          is_active?: boolean | null
          kvk?: string | null
          last_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          portal_activated_at?: string | null
          portal_enabled?: boolean | null
          portal_invited_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          btw?: string | null
          company_id?: number
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          is_active?: boolean | null
          kvk?: string | null
          last_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          portal_activated_at?: string | null
          portal_enabled?: boolean | null
          portal_invited_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          bedrijf_id: number | null
          contact_id: number | null
          contactpersoon: string | null
          created_at: string | null
          deadline: string | null
          email: string | null
          id: number
          kans: number | null
          laatste_contact_op: string | null
          notitie: string | null
          stadium: string
          telefoon: string | null
          titel: string
          updated_at: string | null
          user_id: string | null
          waarde: number | null
        }
        Insert: {
          bedrijf_id?: number | null
          contact_id?: number | null
          contactpersoon?: string | null
          created_at?: string | null
          deadline?: string | null
          email?: string | null
          id?: number
          kans?: number | null
          laatste_contact_op?: string | null
          notitie?: string | null
          stadium: string
          telefoon?: string | null
          titel: string
          updated_at?: string | null
          user_id?: string | null
          waarde?: number | null
        }
        Update: {
          bedrijf_id?: number | null
          contact_id?: number | null
          contactpersoon?: string | null
          created_at?: string | null
          deadline?: string | null
          email?: string | null
          id?: number
          kans?: number | null
          laatste_contact_op?: string | null
          notitie?: string | null
          stadium?: string
          telefoon?: string | null
          titel?: string
          updated_at?: string | null
          user_id?: string | null
          waarde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacten"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      document_audit_log: {
        Row: {
          actie: string | null
          created_at: string | null
          document_id: number | null
          document_type: string | null
          entry_nummer: number | null
          id: number
          metadata: Json | null
          new_state: Json | null
          user_id: string | null
          user_type: string | null
          vorige_state: Json | null
        }
        Insert: {
          actie?: string | null
          created_at?: string | null
          document_id?: number | null
          document_type?: string | null
          entry_nummer?: number | null
          id?: number
          metadata?: Json | null
          new_state?: Json | null
          user_id?: string | null
          user_type?: string | null
          vorige_state?: Json | null
        }
        Update: {
          actie?: string | null
          created_at?: string | null
          document_id?: number | null
          document_type?: string | null
          entry_nummer?: number | null
          id?: number
          metadata?: Json | null
          new_state?: Json | null
          user_id?: string | null
          user_type?: string | null
          vorige_state?: Json | null
        }
        Relationships: []
      }
      document_sequences: {
        Row: {
          company_id: number
          created_at: string
          current_value: number
          document_type: string
          id: string
          prefix: string
          updated_at: string
          year: number
        }
        Insert: {
          company_id: number
          created_at?: string
          current_value?: number
          document_type: string
          id?: string
          prefix: string
          updated_at?: string
          year: number
        }
        Update: {
          company_id?: number
          created_at?: string
          current_value?: number
          document_type?: string
          id?: string
          prefix?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_sequences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sequences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          company_id: number
          description: string | null
          filename: string
          id: number
          is_public: boolean | null
          mime_type: string
          original_name: string
          related_entity_id: number | null
          related_entity_type: string | null
          size_bytes: number
          storage_path: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          company_id: number
          description?: string | null
          filename: string
          id?: number
          is_public?: boolean | null
          mime_type: string
          original_name: string
          related_entity_id?: number | null
          related_entity_type?: string | null
          size_bytes: number
          storage_path: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          company_id?: number
          description?: string | null
          filename?: string
          id?: number
          is_public?: boolean | null
          mime_type?: string
          original_name?: string
          related_entity_id?: number | null
          related_entity_type?: string | null
          size_bytes?: number
          storage_path?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      facturen: {
        Row: {
          bedrag: number
          bedrijf_id: number | null
          btw_bedrag: number
          created_at: string
          credit_nota_voor: number | null
          customer_id: number | null
          datum: string
          document_type: string
          id: number
          klant: string | null
          last_reminder_sent_at: string | null
          notities: string | null
          nummer: string | null
          offerte_id: number | null
          omschrijving: string | null
          paid_at: string | null
          reminder_count: number
          sent_at: string | null
          status: string
          template_id: string
          totaal_bedrag: number
          updated_at: string
          user_id: string | null
          versie_nummer: number
          vervaldatum: string | null
        }
        Insert: {
          bedrag?: number
          bedrijf_id?: number | null
          btw_bedrag?: number
          created_at?: string
          credit_nota_voor?: number | null
          customer_id?: number | null
          datum?: string
          document_type?: string
          id?: number
          klant?: string | null
          last_reminder_sent_at?: string | null
          notities?: string | null
          nummer?: string | null
          offerte_id?: number | null
          omschrijving?: string | null
          paid_at?: string | null
          reminder_count?: number
          sent_at?: string | null
          status?: string
          template_id?: string
          totaal_bedrag?: number
          updated_at?: string
          user_id?: string | null
          versie_nummer?: number
          vervaldatum?: string | null
        }
        Update: {
          bedrag?: number
          bedrijf_id?: number | null
          btw_bedrag?: number
          created_at?: string
          credit_nota_voor?: number | null
          customer_id?: number | null
          datum?: string
          document_type?: string
          id?: number
          klant?: string | null
          last_reminder_sent_at?: string | null
          notities?: string | null
          nummer?: string | null
          offerte_id?: number | null
          omschrijving?: string | null
          paid_at?: string | null
          reminder_count?: number
          sent_at?: string | null
          status?: string
          template_id?: string
          totaal_bedrag?: number
          updated_at?: string
          user_id?: string | null
          versie_nummer?: number
          vervaldatum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturen_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      factuur_email_instellingen: {
        Row: {
          bedrijf_id: number
          betaallink_in_email: boolean
          created_at: string
          herinnering_actief: boolean
          herinnering_dagen_na: number
          herinnering_herhaal_dagen: number
          herinnering_max_aantal: number
          id: number
          updated_at: string
        }
        Insert: {
          bedrijf_id: number
          betaallink_in_email?: boolean
          created_at?: string
          herinnering_actief?: boolean
          herinnering_dagen_na?: number
          herinnering_herhaal_dagen?: number
          herinnering_max_aantal?: number
          id?: number
          updated_at?: string
        }
        Update: {
          bedrijf_id?: number
          betaallink_in_email?: boolean
          created_at?: string
          herinnering_actief?: boolean
          herinnering_dagen_na?: number
          herinnering_herhaal_dagen?: number
          herinnering_max_aantal?: number
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factuur_email_instellingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factuur_email_instellingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      factuur_lijnen: {
        Row: {
          aantal: number
          btw_percentage: number
          company_id: number | null
          created_at: string
          eenheid: string
          factuur_id: number
          id: number
          omschrijving: string | null
          prijs_per_eenheid: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          aantal?: number
          btw_percentage?: number
          company_id?: number | null
          created_at?: string
          eenheid?: string
          factuur_id: number
          id?: number
          omschrijving?: string | null
          prijs_per_eenheid?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          aantal?: number
          btw_percentage?: number
          company_id?: number | null
          created_at?: string
          eenheid?: string
          factuur_id?: number
          id?: number
          omschrijving?: string | null
          prijs_per_eenheid?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factuur_lijnen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factuur_lijnen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factuur_lijnen_factuur_id_fkey"
            columns: ["factuur_id"]
            isOneToOne: false
            referencedRelation: "facturen"
            referencedColumns: ["id"]
          },
        ]
      }
      hulpverzoek_reacties: {
        Row: {
          accepted_at: string | null
          bericht: string
          beschikbaarheid: string | null
          created_at: string | null
          gezien_door_aanbieder_at: string | null
          hulpverzoek_id: number
          id: number
          reageerder_bedrijf_id: number
          reageerder_contact_id: number | null
          reageerder_user_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
          voorgesteld_tarief: number | null
        }
        Insert: {
          accepted_at?: string | null
          bericht: string
          beschikbaarheid?: string | null
          created_at?: string | null
          gezien_door_aanbieder_at?: string | null
          hulpverzoek_id: number
          id?: number
          reageerder_bedrijf_id: number
          reageerder_contact_id?: number | null
          reageerder_user_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
          voorgesteld_tarief?: number | null
        }
        Update: {
          accepted_at?: string | null
          bericht?: string
          beschikbaarheid?: string | null
          created_at?: string | null
          gezien_door_aanbieder_at?: string | null
          hulpverzoek_id?: number
          id?: number
          reageerder_bedrijf_id?: number
          reageerder_contact_id?: number | null
          reageerder_user_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
          voorgesteld_tarief?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hulpverzoek_reacties_hulpverzoek_id_fkey"
            columns: ["hulpverzoek_id"]
            isOneToOne: false
            referencedRelation: "hulpverzoeken"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoek_reacties_reageerder_bedrijf_id_fkey"
            columns: ["reageerder_bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoek_reacties_reageerder_bedrijf_id_fkey"
            columns: ["reageerder_bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoek_reacties_reageerder_contact_id_fkey"
            columns: ["reageerder_contact_id"]
            isOneToOne: false
            referencedRelation: "contacten"
            referencedColumns: ["id"]
          },
        ]
      }
      hulpverzoek_vaardigheden: {
        Row: {
          hulpverzoek_id: number
          id: number
          vaardigheid_id: number
        }
        Insert: {
          hulpverzoek_id: number
          id?: number
          vaardigheid_id: number
        }
        Update: {
          hulpverzoek_id?: number
          id?: number
          vaardigheid_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "hulpverzoek_vaardigheden_hulpverzoek_id_fkey"
            columns: ["hulpverzoek_id"]
            isOneToOne: false
            referencedRelation: "hulpverzoeken"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoek_vaardigheden_vaardigheid_id_fkey"
            columns: ["vaardigheid_id"]
            isOneToOne: false
            referencedRelation: "vaardigheden"
            referencedColumns: ["id"]
          },
        ]
      }
      hulpverzoeken: {
        Row: {
          aantal_dagen: number
          assigned_at: string | null
          assigned_to_bedrijf_id: number | null
          bedrijf_id: number
          beschrijving: string
          budget_bedrag: number | null
          budget_op_aanvraag: boolean | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          id: number
          locatie: string | null
          start_datum: string | null
          status: string | null
          titel: string
          updated_at: string | null
          urgent: boolean | null
        }
        Insert: {
          aantal_dagen: number
          assigned_at?: string | null
          assigned_to_bedrijf_id?: number | null
          bedrijf_id: number
          beschrijving: string
          budget_bedrag?: number | null
          budget_op_aanvraag?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          id?: number
          locatie?: string | null
          start_datum?: string | null
          status?: string | null
          titel: string
          updated_at?: string | null
          urgent?: boolean | null
        }
        Update: {
          aantal_dagen?: number
          assigned_at?: string | null
          assigned_to_bedrijf_id?: number | null
          bedrijf_id?: number
          beschrijving?: string
          budget_bedrag?: number | null
          budget_op_aanvraag?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          id?: number
          locatie?: string | null
          start_datum?: string | null
          status?: string | null
          titel?: string
          updated_at?: string | null
          urgent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hulpverzoeken_assigned_to_bedrijf_id_fkey"
            columns: ["assigned_to_bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoeken_assigned_to_bedrijf_id_fkey"
            columns: ["assigned_to_bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoeken_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hulpverzoeken_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      inkomsten: {
        Row: {
          bedrag: number
          bedrijf_id: number | null
          betaalmethode: string | null
          categorie: string | null
          compliance_status: string | null
          contact_id: number | null
          created_at: string | null
          currency: string | null
          customer_id: number | null
          datum: string
          due_date: string | null
          external_provider_id: string | null
          external_provider_status: string | null
          failure_reason: string | null
          id: number
          internal_status: string | null
          invoice_type: string | null
          language: string | null
          nummer: string | null
          omschrijving: string | null
          sent_at: string | null
          titel: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bedrag?: number
          bedrijf_id?: number | null
          betaalmethode?: string | null
          categorie?: string | null
          compliance_status?: string | null
          contact_id?: number | null
          created_at?: string | null
          currency?: string | null
          customer_id?: number | null
          datum?: string
          due_date?: string | null
          external_provider_id?: string | null
          external_provider_status?: string | null
          failure_reason?: string | null
          id?: number
          internal_status?: string | null
          invoice_type?: string | null
          language?: string | null
          nummer?: string | null
          omschrijving?: string | null
          sent_at?: string | null
          titel?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bedrag?: number
          bedrijf_id?: number | null
          betaalmethode?: string | null
          categorie?: string | null
          compliance_status?: string | null
          contact_id?: number | null
          created_at?: string | null
          currency?: string | null
          customer_id?: number | null
          datum?: string
          due_date?: string | null
          external_provider_id?: string | null
          external_provider_status?: string | null
          failure_reason?: string | null
          id?: number
          internal_status?: string | null
          invoice_type?: string | null
          language?: string | null
          nummer?: string | null
          omschrijving?: string | null
          sent_at?: string | null
          titel?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inkomsten_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inkomsten_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inkomsten_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inkomsten_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      integraties: {
        Row: {
          bedrijf_id: number
          config: Json
          connected_at: string | null
          created_at: string
          id: number
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          bedrijf_id: number
          config?: Json
          connected_at?: string | null
          created_at?: string
          id?: never
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          bedrijf_id?: number
          config?: Json
          connected_at?: string | null
          created_at?: string
          id?: never
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integraties_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integraties_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_events: {
        Row: {
          actor_id: string | null
          bedrijf_id: number | null
          created_at: string | null
          event_type: string
          id: string
          invoice_id: number | null
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          bedrijf_id?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          invoice_id?: number | null
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          bedrijf_id?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          invoice_id?: number | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_events_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_events_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "inkomsten"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_tax_breakdown: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: number | null
          tax_amount: number
          tax_category: string
          tax_rate: number
          taxable_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id?: number | null
          tax_amount: number
          tax_category: string
          tax_rate: number
          taxable_amount: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: number | null
          tax_amount?: number
          tax_category?: string
          tax_rate?: number
          taxable_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_tax_breakdown_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "inkomsten"
            referencedColumns: ["id"]
          },
        ]
      }
      klanten: {
        Row: {
          created_at: string
          email: string | null
          id: string
          laatste_contact_label: string | null
          naam: string
          openstaande_projecten: number
          status: string
          telefoon: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          laatste_contact_label?: string | null
          naam: string
          openstaande_projecten?: number
          status?: string
          telefoon?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          laatste_contact_label?: string | null
          naam?: string
          openstaande_projecten?: number
          status?: string
          telefoon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      offerte_activities: {
        Row: {
          activity_type: string
          company_id: number
          created_at: string
          id: number
          metadata: Json | null
          new_status: string | null
          offerte_id: number
          old_status: string | null
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          company_id: number
          created_at?: string
          id?: number
          metadata?: Json | null
          new_status?: string | null
          offerte_id: number
          old_status?: string | null
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          company_id?: number
          created_at?: string
          id?: number
          metadata?: Json | null
          new_status?: string | null
          offerte_id?: number
          old_status?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offerte_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_activities_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_email_log: {
        Row: {
          bedrijf_id: number
          created_at: string
          error_message: string | null
          id: string
          offerte_id: number
          recipient_email: string
          sent_by: string | null
          status: string
        }
        Insert: {
          bedrijf_id: number
          created_at?: string
          error_message?: string | null
          id?: string
          offerte_id: number
          recipient_email: string
          sent_by?: string | null
          status?: string
        }
        Update: {
          bedrijf_id?: number
          created_at?: string
          error_message?: string | null
          id?: string
          offerte_id?: number
          recipient_email?: string
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerte_email_log_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_email_log_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_email_log_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_email_log_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offerte_lijnen: {
        Row: {
          aantal: number
          btw_percentage: number
          company_id: number
          created_at: string
          eenheid: string
          id: number
          offerte_id: number
          omschrijving: string | null
          prijs_per_eenheid: number
          sort_order: number
        }
        Insert: {
          aantal?: number
          btw_percentage?: number
          company_id: number
          created_at?: string
          eenheid?: string
          id?: number
          offerte_id: number
          omschrijving?: string | null
          prijs_per_eenheid?: number
          sort_order?: number
        }
        Update: {
          aantal?: number
          btw_percentage?: number
          company_id?: number
          created_at?: string
          eenheid?: string
          id?: number
          offerte_id?: number
          omschrijving?: string | null
          prijs_per_eenheid?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "offerte_lijnen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_lijnen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerte_lijnen_offerte_id_fkey"
            columns: ["offerte_id"]
            isOneToOne: false
            referencedRelation: "offertes"
            referencedColumns: ["id"]
          },
        ]
      }
      offertes: {
        Row: {
          accepted_at: string | null
          bedrag: number
          bedrijf_id: number | null
          converted_at: string | null
          converted_by: string | null
          converted_to_invoice_id: number | null
          converted_to_project_id: number | null
          converted_to_type: string | null
          created_at: string
          customer_id: number | null
          datum: string
          expired_at: string | null
          geldig_tot: string | null
          id: number
          klant: string | null
          notes: string | null
          nummer: string | null
          public_token: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sent_at: string | null
          status: string
          status_new: string
          template_id: string
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
          versie_nummer: number
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          bedrag?: number
          bedrijf_id?: number | null
          converted_at?: string | null
          converted_by?: string | null
          converted_to_invoice_id?: number | null
          converted_to_project_id?: number | null
          converted_to_type?: string | null
          created_at?: string
          customer_id?: number | null
          datum?: string
          expired_at?: string | null
          geldig_tot?: string | null
          id?: number
          klant?: string | null
          notes?: string | null
          nummer?: string | null
          public_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          status?: string
          status_new?: string
          template_id?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          versie_nummer?: number
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          bedrag?: number
          bedrijf_id?: number | null
          converted_at?: string | null
          converted_by?: string | null
          converted_to_invoice_id?: number | null
          converted_to_project_id?: number | null
          converted_to_type?: string | null
          created_at?: string
          customer_id?: number | null
          datum?: string
          expired_at?: string | null
          geldig_tot?: string | null
          id?: number
          klant?: string | null
          notes?: string | null
          nummer?: string | null
          public_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          status?: string
          status_new?: string
          template_id?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
          versie_nummer?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offertes_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offertes_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      organisaties: {
        Row: {
          aangemaakt: string | null
          domein: string | null
          id: string
          naam: string
        }
        Insert: {
          aangemaakt?: string | null
          domein?: string | null
          id?: string
          naam: string
        }
        Update: {
          aangemaakt?: string | null
          domein?: string | null
          id?: string
          naam?: string
        }
        Relationships: []
      }
      partnernetwerk: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_live: boolean | null
          laatste_activiteit_label: string | null
          naam: string
          regio: string
          specialisatie: string
          status: string
          telefoon: string | null
          type: string | null
          updated_at: string
          voorraad: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_live?: boolean | null
          laatste_activiteit_label?: string | null
          naam: string
          regio: string
          specialisatie: string
          status?: string
          telefoon?: string | null
          type?: string | null
          updated_at?: string
          voorraad?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_live?: boolean | null
          laatste_activiteit_label?: string | null
          naam?: string
          regio?: string
          specialisatie?: string
          status?: string
          telefoon?: string | null
          type?: string | null
          updated_at?: string
          voorraad?: string | null
        }
        Relationships: []
      }
      plan_ai_token_limits: {
        Row: {
          monthly_tokens: number
          plan: string
          tokens_on_signup: number
          voice_enabled: boolean
        }
        Insert: {
          monthly_tokens?: number
          plan: string
          tokens_on_signup?: number
          voice_enabled?: boolean
        }
        Update: {
          monthly_tokens?: number
          plan?: string
          tokens_on_signup?: number
          voice_enabled?: boolean
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          afbeelding_url: string | null
          auteur: string | null
          created_at: string | null
          created_by: string | null
          featured_order: number | null
          id: number
          inhoud: string | null
          is_uitgelicht: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          samenvatting: string | null
          slug: string
          status: string | null
          thumbnail_url: string | null
          titel: string
          type: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          afbeelding_url?: string | null
          auteur?: string | null
          created_at?: string | null
          created_by?: string | null
          featured_order?: number | null
          id?: number
          inhoud?: string | null
          is_uitgelicht?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          samenvatting?: string | null
          slug: string
          status?: string | null
          thumbnail_url?: string | null
          titel: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          afbeelding_url?: string | null
          auteur?: string | null
          created_at?: string | null
          created_by?: string | null
          featured_order?: number | null
          id?: number
          inhoud?: string | null
          is_uitgelicht?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          samenvatting?: string | null
          slug?: string
          status?: string | null
          thumbnail_url?: string | null
          titel?: string
          type?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_preferences: Json | null
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          ai_preferences?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_preferences?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_notities: {
        Row: {
          datum_label: string
          id: string
          project_id: string
          tekst: string
        }
        Insert: {
          datum_label?: string
          id?: string
          project_id: string
          tekst: string
        }
        Update: {
          datum_label?: string
          id?: string
          project_id?: string
          tekst?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projecten"
            referencedColumns: ["id"]
          },
        ]
      }
      projecten: {
        Row: {
          bedrijf_id: number | null
          created_at: string
          id: string
          klant_naam: string
          naam: string
          start_datum_label: string
          status: string
        }
        Insert: {
          bedrijf_id?: number | null
          created_at?: string
          id?: string
          klant_naam: string
          naam: string
          start_datum_label?: string
          status?: string
        }
        Update: {
          bedrijf_id?: number | null
          created_at?: string
          id?: string
          klant_naam?: string
          naam?: string
          start_datum_label?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "projecten_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projecten_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          company_id: number
          created_at: string | null
          email_enabled: boolean | null
          entity_id: number
          entity_type: string
          id: number
          in_app_enabled: boolean | null
          is_sent: boolean | null
          message: string | null
          reminder_at: string
          sent_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: number
          created_at?: string | null
          email_enabled?: boolean | null
          entity_id: number
          entity_type: string
          id?: number
          in_app_enabled?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          reminder_at: string
          sent_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: number
          created_at?: string | null
          email_enabled?: boolean | null
          entity_id?: number
          entity_type?: string
          id?: number
          in_app_enabled?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          reminder_at?: string
          sent_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      taken: {
        Row: {
          created_at: string
          deadline_label: string
          id: string
          project_id: string | null
          project_naam: string | null
          status: string
          titel: string
          toegewezen_aan: string | null
        }
        Insert: {
          created_at?: string
          deadline_label?: string
          id?: string
          project_id?: string | null
          project_naam?: string | null
          status?: string
          titel: string
          toegewezen_aan?: string | null
        }
        Update: {
          created_at?: string
          deadline_label?: string
          id?: string
          project_id?: string | null
          project_naam?: string | null
          status?: string
          titel?: string
          toegewezen_aan?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: number
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: number | null
          description: string | null
          due_date: string | null
          id: number
          priority: string
          project_id: number | null
          related_entity_id: number | null
          related_entity_type: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: number
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: number | null
          description?: string | null
          due_date?: string | null
          id?: number
          priority?: string
          project_id?: number | null
          related_entity_id?: number | null
          related_entity_type?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: number
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: number | null
          description?: string | null
          due_date?: string | null
          id?: number
          priority?: string
          project_id?: number | null
          related_entity_id?: number | null
          related_entity_type?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          contact_id: number | null
          created_at: string | null
          datum: string
          gebruiker_id: number | null
          id: number
          omschrijving: string | null
          project_id: number | null
          updated_at: string | null
          uren: number
          user_id: string | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string | null
          datum?: string
          gebruiker_id?: number | null
          id?: number
          omschrijving?: string | null
          project_id?: number | null
          updated_at?: string | null
          uren?: number
          user_id?: string | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string | null
          datum?: string
          gebruiker_id?: number | null
          id?: number
          omschrijving?: string | null
          project_id?: number | null
          updated_at?: string | null
          uren?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacten"
            referencedColumns: ["id"]
          },
        ]
      }
      uitgaven: {
        Row: {
          bedrag: number
          bedrijf_id: number | null
          betaalmethode: string | null
          categorie: string | null
          created_at: string | null
          datum: string
          id: number
          leverancier: string | null
          omschrijving: string | null
          titel: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bedrag?: number
          bedrijf_id?: number | null
          betaalmethode?: string | null
          categorie?: string | null
          created_at?: string | null
          datum?: string
          id?: number
          leverancier?: string | null
          omschrijving?: string | null
          titel?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bedrag?: number
          bedrijf_id?: number | null
          betaalmethode?: string | null
          categorie?: string | null
          created_at?: string | null
          datum?: string
          id?: number
          leverancier?: string | null
          omschrijving?: string | null
          titel?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uitgaven_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uitgaven_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      uitnodigingen: {
        Row: {
          aangemaakt_at: string | null
          email: string
          expires_at: string
          gebruikt_at: string | null
          id: string
          organization_id: string | null
          rol: string | null
          token: string
        }
        Insert: {
          aangemaakt_at?: string | null
          email: string
          expires_at: string
          gebruikt_at?: string | null
          id?: string
          organization_id?: string | null
          rol?: string | null
          token: string
        }
        Update: {
          aangemaakt_at?: string | null
          email?: string
          expires_at?: string
          gebruikt_at?: string | null
          id?: string
          organization_id?: string | null
          rol?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "uitnodigingen_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      uren_registratie: {
        Row: {
          aangemaakt: string | null
          datum: string
          gesynchroniseerd: boolean | null
          id: string
          notitie: string | null
          project_id: string | null
          uren: number
          werknemer_id: string | null
        }
        Insert: {
          aangemaakt?: string | null
          datum: string
          gesynchroniseerd?: boolean | null
          id?: string
          notitie?: string | null
          project_id?: string | null
          uren: number
          werknemer_id?: string | null
        }
        Update: {
          aangemaakt?: string | null
          datum?: string
          gesynchroniseerd?: boolean | null
          id?: string
          notitie?: string | null
          project_id?: string | null
          uren?: number
          werknemer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uren_registratie_werknemer_id_fkey"
            columns: ["werknemer_id"]
            isOneToOne: false
            referencedRelation: "werknemers"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          active: boolean | null
          createdAt: string | null
          email: string
          id: string
          lastLogin: string | null
          name: string | null
          role: string | null
          updatedAt: string | null
        }
        Insert: {
          active?: boolean | null
          createdAt?: string | null
          email: string
          id?: string
          lastLogin?: string | null
          name?: string | null
          role?: string | null
          updatedAt?: string | null
        }
        Update: {
          active?: boolean | null
          createdAt?: string | null
          email?: string
          id?: string
          lastLogin?: string | null
          name?: string | null
          role?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      vaardigheden: {
        Row: {
          categorie: string | null
          created_at: string | null
          id: number
          naam: string
        }
        Insert: {
          categorie?: string | null
          created_at?: string | null
          id?: number
          naam: string
        }
        Update: {
          categorie?: string | null
          created_at?: string | null
          id?: number
          naam?: string
        }
        Relationships: []
      }
      werknemers: {
        Row: {
          aangemaakt: string | null
          functie: string | null
          id: string
          naam: string
          onboarding_voltooid: boolean | null
          organization_id: string | null
          rol: string | null
          specialization: string | null
          team_size: string | null
          telefoon: string | null
          user_id: string
          workflow_focus: string | null
        }
        Insert: {
          aangemaakt?: string | null
          functie?: string | null
          id?: string
          naam: string
          onboarding_voltooid?: boolean | null
          organization_id?: string | null
          rol?: string | null
          specialization?: string | null
          team_size?: string | null
          telefoon?: string | null
          user_id: string
          workflow_focus?: string | null
        }
        Update: {
          aangemaakt?: string | null
          functie?: string | null
          id?: string
          naam?: string
          onboarding_voltooid?: boolean | null
          organization_id?: string | null
          rol?: string | null
          specialization?: string | null
          team_size?: string | null
          telefoon?: string | null
          user_id?: string
          workflow_focus?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "werknemers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organisaties"
            referencedColumns: ["id"]
          },
        ]
      }
      werkpost_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          werkpost_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          werkpost_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          werkpost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "werkpost_likes_werkpost_id_fkey"
            columns: ["werkpost_id"]
            isOneToOne: false
            referencedRelation: "werkposts"
            referencedColumns: ["id"]
          },
        ]
      }
      werkpost_reacties: {
        Row: {
          bericht: string
          beschikbaarheid_tot: string | null
          beschikbaarheid_vanaf: string | null
          company_id: number
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          voorgesteld_tarief: number | null
          werkpost_id: string
        }
        Insert: {
          bericht: string
          beschikbaarheid_tot?: string | null
          beschikbaarheid_vanaf?: string | null
          company_id: number
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          voorgesteld_tarief?: number | null
          werkpost_id: string
        }
        Update: {
          bericht?: string
          beschikbaarheid_tot?: string | null
          beschikbaarheid_vanaf?: string | null
          company_id?: number
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          voorgesteld_tarief?: number | null
          werkpost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "werkpost_reacties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "werkpost_reacties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "werkpost_reacties_werkpost_id_fkey"
            columns: ["werkpost_id"]
            isOneToOne: false
            referencedRelation: "werkposts"
            referencedColumns: ["id"]
          },
        ]
      }
      werkpost_views: {
        Row: {
          company_id: number
          id: string
          viewed_at: string | null
          werkpost_id: string
        }
        Insert: {
          company_id: number
          id?: string
          viewed_at?: string | null
          werkpost_id: string
        }
        Update: {
          company_id?: number
          id?: string
          viewed_at?: string | null
          werkpost_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "werkpost_views_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "werkpost_views_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "werkpost_views_werkpost_id_fkey"
            columns: ["werkpost_id"]
            isOneToOne: false
            referencedRelation: "werkposts"
            referencedColumns: ["id"]
          },
        ]
      }
      werkposts: {
        Row: {
          aantal_personen: number
          aantal_reacties: number | null
          aantal_views: number | null
          aard_van_werk: string
          adres: string | null
          beschrijving: string
          budget_max: number | null
          budget_min: number | null
          company_id: number
          company_naam: string | null
          created_at: string | null
          created_by_user_id: string | null
          documenten: string[] | null
          einddatum: string | null
          fotos: string[] | null
          geschatte_duur_dagen: number | null
          gesloten_op: string | null
          gesloten_reden: string | null
          id: string
          is_actief: boolean | null
          postcode: string | null
          regio: string
          stad: string | null
          startdatum: string
          status: Database["public"]["Enums"]["werkpost_status"]
          tarief_per_uur: number | null
          tarief_type: string | null
          titel: string
          type: Database["public"]["Enums"]["werkpost_type"]
          updated_at: string | null
          urgentie: Database["public"]["Enums"]["werkpost_urgentie"]
          vereiste_vaardigheden: string[] | null
          verloopt_op: string | null
        }
        Insert: {
          aantal_personen?: number
          aantal_reacties?: number | null
          aantal_views?: number | null
          aard_van_werk: string
          adres?: string | null
          beschrijving: string
          budget_max?: number | null
          budget_min?: number | null
          company_id: number
          company_naam?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          documenten?: string[] | null
          einddatum?: string | null
          fotos?: string[] | null
          geschatte_duur_dagen?: number | null
          gesloten_op?: string | null
          gesloten_reden?: string | null
          id?: string
          is_actief?: boolean | null
          postcode?: string | null
          regio: string
          stad?: string | null
          startdatum: string
          status?: Database["public"]["Enums"]["werkpost_status"]
          tarief_per_uur?: number | null
          tarief_type?: string | null
          titel: string
          type?: Database["public"]["Enums"]["werkpost_type"]
          updated_at?: string | null
          urgentie?: Database["public"]["Enums"]["werkpost_urgentie"]
          vereiste_vaardigheden?: string[] | null
          verloopt_op?: string | null
        }
        Update: {
          aantal_personen?: number
          aantal_reacties?: number | null
          aantal_views?: number | null
          aard_van_werk?: string
          adres?: string | null
          beschrijving?: string
          budget_max?: number | null
          budget_min?: number | null
          company_id?: number
          company_naam?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          documenten?: string[] | null
          einddatum?: string | null
          fotos?: string[] | null
          geschatte_duur_dagen?: number | null
          gesloten_op?: string | null
          gesloten_reden?: string | null
          id?: string
          is_actief?: boolean | null
          postcode?: string | null
          regio?: string
          stad?: string | null
          startdatum?: string
          status?: Database["public"]["Enums"]["werkpost_status"]
          tarief_per_uur?: number | null
          tarief_type?: string | null
          titel?: string
          type?: Database["public"]["Enums"]["werkpost_type"]
          updated_at?: string | null
          urgentie?: Database["public"]["Enums"]["werkpost_urgentie"]
          vereiste_vaardigheden?: string[] | null
          verloopt_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "werkposts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "werkposts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bedrijf_smtp_status: {
        Row: {
          bedrijf_id: number | null
          from_email: string | null
          from_name: string | null
          has_password: boolean | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string | null
        }
        Insert: {
          bedrijf_id?: number | null
          from_email?: string | null
          from_name?: string | null
          has_password?: never
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Update: {
          bedrijf_id?: number | null
          from_email?: string | null
          from_name?: string | null
          has_password?: never
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bedrijf_smtp_instellingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bedrijf_smtp_instellingen_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      bedrijven_directory: {
        Row: {
          id: number | null
          logo_url: string | null
          naam: string | null
          slug: string | null
        }
        Insert: {
          id?: number | null
          logo_url?: string | null
          naam?: string | null
          slug?: string | null
        }
        Update: {
          id?: number | null
          logo_url?: string | null
          naam?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      company_einvoicing_settings_safe: {
        Row: {
          auto_send: boolean | null
          bedrijf_id: number | null
          created_at: string | null
          environment: string | null
          has_credentials: boolean | null
          has_peppol_key: boolean | null
          id: string | null
          is_enabled: boolean | null
          peppol_credentials_version: number | null
          peppol_endpoint_url: string | null
          provider_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_send?: boolean | null
          bedrijf_id?: number | null
          created_at?: string | null
          environment?: string | null
          has_credentials?: never
          has_peppol_key?: never
          id?: string | null
          is_enabled?: boolean | null
          peppol_credentials_version?: number | null
          peppol_endpoint_url?: string | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_send?: boolean | null
          bedrijf_id?: number | null
          created_at?: string | null
          environment?: string | null
          has_credentials?: never
          has_peppol_key?: never
          id?: string | null
          is_enabled?: boolean | null
          peppol_credentials_version?: number | null
          peppol_endpoint_url?: string | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_einvoicing_settings_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_einvoicing_settings_bedrijf_id_fkey"
            columns: ["bedrijf_id"]
            isOneToOne: true
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_reminders: {
        Row: {
          company_id: number | null
          created_at: string | null
          email_enabled: boolean | null
          entity_id: number | null
          entity_type: string | null
          id: number | null
          in_app_enabled: boolean | null
          is_sent: boolean | null
          message: string | null
          reminder_at: string | null
          sent_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string | null
          email_enabled?: boolean | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number | null
          in_app_enabled?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          reminder_at?: string | null
          sent_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string | null
          email_enabled?: boolean | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number | null
          in_app_enabled?: boolean | null
          is_sent?: boolean | null
          message?: string | null
          reminder_at?: string | null
          sent_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "bedrijven_directory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_ai_credits_after_payment: {
        Args: {
          p_amount_eur?: number
          p_company_id: number
          p_purchase_id?: string
          p_tokens_to_add: number
        }
        Returns: undefined
      }
      api_v1_fetch: {
        Args: {
          p_hash: string
          p_limit?: number
          p_offset?: number
          p_resource: string
        }
        Returns: Json
      }
      auth_user_id: { Args: never; Returns: string }
      calculate_days_overdue: {
        Args: { p_vervaldatum: string }
        Returns: number
      }
      calculate_factuur_total_paid: {
        Args: { p_factuur_id: string }
        Returns: number
      }
      check_quota: {
        Args: { p_company_id: number; quota_key: string }
        Returns: boolean
      }
      deduct_ai_credits: {
        Args: {
          p_action_type: string
          p_company_id: number
          p_credits_needed: number
          p_metadata?: Json
          p_user_id?: string
        }
        Returns: boolean
      }
      exec_sql: { Args: { sql: string }; Returns: undefined }
      generate_document_number: {
        Args: { p_company_id: number; p_document_type: string }
        Returns: string
      }
      generate_storage_signed_url: {
        Args: { p_bucket: string; p_expiry_seconds?: number; p_path: string }
        Returns: Json
      }
      get_invoice_storage_path: {
        Args: { p_invoice_id: string }
        Returns: string
      }
      get_next_audit_entry_number:
        | {
            Args: { p_document_id: string; p_document_type: string }
            Returns: number
          }
        | { Args: { record_id: number; table_name: string }; Returns: number }
      get_plan_limits: { Args: { plan_name: string }; Returns: Json }
      get_project_file_storage_path: {
        Args: { p_filename: string; p_project_id: string }
        Returns: string
      }
      get_quotation_storage_path: {
        Args: { p_quotation_id: string }
        Returns: string
      }
      get_user_company_id: { Args: never; Returns: number }
      get_user_role_in_company: {
        Args: { p_company_id: number }
        Returns: string
      }
      grant_plan_tokens: {
        Args: { p_company_id: number; p_plan: string }
        Returns: undefined
      }
      is_company_owner_record: {
        Args: { p_company_id: number; p_user_id?: string }
        Returns: boolean
      }
      is_internal_user: { Args: never; Returns: boolean }
      is_member_of_company: { Args: { p_company_id: number }; Returns: boolean }
      is_owner: { Args: { p_company_id: number }; Returns: boolean }
      is_owner_or_admin: { Args: { p_company_id: number }; Returns: boolean }
      is_platform_admin: { Args: { p_user_id?: string }; Returns: boolean }
      log_document_download: {
        Args: { p_document_id: string; p_download_method?: string }
        Returns: undefined
      }
      log_offerte_activity: {
        Args: {
          p_activity_type: string
          p_company_id: number
          p_metadata?: Json
          p_new_status?: string
          p_offerte_id: number
          p_old_status?: string
          p_performed_by?: string
        }
        Returns: number
      }
      mark_expired_werkposts: { Args: never; Returns: undefined }
      provision_company_for_current_user: {
        Args: { company_name: string }
        Returns: number
      }
      provision_landing_workspace: {
        Args: { p_company_name?: string; p_user_name?: string }
        Returns: number
      }
      search_agent_memory: {
        Args: {
          p_company_id: number
          p_limit?: number
          p_query_embedding: string
          p_threshold?: number
        }
        Returns: {
          content: string
          created_at: string
          id: string
          importance: number
          memory_type: string
          similarity: number
        }[]
      }
      search_knowledge: {
        Args: {
          p_company_id: number
          p_limit?: number
          p_query_embedding: string
          p_threshold?: number
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
          type: string
        }[]
      }
      validate_factuur_state_transition: {
        Args: { p_current_status: string; p_new_status: string }
        Returns: boolean
      }
      validate_offerte_state_transition: {
        Args: { p_current_status: string; p_new_status: string }
        Returns: boolean
      }
    }
    Enums: {
      werkpost_status: "open" | "in_behandeling" | "gesloten" | "verlopen"
      werkpost_type: "aanbod" | "vraag"
      werkpost_urgentie: "normaal" | "urgent" | "zeer_urgent"
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
      werkpost_status: ["open", "in_behandeling", "gesloten", "verlopen"],
      werkpost_type: ["aanbod", "vraag"],
      werkpost_urgentie: ["normaal", "urgent", "zeer_urgent"],
    },
  },
} as const
