/* AUTO-GENERATED FILE — DO NOT EDIT MANUALLY.
 * Regenerate with: npm run supabase:types
 */
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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      customer_status_history: {
        Row: {
          changed_at: string
          changed_by_member_id: string | null
          created_at: string
          customer_id: string
          from_status: string | null
          id: string
          organization_id: string
          reason: string | null
          source: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          customer_id: string
          from_status?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          source: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          customer_id?: string
          from_status?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          source?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_status_history_changed_by_member_fk"
            columns: ["organization_id", "changed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_status_history_customer_fk"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_tag_links: {
        Row: {
          created_at: string
          created_by_member_id: string | null
          customer_id: string
          id: string
          organization_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by_member_id?: string | null
          customer_id: string
          id?: string
          organization_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by_member_id?: string | null
          customer_id?: string
          id?: string
          organization_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tag_links_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_tag_links_customer_fk"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_tag_links_tag_fk"
            columns: ["organization_id", "tag_id"]
            isOneToOne: false
            referencedRelation: "customer_tags"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_tags: {
        Row: {
          archived_at: string | null
          color_key: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color_key?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color_key?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by_member_id: string | null
          display_name: string
          email: string | null
          ended_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json
          organization_id: string
          owner_member_id: string | null
          phone: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by_member_id?: string | null
          display_name: string
          email?: string | null
          ended_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          organization_id: string
          owner_member_id?: string | null
          phone?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by_member_id?: string | null
          display_name?: string
          email?: string | null
          ended_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          organization_id?: string
          owner_member_id?: string | null
          phone?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_owner_member_fk"
            columns: ["organization_id", "owner_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      enrollment_progress_facts: {
        Row: {
          corrected_from_fact_id: string | null
          customer_id: string
          description: string | null
          enrollment_id: string
          fact_type: string
          id: string
          idempotency_key: string | null
          is_complete: boolean | null
          numeric_unit: string | null
          numeric_value: number | null
          occurred_at: string
          organization_id: string
          program_id: string
          recorded_at: string
          recorded_by_member_id: string
          sequence_number: number | null
          source: string
          title: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by_member_id: string | null
        }
        Insert: {
          corrected_from_fact_id?: string | null
          customer_id: string
          description?: string | null
          enrollment_id: string
          fact_type: string
          id?: string
          idempotency_key?: string | null
          is_complete?: boolean | null
          numeric_unit?: string | null
          numeric_value?: number | null
          occurred_at: string
          organization_id: string
          program_id: string
          recorded_at?: string
          recorded_by_member_id: string
          sequence_number?: number | null
          source: string
          title?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by_member_id?: string | null
        }
        Update: {
          corrected_from_fact_id?: string | null
          customer_id?: string
          description?: string | null
          enrollment_id?: string
          fact_type?: string
          id?: string
          idempotency_key?: string | null
          is_complete?: boolean | null
          numeric_unit?: string | null
          numeric_value?: number | null
          occurred_at?: string
          organization_id?: string
          program_id?: string
          recorded_at?: string
          recorded_by_member_id?: string
          sequence_number?: number | null
          source?: string
          title?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_progress_facts_corrected_from_fk"
            columns: [
              "organization_id",
              "enrollment_id",
              "corrected_from_fact_id",
            ]
            isOneToOne: false
            referencedRelation: "enrollment_progress_facts"
            referencedColumns: ["organization_id", "enrollment_id", "id"]
          },
          {
            foreignKeyName: "enrollment_progress_facts_enrollment_tuple_fk"
            columns: [
              "organization_id",
              "enrollment_id",
              "customer_id",
              "program_id",
            ]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: [
              "organization_id",
              "id",
              "customer_id",
              "program_id",
            ]
          },
          {
            foreignKeyName: "enrollment_progress_facts_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_progress_facts_recorded_by_member_fk"
            columns: ["organization_id", "recorded_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrollment_progress_facts_voided_by_member_fk"
            columns: ["organization_id", "voided_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      enrollment_status_history: {
        Row: {
          changed_at: string
          changed_by_member_id: string | null
          created_at: string
          enrollment_id: string
          from_status: string | null
          id: string
          organization_id: string
          reason: string | null
          source: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          enrollment_id: string
          from_status?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          source: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          enrollment_id?: string
          from_status?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          source?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_status_history_changed_by_member_fk"
            columns: ["organization_id", "changed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrollment_status_history_enrollment_fk"
            columns: ["organization_id", "enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      enrollments: {
        Row: {
          archived_at: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by_member_id: string
          customer_id: string
          enrolled_at: string
          id: string
          metadata: Json
          organization_id: string
          owner_member_id: string | null
          program_id: string
          source: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_member_id: string
          customer_id: string
          enrolled_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          owner_member_id?: string | null
          program_id: string
          source: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_member_id?: string
          customer_id?: string
          enrolled_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          owner_member_id?: string | null
          program_id?: string
          source?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrollments_customer_fk"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_owner_member_fk"
            columns: ["organization_id", "owner_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "enrollments_program_fk"
            columns: ["organization_id", "program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      lead_pipeline_stages: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          position: number
          stage_category: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          position: number
          stage_category: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          position?: number
          stage_category?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_history: {
        Row: {
          changed_at: string
          changed_by_member_id: string | null
          created_at: string
          from_stage_id: string | null
          id: string
          lead_id: string
          organization_id: string
          reason: string | null
          source: string
          to_stage_id: string
        }
        Insert: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          from_stage_id?: string | null
          id?: string
          lead_id: string
          organization_id: string
          reason?: string | null
          source: string
          to_stage_id: string
        }
        Update: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          from_stage_id?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          reason?: string | null
          source?: string
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_changed_by_member_fk"
            columns: ["organization_id", "changed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "lead_stage_history_from_stage_fk"
            columns: ["organization_id", "from_stage_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_stages"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "lead_stage_history_lead_fk"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "lead_stage_history_to_stage_fk"
            columns: ["organization_id", "to_stage_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_stages"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_at: string
          changed_by_member_id: string | null
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          organization_id: string
          reason: string | null
          source: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          organization_id: string
          reason?: string | null
          source: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          organization_id?: string
          reason?: string | null
          source?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_changed_by_member_fk"
            columns: ["organization_id", "changed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "lead_status_history_lead_fk"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          converted_at: string | null
          converted_customer_id: string | null
          created_at: string
          created_by_member_id: string | null
          display_name: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json
          organization_id: string
          owner_member_id: string | null
          phone: string | null
          pursuit_label: string | null
          source_detail: string | null
          source_type: string
          stage_id: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          converted_at?: string | null
          converted_customer_id?: string | null
          created_at?: string
          created_by_member_id?: string | null
          display_name: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          organization_id: string
          owner_member_id?: string | null
          phone?: string | null
          pursuit_label?: string | null
          source_detail?: string | null
          source_type?: string
          stage_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          converted_at?: string | null
          converted_customer_id?: string | null
          created_at?: string
          created_by_member_id?: string | null
          display_name?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json
          organization_id?: string
          owner_member_id?: string | null
          phone?: string | null
          pursuit_label?: string | null
          source_detail?: string | null
          source_type?: string
          stage_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_customer_fk"
            columns: ["organization_id", "converted_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "leads_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_member_fk"
            columns: ["organization_id", "owner_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "leads_stage_fk"
            columns: ["organization_id", "stage_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_stages"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          locale: string | null
          name: string
          slug: string
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          locale?: string | null
          name: string
          slug: string
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          locale?: string | null
          name?: string
          slug?: string
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registration_intents: {
        Row: {
          company_name: string
          completed_at: string | null
          created_at: string
          display_name: string
          last_error_code: string | null
          organization_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          completed_at?: string | null
          created_at?: string
          display_name: string
          last_error_code?: string | null
          organization_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          completed_at?: string | null
          created_at?: string
          display_name?: string
          last_error_code?: string | null
          organization_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_intents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_status_history: {
        Row: {
          changed_at: string
          changed_by_member_id: string | null
          created_at: string
          from_status: string | null
          id: string
          organization_id: string
          program_id: string
          reason: string | null
          source: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          organization_id: string
          program_id: string
          reason?: string | null
          source: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by_member_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          organization_id?: string
          program_id?: string
          reason?: string | null
          source?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_status_history_changed_by_member_fk"
            columns: ["organization_id", "changed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "program_status_history_program_fk"
            columns: ["organization_id", "program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      programs: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by_member_id: string
          delivery_mode: string
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by_member_id: string
          delivery_mode: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by_member_id?: string
          delivery_mode?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_history: {
        Row: {
          changed_by_member_id: string
          created_at: string
          from_status: string | null
          id: string
          organization_id: string
          reason: string | null
          source: string
          task_id: string
          to_status: string
        }
        Insert: {
          changed_by_member_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          source: string
          task_id: string
          to_status: string
        }
        Update: {
          changed_by_member_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          source?: string
          task_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_changed_by_member_fk"
            columns: ["organization_id", "changed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "task_status_history_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_task_fk"
            columns: ["organization_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          assignee_member_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by_member_id: string | null
          completed_at: string | null
          completed_by_member_id: string | null
          completion_note: string | null
          created_at: string
          created_by_member_id: string
          customer_id: string | null
          description: string | null
          due_at: string
          enrollment_id: string | null
          id: string
          idempotency_key: string | null
          lead_id: string | null
          metadata: Json
          organization_id: string
          predecessor_task_id: string | null
          priority: string
          program_id: string | null
          source: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assignee_member_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_member_id?: string | null
          completed_at?: string | null
          completed_by_member_id?: string | null
          completion_note?: string | null
          created_at?: string
          created_by_member_id: string
          customer_id?: string | null
          description?: string | null
          due_at: string
          enrollment_id?: string | null
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          metadata?: Json
          organization_id: string
          predecessor_task_id?: string | null
          priority?: string
          program_id?: string | null
          source?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assignee_member_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_member_id?: string | null
          completed_at?: string | null
          completed_by_member_id?: string | null
          completion_note?: string | null
          created_at?: string
          created_by_member_id?: string
          customer_id?: string | null
          description?: string | null
          due_at?: string
          enrollment_id?: string | null
          id?: string
          idempotency_key?: string | null
          lead_id?: string | null
          metadata?: Json
          organization_id?: string
          predecessor_task_id?: string | null
          priority?: string
          program_id?: string | null
          source?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_member_fk"
            columns: ["organization_id", "assignee_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_cancelled_by_member_fk"
            columns: ["organization_id", "cancelled_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_completed_by_member_fk"
            columns: ["organization_id", "completed_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_customer_fk"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_enrollment_tuple_fk"
            columns: [
              "organization_id",
              "enrollment_id",
              "customer_id",
              "program_id",
            ]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: [
              "organization_id",
              "id",
              "customer_id",
              "program_id",
            ]
          },
          {
            foreignKeyName: "tasks_lead_fk"
            columns: ["organization_id", "lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "tasks_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_predecessor_fk"
            columns: ["organization_id", "predecessor_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_customer: {
        Args: { p_customer_id: string; p_organization_id: string }
        Returns: undefined
      }
      archive_enrollment: {
        Args: { p_enrollment_id: string; p_organization_id: string }
        Returns: undefined
      }
      archive_lead: {
        Args: { p_lead_id: string; p_organization_id: string }
        Returns: undefined
      }
      archive_pipeline_stage: {
        Args: {
          p_organization_id: string
          p_replacement_stage_id?: string
          p_stage_id: string
        }
        Returns: undefined
      }
      archive_program: {
        Args: { p_organization_id: string; p_program_id: string }
        Returns: undefined
      }
      archive_task: {
        Args: { p_organization_id: string; p_task_id: string }
        Returns: undefined
      }
      cancel_task: {
        Args: {
          p_cancel_reason: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: undefined
      }
      complete_task: {
        Args: {
          p_completion_note?: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: undefined
      }
      convert_lead_to_customer: {
        Args: {
          p_existing_customer_id?: string
          p_lead_id: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: string
      }
      create_customer: {
        Args: {
          p_display_name: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_organization_id: string
          p_owner_member_id?: string
          p_phone?: string
        }
        Returns: string
      }
      create_enrollment: {
        Args: {
          p_customer_id: string
          p_initial_status?: string
          p_metadata?: Json
          p_organization_id: string
          p_owner_member_id?: string
          p_program_id: string
          p_source?: string
        }
        Returns: string
      }
      create_lead: {
        Args: {
          p_display_name: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_metadata?: Json
          p_organization_id: string
          p_owner_member_id?: string
          p_phone?: string
          p_pursuit_label?: string
          p_source_detail?: string
          p_source_type?: string
        }
        Returns: string
      }
      complete_owner_self_registration: {
        Args: {
          p_locale?: string
          p_name: string
          p_slug: string
          p_timezone?: string
        }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          p_locale?: string
          p_name: string
          p_slug: string
          p_timezone?: string
        }
        Returns: string
      }
      upsert_registration_intent: {
        Args: {
          p_company_name: string
          p_display_name: string
        }
        Returns: undefined
      }
      create_pipeline_stage: {
        Args: {
          p_name: string
          p_organization_id: string
          p_position?: number
          p_stage_category: string
        }
        Returns: string
      }
      create_program: {
        Args: {
          p_delivery_mode: string
          p_description?: string
          p_metadata?: Json
          p_name: string
          p_organization_id: string
        }
        Returns: string
      }
      create_task: {
        Args: {
          p_assignee_member_id?: string
          p_customer_id?: string
          p_description?: string
          p_due_at: string
          p_enrollment_id?: string
          p_idempotency_key?: string
          p_lead_id?: string
          p_metadata?: Json
          p_organization_id: string
          p_predecessor_task_id?: string
          p_priority?: string
          p_program_id?: string
          p_source?: string
          p_task_type?: string
          p_title: string
        }
        Returns: string
      }
      ensure_default_pipeline_stages: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      reassign_task: {
        Args: {
          p_assignee_member_id?: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: undefined
      }
      record_progress_fact: {
        Args: {
          p_corrected_from_fact_id?: string
          p_description?: string
          p_enrollment_id: string
          p_fact_type: string
          p_idempotency_key?: string
          p_is_complete?: boolean
          p_numeric_unit?: string
          p_numeric_value?: number
          p_occurred_at: string
          p_organization_id: string
          p_sequence_number?: number
          p_title?: string
        }
        Returns: string
      }
      reorder_pipeline_stages: {
        Args: { p_organization_id: string; p_stage_ids: string[] }
        Returns: undefined
      }
      reschedule_task: {
        Args: { p_due_at: string; p_organization_id: string; p_task_id: string }
        Returns: undefined
      }
      restore_customer: {
        Args: { p_customer_id: string; p_organization_id: string }
        Returns: undefined
      }
      restore_enrollment: {
        Args: { p_enrollment_id: string; p_organization_id: string }
        Returns: undefined
      }
      restore_lead: {
        Args: { p_lead_id: string; p_organization_id: string }
        Returns: undefined
      }
      restore_pipeline_stage: {
        Args: { p_organization_id: string; p_stage_id: string }
        Returns: undefined
      }
      restore_program: {
        Args: { p_organization_id: string; p_program_id: string }
        Returns: undefined
      }
      restore_task: {
        Args: { p_organization_id: string; p_task_id: string }
        Returns: undefined
      }
      set_default_pipeline_stage: {
        Args: { p_organization_id: string; p_stage_id: string }
        Returns: undefined
      }
      transition_customer_status: {
        Args: {
          p_customer_id: string
          p_organization_id: string
          p_reason?: string
          p_to_status: string
        }
        Returns: undefined
      }
      transition_enrollment_status: {
        Args: {
          p_enrollment_id: string
          p_organization_id: string
          p_reason?: string
          p_source?: string
          p_to_status: string
        }
        Returns: undefined
      }
      transition_lead_stage: {
        Args: {
          p_lead_id: string
          p_organization_id: string
          p_reason?: string
          p_to_stage_id: string
        }
        Returns: undefined
      }
      transition_lead_status: {
        Args: {
          p_lead_id: string
          p_organization_id: string
          p_reason?: string
          p_to_status: string
        }
        Returns: undefined
      }
      transition_program_status: {
        Args: {
          p_organization_id: string
          p_program_id: string
          p_reason?: string
          p_source?: string
          p_to_status: string
        }
        Returns: undefined
      }
      update_pipeline_stage: {
        Args: {
          p_name: string
          p_organization_id: string
          p_stage_category: string
          p_stage_id: string
        }
        Returns: undefined
      }
      update_program: {
        Args: {
          p_delivery_mode: string
          p_description: string
          p_metadata: Json
          p_name: string
          p_organization_id: string
          p_program_id: string
        }
        Returns: undefined
      }
      update_task: {
        Args: {
          p_description?: string
          p_metadata?: Json
          p_organization_id: string
          p_priority?: string
          p_task_id: string
          p_task_type?: string
          p_title: string
        }
        Returns: undefined
      }
      void_progress_fact: {
        Args: {
          p_organization_id: string
          p_progress_fact_id: string
          p_reason: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
