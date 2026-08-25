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
      attention_item_events: {
        Row: {
          actor_member_id: string | null
          attention_item_id: string
          created_at: string
          event_type: string
          from_assignee_member_id: string | null
          from_severity: string | null
          from_status: string | null
          id: string
          organization_id: string
          payload: Json
          reason: string | null
          source: string
          to_assignee_member_id: string | null
          to_severity: string | null
          to_status: string | null
        }
        Insert: {
          actor_member_id?: string | null
          attention_item_id: string
          created_at?: string
          event_type: string
          from_assignee_member_id?: string | null
          from_severity?: string | null
          from_status?: string | null
          id?: string
          organization_id: string
          payload?: Json
          reason?: string | null
          source: string
          to_assignee_member_id?: string | null
          to_severity?: string | null
          to_status?: string | null
        }
        Update: {
          actor_member_id?: string | null
          attention_item_id?: string
          created_at?: string
          event_type?: string
          from_assignee_member_id?: string | null
          from_severity?: string | null
          from_status?: string | null
          id?: string
          organization_id?: string
          payload?: Json
          reason?: string | null
          source?: string
          to_assignee_member_id?: string | null
          to_severity?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attention_item_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_item_events_from_assignee_member_fk"
            columns: ["organization_id", "from_assignee_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_item_events_item_fk"
            columns: ["organization_id", "attention_item_id"]
            isOneToOne: false
            referencedRelation: "attention_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_item_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_item_events_to_assignee_member_fk"
            columns: ["organization_id", "to_assignee_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      attention_items: {
        Row: {
          acknowledged_at: string | null
          archived_at: string | null
          assignee_member_id: string | null
          created_at: string
          created_by_member_id: string | null
          customer_id: string | null
          dedupe_key: string
          detection_count: number
          dismissal_reason: string | null
          dismissed_at: string | null
          enrollment_id: string | null
          expired_at: string | null
          first_detected_at: string
          id: string
          last_detected_at: string
          organization_id: string
          program_id: string | null
          resolution_reason: string | null
          resolved_at: string | null
          severity: string
          social_connection_id: string | null
          social_publication_id: string | null
          source_entity_id: string
          source_type: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          updated_by_member_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          archived_at?: string | null
          assignee_member_id?: string | null
          created_at?: string
          created_by_member_id?: string | null
          customer_id?: string | null
          dedupe_key: string
          detection_count?: number
          dismissal_reason?: string | null
          dismissed_at?: string | null
          enrollment_id?: string | null
          expired_at?: string | null
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          organization_id: string
          program_id?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          severity?: string
          social_connection_id?: string | null
          social_publication_id?: string | null
          source_entity_id: string
          source_type?: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          updated_by_member_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          archived_at?: string | null
          assignee_member_id?: string | null
          created_at?: string
          created_by_member_id?: string | null
          customer_id?: string | null
          dedupe_key?: string
          detection_count?: number
          dismissal_reason?: string | null
          dismissed_at?: string | null
          enrollment_id?: string | null
          expired_at?: string | null
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          organization_id?: string
          program_id?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          severity?: string
          social_connection_id?: string | null
          social_publication_id?: string | null
          source_entity_id?: string
          source_type?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attention_items_assignee_member_fk"
            columns: ["organization_id", "assignee_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_items_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_items_enrollment_tuple_fk"
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
            foreignKeyName: "attention_items_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attention_items_social_connection_fk"
            columns: ["organization_id", "social_connection_id"]
            isOneToOne: false
            referencedRelation: "social_account_connections"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_items_social_publication_fk"
            columns: ["organization_id", "social_publication_id"]
            isOneToOne: false
            referencedRelation: "social_publications"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_items_updated_by_member_fk"
            columns: ["organization_id", "updated_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      attention_signals: {
        Row: {
          attention_item_id: string
          created_at: string
          created_by_member_id: string | null
          detected_at: string
          enrollment_id: string | null
          evidence: Json
          explanation: string
          id: string
          organization_id: string
          rule_key: string | null
          signal_origin: string
        }
        Insert: {
          attention_item_id: string
          created_at?: string
          created_by_member_id?: string | null
          detected_at?: string
          enrollment_id?: string | null
          evidence?: Json
          explanation: string
          id?: string
          organization_id: string
          rule_key?: string | null
          signal_origin: string
        }
        Update: {
          attention_item_id?: string
          created_at?: string
          created_by_member_id?: string | null
          detected_at?: string
          enrollment_id?: string | null
          evidence?: Json
          explanation?: string
          id?: string
          organization_id?: string
          rule_key?: string | null
          signal_origin?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_signals_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_signals_enrollment_fk"
            columns: ["organization_id", "enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_signals_item_fk"
            columns: ["organization_id", "attention_item_id"]
            isOneToOne: false
            referencedRelation: "attention_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "attention_signals_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capabilities: {
        Row: {
          capability_key: string
          catalog_visibility: string
          created_at: string
          description: string
          foundation_id: string | null
          id: string
          label: string
          lifecycle_status: string
          owner_class: string
          owner_key: string
          superseded_by_capability_id: string | null
          updated_at: string
        }
        Insert: {
          capability_key: string
          catalog_visibility: string
          created_at?: string
          description: string
          foundation_id?: string | null
          id?: string
          label: string
          lifecycle_status: string
          owner_class: string
          owner_key: string
          superseded_by_capability_id?: string | null
          updated_at?: string
        }
        Update: {
          capability_key?: string
          catalog_visibility?: string
          created_at?: string
          description?: string
          foundation_id?: string | null
          id?: string
          label?: string
          lifecycle_status?: string
          owner_class?: string
          owner_key?: string
          superseded_by_capability_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capabilities_foundation_fk"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_foundations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capabilities_superseded_by_fk"
            columns: ["superseded_by_capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_dependencies: {
        Row: {
          capability_id: string
          created_at: string
          depends_on_capability_id: string
          updated_at: string
        }
        Insert: {
          capability_id: string
          created_at?: string
          depends_on_capability_id: string
          updated_at?: string
        }
        Update: {
          capability_id?: string
          created_at?: string
          depends_on_capability_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capability_dependencies_capability_fk"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capability_dependencies_depends_on_fk"
            columns: ["depends_on_capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_readiness: {
        Row: {
          capability_id: string
          created_at: string
          evidence_phase: string | null
          id: string
          readiness_status: string
          supported_scope: Json
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          capability_id: string
          created_at?: string
          evidence_phase?: string | null
          id?: string
          readiness_status: string
          supported_scope: Json
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          capability_id?: string
          created_at?: string
          evidence_phase?: string | null
          id?: string
          readiness_status?: string
          supported_scope?: Json
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capability_readiness_capability_fk"
            columns: ["capability_id"]
            isOneToOne: true
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
        ]
      }
      context_capability_mappings: {
        Row: {
          capability_id: string
          created_at: string
          mapping_op: string
          relevance: string | null
          version_id: string
        }
        Insert: {
          capability_id: string
          created_at?: string
          mapping_op: string
          relevance?: string | null
          version_id: string
        }
        Update: {
          capability_id?: string
          created_at?: string
          mapping_op?: string
          relevance?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_capability_mappings_capability_fk"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_capability_mappings_version_fk"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "context_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      context_pack_readiness: {
        Row: {
          created_at: string
          evidence_phase: string | null
          id: string
          readiness_status: string
          supported_scope: Json
          updated_at: string
          verified_at: string | null
          version_id: string
        }
        Insert: {
          created_at?: string
          evidence_phase?: string | null
          id?: string
          readiness_status: string
          supported_scope: Json
          updated_at?: string
          verified_at?: string | null
          version_id: string
        }
        Update: {
          created_at?: string
          evidence_phase?: string | null
          id?: string
          readiness_status?: string
          supported_scope?: Json
          updated_at?: string
          verified_at?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_pack_readiness_version_fk"
            columns: ["version_id"]
            isOneToOne: true
            referencedRelation: "context_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      context_pack_versions: {
        Row: {
          change_impact: string
          completeness: string
          created_at: string
          definition_summary: string
          id: string
          impact_note: string | null
          intended_operator: string | null
          pack_id: string
          parent_version_id: string | null
          primary_exchange: string | null
          publication_status: string
          version_number: number
        }
        Insert: {
          change_impact: string
          completeness: string
          created_at?: string
          definition_summary: string
          id?: string
          impact_note?: string | null
          intended_operator?: string | null
          pack_id: string
          parent_version_id?: string | null
          primary_exchange?: string | null
          publication_status: string
          version_number: number
        }
        Update: {
          change_impact?: string
          completeness?: string
          created_at?: string
          definition_summary?: string
          id?: string
          impact_note?: string | null
          intended_operator?: string | null
          pack_id?: string
          parent_version_id?: string | null
          primary_exchange?: string | null
          publication_status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "context_pack_versions_pack_fk"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "context_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_pack_versions_parent_fk"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "context_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      context_packs: {
        Row: {
          created_at: string
          deep_specialization_id: string | null
          default_locale: string
          foundation_id: string | null
          id: string
          industry_id: string | null
          label: string
          lifecycle_status: string
          niche_id: string | null
          pack_key: string
          pack_kind: string
          specialization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deep_specialization_id?: string | null
          default_locale?: string
          foundation_id?: string | null
          id?: string
          industry_id?: string | null
          label: string
          lifecycle_status: string
          niche_id?: string | null
          pack_key: string
          pack_kind: string
          specialization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deep_specialization_id?: string | null
          default_locale?: string
          foundation_id?: string | null
          id?: string
          industry_id?: string | null
          label?: string
          lifecycle_status?: string
          niche_id?: string | null
          pack_key?: string
          pack_kind?: string
          specialization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_packs_deep_specialization_fk"
            columns: ["deep_specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_deep_specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packs_foundation_fk"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_foundations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packs_industry_fk"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packs_niche_fk"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_packs_specialization_fk"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      context_terminology: {
        Row: {
          created_at: string
          help_text: string | null
          locale: string
          plural_label: string
          short_label: string | null
          singular_label: string
          term_key: string
          version_id: string
        }
        Insert: {
          created_at?: string
          help_text?: string | null
          locale: string
          plural_label: string
          short_label?: string | null
          singular_label: string
          term_key: string
          version_id: string
        }
        Update: {
          created_at?: string
          help_text?: string | null
          locale?: string
          plural_label?: string
          short_label?: string | null
          singular_label?: string
          term_key?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_terminology_version_fk"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "context_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      organization_business_activities: {
        Row: {
          activity_key: string
          classification_kind: string | null
          created_at: string
          deep_specialization_id: string | null
          display_name: string
          foundation_id: string | null
          id: string
          industry_id: string | null
          is_primary: boolean
          niche_id: string | null
          organization_id: string
          specialization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity_key: string
          classification_kind?: string | null
          created_at?: string
          deep_specialization_id?: string | null
          display_name: string
          foundation_id?: string | null
          id?: string
          industry_id?: string | null
          is_primary?: boolean
          niche_id?: string | null
          organization_id: string
          specialization_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          activity_key?: string
          classification_kind?: string | null
          created_at?: string
          deep_specialization_id?: string | null
          display_name?: string
          foundation_id?: string | null
          id?: string
          industry_id?: string | null
          is_primary?: boolean
          niche_id?: string | null
          organization_id?: string
          specialization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_business_activities_deep_specialization_fk"
            columns: ["deep_specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_deep_specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_business_activities_foundation_fk"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_foundations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_business_activities_industry_fk"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_business_activities_niche_fk"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_business_activities_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_business_activities_specialization_fk"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_context_assignment_events: {
        Row: {
          actor_member_id: string | null
          actor_user_id: string | null
          assignment_id: string | null
          business_activity_id: string
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          reason: string | null
          source: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_user_id?: string | null
          assignment_id?: string | null
          business_activity_id: string
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          reason?: string | null
          source: string
        }
        Update: {
          actor_member_id?: string | null
          actor_user_id?: string | null
          assignment_id?: string | null
          business_activity_id?: string
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          reason?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_context_assignment_events_activity_fk"
            columns: ["organization_id", "business_activity_id"]
            isOneToOne: false
            referencedRelation: "organization_business_activities"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_context_assignment_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_context_assignment_events_actor_user_fk"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_assignment_events_assignment_fk"
            columns: ["organization_id", "assignment_id"]
            isOneToOne: false
            referencedRelation: "organization_context_assignments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_context_assignment_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_context_assignments: {
        Row: {
          actor_member_id: string | null
          actor_user_id: string | null
          business_activity_id: string
          context_pack_version_id: string
          created_at: string
          id: string
          organization_id: string
          reason: string | null
          source: string
          status: string
          superseded_at: string | null
          updated_at: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_user_id?: string | null
          business_activity_id: string
          context_pack_version_id: string
          created_at?: string
          id?: string
          organization_id: string
          reason?: string | null
          source: string
          status: string
          superseded_at?: string | null
          updated_at?: string
        }
        Update: {
          actor_member_id?: string | null
          actor_user_id?: string | null
          business_activity_id?: string
          context_pack_version_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          reason?: string | null
          source?: string
          status?: string
          superseded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_context_assignments_activity_fk"
            columns: ["organization_id", "business_activity_id"]
            isOneToOne: false
            referencedRelation: "organization_business_activities"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_context_assignments_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_context_assignments_actor_user_fk"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_assignments_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_context_assignments_version_fk"
            columns: ["context_pack_version_id"]
            isOneToOne: false
            referencedRelation: "context_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitation_events: {
        Row: {
          actor_member_id: string | null
          created_at: string
          event_type: string
          id: string
          invitation_id: string
          organization_id: string
          payload: Json
        }
        Insert: {
          actor_member_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          invitation_id: string
          organization_id: string
          payload?: Json
        }
        Update: {
          actor_member_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          invitation_id?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitation_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_invitation_events_invitation_fk"
            columns: ["organization_id", "invitation_id"]
            isOneToOne: false
            referencedRelation: "organization_invitations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_invitation_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          email_normalized: string
          expires_at: string | null
          id: string
          invited_by_member_id: string
          organization_id: string
          revoked_at: string | null
          role: string
          status: string
          token_hash: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email_normalized: string
          expires_at?: string | null
          id?: string
          invited_by_member_id: string
          organization_id: string
          revoked_at?: string | null
          role: string
          status: string
          token_hash?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email_normalized?: string
          expires_at?: string | null
          id?: string
          invited_by_member_id?: string
          organization_id?: string
          revoked_at?: string | null
          role?: string
          status?: string
          token_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_accepted_by_user_fk"
            columns: ["accepted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_inviter_member_fk"
            columns: ["organization_id", "invited_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          business_type: string | null
          created_at: string
          created_by: string | null
          first_run_checklist_dismissed_at: string | null
          id: string
          locale: string | null
          name: string
          onboarding_completed_at: string | null
          primary_audience: string | null
          primary_goal: string | null
          primary_offering: string | null
          slug: string
          status: string
          team_size_band: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          first_run_checklist_dismissed_at?: string | null
          id?: string
          locale?: string | null
          name: string
          onboarding_completed_at?: string | null
          primary_audience?: string | null
          primary_goal?: string | null
          primary_offering?: string | null
          slug: string
          status?: string
          team_size_band?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          first_run_checklist_dismissed_at?: string | null
          id?: string
          locale?: string | null
          name?: string
          onboarding_completed_at?: string | null
          primary_audience?: string | null
          primary_goal?: string | null
          primary_offering?: string | null
          slug?: string
          status?: string
          team_size_band?: string | null
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
      social_account_connections: {
        Row: {
          capability_snapshot: Json
          capability_snapshot_at: string | null
          connected_at: string | null
          connected_by_member_id: string
          created_at: string
          credential_ref_id: string | null
          display_name: string | null
          external_account_id: string | null
          health: string
          id: string
          last_refreshed_at: string | null
          login_product: string
          organization_id: string
          professional_account_type: string | null
          provider: string
          reauthorization_required_at: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          capability_snapshot?: Json
          capability_snapshot_at?: string | null
          connected_at?: string | null
          connected_by_member_id: string
          created_at?: string
          credential_ref_id?: string | null
          display_name?: string | null
          external_account_id?: string | null
          health?: string
          id?: string
          last_refreshed_at?: string | null
          login_product: string
          organization_id: string
          professional_account_type?: string | null
          provider: string
          reauthorization_required_at?: string | null
          status: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          capability_snapshot?: Json
          capability_snapshot_at?: string | null
          connected_at?: string | null
          connected_by_member_id?: string
          created_at?: string
          credential_ref_id?: string | null
          display_name?: string | null
          external_account_id?: string | null
          health?: string
          id?: string
          last_refreshed_at?: string | null
          login_product?: string
          organization_id?: string
          professional_account_type?: string | null
          provider?: string
          reauthorization_required_at?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_account_connections_connected_by_fk"
            columns: ["organization_id", "connected_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_account_connections_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_account_connections_workspace_fk"
            columns: ["organization_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_approval_decisions: {
        Row: {
          approval_context: string
          brand_id: string
          content_id: string
          created_at: string
          decided_by_member_id: string
          decision: string
          id: string
          organization_id: string
          reason: string | null
          review_request_id: string | null
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Insert: {
          approval_context?: string
          brand_id: string
          content_id: string
          created_at?: string
          decided_by_member_id: string
          decision: string
          id?: string
          organization_id: string
          reason?: string | null
          review_request_id?: string | null
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Update: {
          approval_context?: string
          brand_id?: string
          content_id?: string
          created_at?: string
          decided_by_member_id?: string
          decision?: string
          id?: string
          organization_id?: string
          reason?: string | null
          review_request_id?: string | null
          variant_id?: string
          variant_version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_approval_decisions_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_approval_decisions_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_approval_decisions_decided_by_fk"
            columns: ["organization_id", "decided_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_approval_decisions_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_approval_decisions_review_fk"
            columns: ["organization_id", "review_request_id"]
            isOneToOne: false
            referencedRelation: "social_review_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_approval_decisions_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_approval_decisions_version_fk"
            columns: ["organization_id", "variant_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_audiences: {
        Row: {
          archived_at: string | null
          brand_id: string
          created_at: string
          created_by_member_id: string
          description: string | null
          desired_outcome: string | null
          display_name: string
          id: string
          needs: string | null
          organization_id: string
          priority: number
          source_kind: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          created_at?: string
          created_by_member_id: string
          description?: string | null
          desired_outcome?: string | null
          display_name: string
          id?: string
          needs?: string | null
          organization_id: string
          priority?: number
          source_kind?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          created_at?: string
          created_by_member_id?: string
          description?: string | null
          desired_outcome?: string | null
          display_name?: string
          id?: string
          needs?: string | null
          organization_id?: string
          priority?: number
          source_kind?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_audiences_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_audiences_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_audiences_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_brand_brain_events: {
        Row: {
          actor_member_id: string | null
          actor_source: string
          brand_id: string
          campaign_id: string | null
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          workspace_id: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_source: string
          brand_id: string
          campaign_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          workspace_id: string
        }
        Update: {
          actor_member_id?: string | null
          actor_source?: string
          brand_id?: string
          campaign_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_brand_brain_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_brand_brain_events_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_brand_brain_events_campaign_fk"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_brand_brain_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_brand_rules: {
        Row: {
          archived_at: string | null
          body: string
          brand_id: string
          created_at: string
          created_by_member_id: string
          id: string
          organization_id: string
          rule_kind: string
          sort_order: number
          source_kind: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          body: string
          brand_id: string
          created_at?: string
          created_by_member_id: string
          id?: string
          organization_id: string
          rule_kind: string
          sort_order?: number
          source_kind?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          body?: string
          brand_id?: string
          created_at?: string
          created_by_member_id?: string
          id?: string
          organization_id?: string
          rule_kind?: string
          sort_order?: number
          source_kind?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_brand_rules_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_brand_rules_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_brand_rules_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_brands: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by_member_id: string
          customer_id: string | null
          display_name: string
          id: string
          organization_id: string
          positioning: string | null
          primary_language: string | null
          profile_source_kind: string
          summary: string | null
          updated_at: string
          voice_config: Json
          website_url: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by_member_id: string
          customer_id?: string | null
          display_name: string
          id?: string
          organization_id: string
          positioning?: string | null
          primary_language?: string | null
          profile_source_kind?: string
          summary?: string | null
          updated_at?: string
          voice_config?: Json
          website_url?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by_member_id?: string
          customer_id?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          positioning?: string | null
          primary_language?: string | null
          profile_source_kind?: string
          summary?: string | null
          updated_at?: string
          voice_config?: Json
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_brands_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_brands_customer_fk"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_brands_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_campaign_audiences: {
        Row: {
          audience_id: string
          campaign_id: string
          created_at: string
          organization_id: string
        }
        Insert: {
          audience_id: string
          campaign_id: string
          created_at?: string
          organization_id: string
        }
        Update: {
          audience_id?: string
          campaign_id?: string
          created_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_campaign_audiences_audience_fk"
            columns: ["organization_id", "audience_id"]
            isOneToOne: false
            referencedRelation: "social_audiences"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_campaign_audiences_campaign_fk"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_campaign_pillars: {
        Row: {
          campaign_id: string
          created_at: string
          organization_id: string
          pillar_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          organization_id: string
          pillar_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          organization_id?: string
          pillar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_campaign_pillars_campaign_fk"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_campaign_pillars_pillar_fk"
            columns: ["organization_id", "pillar_id"]
            isOneToOne: false
            referencedRelation: "social_content_pillars"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_campaign_platforms: {
        Row: {
          campaign_id: string
          created_at: string
          organization_id: string
          planned_provider: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          organization_id: string
          planned_provider: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          organization_id?: string
          planned_provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_campaign_platforms_campaign_fk"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_campaigns: {
        Row: {
          archived_at: string | null
          brand_id: string
          created_at: string
          created_by_member_id: string
          description: string | null
          display_name: string
          ends_at: string | null
          goal_id: string | null
          id: string
          organization_id: string
          starts_at: string | null
          status: string
          success_criteria: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          created_at?: string
          created_by_member_id: string
          description?: string | null
          display_name: string
          ends_at?: string | null
          goal_id?: string | null
          id?: string
          organization_id: string
          starts_at?: string | null
          status?: string
          success_criteria?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          created_at?: string
          created_by_member_id?: string
          description?: string | null
          display_name?: string
          ends_at?: string | null
          goal_id?: string | null
          id?: string
          organization_id?: string
          starts_at?: string | null
          status?: string
          success_criteria?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_campaigns_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_campaigns_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_campaigns_goal_fk"
            columns: ["organization_id", "goal_id"]
            isOneToOne: false
            referencedRelation: "social_goals"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_campaigns_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_closed_beta_enrollment_events: {
        Row: {
          actor_source: string
          actor_user_id: string | null
          created_at: string
          enrollment_id: string
          event_type: string
          id: string
          next_status: string
          organization_id: string
          payload: Json
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          actor_source: string
          actor_user_id?: string | null
          created_at?: string
          enrollment_id: string
          event_type: string
          id?: string
          next_status: string
          organization_id: string
          payload?: Json
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          actor_source?: string
          actor_user_id?: string | null
          created_at?: string
          enrollment_id?: string
          event_type?: string
          id?: string
          next_status?: string
          organization_id?: string
          payload?: Json
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_closed_beta_enrollment_events_enrollment_fk"
            columns: ["organization_id", "enrollment_id"]
            isOneToOne: false
            referencedRelation: "social_closed_beta_enrollments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_closed_beta_enrollment_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_closed_beta_enrollments: {
        Row: {
          approved_at: string | null
          created_at: string
          id: string
          organization_id: string
          paused_at: string | null
          publishing_allowed_at: string | null
          reason: string | null
          revoked_at: string | null
          status: string
          status_before_pause: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          paused_at?: string | null
          publishing_allowed_at?: string | null
          reason?: string | null
          revoked_at?: string | null
          status: string
          status_before_pause?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          paused_at?: string | null
          publishing_allowed_at?: string | null
          reason?: string | null
          revoked_at?: string | null
          status?: string
          status_before_pause?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_closed_beta_enrollments_organization_fk"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connection_events: {
        Row: {
          actor_member_id: string | null
          actor_source: string
          connection_id: string
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
        }
        Insert: {
          actor_member_id?: string | null
          actor_source: string
          connection_id: string
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
        }
        Update: {
          actor_member_id?: string | null
          actor_source?: string
          connection_id?: string
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "social_connection_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_connection_events_connection_fk"
            columns: ["organization_id", "connection_id"]
            isOneToOne: false
            referencedRelation: "social_account_connections"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_connection_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_content_events: {
        Row: {
          actor_member_id: string | null
          actor_source: string
          asset_id: string | null
          brand_id: string
          content_id: string | null
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          variant_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_source: string
          asset_id?: string | null
          brand_id: string
          content_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          variant_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_member_id?: string | null
          actor_source?: string
          asset_id?: string | null
          brand_id?: string
          content_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          variant_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_events_asset_fk"
            columns: ["organization_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "social_media_assets"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_events_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_events_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_events_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_content_item_versions: {
        Row: {
          brand_id: string
          campaign_id: string | null
          change_note: string | null
          concept_summary: string | null
          content_id: string
          created_at: string
          created_by_member_id: string
          id: string
          internal_title: string
          organization_id: string
          origin_kind: string
          previous_version_id: string | null
          primary_message: string | null
          primary_pillar_id: string | null
          version_number: number
          workspace_id: string
        }
        Insert: {
          brand_id: string
          campaign_id?: string | null
          change_note?: string | null
          concept_summary?: string | null
          content_id: string
          created_at?: string
          created_by_member_id: string
          id?: string
          internal_title: string
          organization_id: string
          origin_kind: string
          previous_version_id?: string | null
          primary_message?: string | null
          primary_pillar_id?: string | null
          version_number: number
          workspace_id: string
        }
        Update: {
          brand_id?: string
          campaign_id?: string | null
          change_note?: string | null
          concept_summary?: string | null
          content_id?: string
          created_at?: string
          created_by_member_id?: string
          id?: string
          internal_title?: string
          organization_id?: string
          origin_kind?: string
          previous_version_id?: string | null
          primary_message?: string | null
          primary_pillar_id?: string | null
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_item_versions_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_item_versions_campaign_fk"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_item_versions_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_item_versions_created_by_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_item_versions_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_item_versions_pillar_fk"
            columns: ["organization_id", "primary_pillar_id"]
            isOneToOne: false
            referencedRelation: "social_content_pillars"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_item_versions_previous_fk"
            columns: ["organization_id", "previous_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_item_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_content_items: {
        Row: {
          archived_at: string | null
          brand_id: string
          campaign_id: string | null
          concept_summary: string | null
          created_at: string
          created_by_member_id: string
          current_version_id: string | null
          id: string
          internal_title: string
          organization_id: string
          origin_kind: string
          primary_message: string | null
          primary_pillar_id: string | null
          source_content_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          campaign_id?: string | null
          concept_summary?: string | null
          created_at?: string
          created_by_member_id: string
          current_version_id?: string | null
          id?: string
          internal_title: string
          organization_id: string
          origin_kind?: string
          primary_message?: string | null
          primary_pillar_id?: string | null
          source_content_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          campaign_id?: string | null
          concept_summary?: string | null
          created_at?: string
          created_by_member_id?: string
          current_version_id?: string | null
          id?: string
          internal_title?: string
          organization_id?: string
          origin_kind?: string
          primary_message?: string | null
          primary_pillar_id?: string | null
          source_content_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_items_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_items_campaign_fk"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_items_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_items_current_version_fk"
            columns: ["organization_id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_item_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_items_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_items_pillar_fk"
            columns: ["organization_id", "primary_pillar_id"]
            isOneToOne: false
            referencedRelation: "social_content_pillars"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_items_source_content_fk"
            columns: ["organization_id", "source_content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_content_media: {
        Row: {
          asset_id: string
          asset_role: string
          content_id: string
          created_at: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          asset_id: string
          asset_role?: string
          content_id: string
          created_at?: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          asset_id?: string
          asset_role?: string
          content_id?: string
          created_at?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_content_media_asset_fk"
            columns: ["organization_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "social_media_assets"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_media_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_content_pillars: {
        Row: {
          archived_at: string | null
          brand_id: string
          created_at: string
          created_by_member_id: string
          description: string | null
          display_name: string
          id: string
          organization_id: string
          sort_order: number
          source_kind: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          created_at?: string
          created_by_member_id: string
          description?: string | null
          display_name: string
          id?: string
          organization_id: string
          sort_order?: number
          source_kind?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          created_at?: string
          created_by_member_id?: string
          description?: string | null
          display_name?: string
          id?: string
          organization_id?: string
          sort_order?: number
          source_kind?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_pillars_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_pillars_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_pillars_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_content_schedule_slots: {
        Row: {
          brand_id: string
          cancelled_at: string | null
          content_id: string
          created_at: string
          created_by_member_id: string
          id: string
          organization_id: string
          planned_at: string
          planning_timezone: string
          status: string
          updated_at: string
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Insert: {
          brand_id: string
          cancelled_at?: string | null
          content_id: string
          created_at?: string
          created_by_member_id: string
          id?: string
          organization_id: string
          planned_at: string
          planning_timezone: string
          status?: string
          updated_at?: string
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Update: {
          brand_id?: string
          cancelled_at?: string | null
          content_id?: string
          created_at?: string
          created_by_member_id?: string
          id?: string
          organization_id?: string
          planned_at?: string
          planning_timezone?: string
          status?: string
          updated_at?: string
          variant_id?: string
          variant_version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_schedule_slots_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_schedule_slots_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_schedule_slots_created_by_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_schedule_slots_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_schedule_slots_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_schedule_slots_version_fk"
            columns: ["organization_id", "variant_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_content_variant_versions: {
        Row: {
          alt_text: string | null
          brand_id: string
          caption: string | null
          change_note: string | null
          content_format: string
          content_id: string
          created_at: string
          created_by_member_id: string
          cta_text: string | null
          description: string | null
          hashtags: string | null
          id: string
          media_snapshot: Json
          organization_id: string
          planned_provider: string
          previous_version_id: string | null
          provider_config: Json
          title: string | null
          variant_id: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          alt_text?: string | null
          brand_id: string
          caption?: string | null
          change_note?: string | null
          content_format: string
          content_id: string
          created_at?: string
          created_by_member_id: string
          cta_text?: string | null
          description?: string | null
          hashtags?: string | null
          id?: string
          media_snapshot?: Json
          organization_id: string
          planned_provider: string
          previous_version_id?: string | null
          provider_config?: Json
          title?: string | null
          variant_id: string
          version_number: number
          workspace_id: string
        }
        Update: {
          alt_text?: string | null
          brand_id?: string
          caption?: string | null
          change_note?: string | null
          content_format?: string
          content_id?: string
          created_at?: string
          created_by_member_id?: string
          cta_text?: string | null
          description?: string | null
          hashtags?: string | null
          id?: string
          media_snapshot?: Json
          organization_id?: string
          planned_provider?: string
          previous_version_id?: string | null
          provider_config?: Json
          title?: string | null
          variant_id?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_variant_versions_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_variant_versions_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_variant_versions_created_by_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_variant_versions_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_content_variant_versions_previous_fk"
            columns: ["organization_id", "previous_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_variant_versions_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_content_variants: {
        Row: {
          alt_text: string | null
          archived_at: string | null
          brand_id: string
          caption: string | null
          content_format: string
          content_id: string
          created_at: string
          created_by_member_id: string
          cta_text: string | null
          current_version_id: string | null
          description: string | null
          hashtags: string | null
          id: string
          organization_id: string
          planned_provider: string
          provider_config: Json
          status: string
          title: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alt_text?: string | null
          archived_at?: string | null
          brand_id: string
          caption?: string | null
          content_format: string
          content_id: string
          created_at?: string
          created_by_member_id: string
          cta_text?: string | null
          current_version_id?: string | null
          description?: string | null
          hashtags?: string | null
          id?: string
          organization_id: string
          planned_provider: string
          provider_config?: Json
          status?: string
          title?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alt_text?: string | null
          archived_at?: string | null
          brand_id?: string
          caption?: string | null
          content_format?: string
          content_id?: string
          created_at?: string
          created_by_member_id?: string
          cta_text?: string | null
          current_version_id?: string | null
          description?: string | null
          hashtags?: string | null
          id?: string
          organization_id?: string
          planned_provider?: string
          provider_config?: Json
          status?: string
          title?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_content_variants_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_content_variants_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_variants_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_variants_current_version_fk"
            columns: ["organization_id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_content_variants_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_controlled_publish_window_events: {
        Row: {
          actor_source: string
          actor_user_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          organization_id: string
          publication_id: string | null
          requested_publication_id: string | null
          window_id: string
        }
        Insert: {
          actor_source: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          organization_id: string
          publication_id?: string | null
          requested_publication_id?: string | null
          window_id: string
        }
        Update: {
          actor_source?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          organization_id?: string
          publication_id?: string | null
          requested_publication_id?: string | null
          window_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_controlled_publish_window_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_controlled_publish_window_events_window_id_fkey"
            columns: ["window_id"]
            isOneToOne: false
            referencedRelation: "social_controlled_publish_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      social_controlled_publish_windows: {
        Row: {
          authorized_at: string
          closed_at: string | null
          closed_by_actor_user_id: string | null
          connection_id: string | null
          consumed_at: string | null
          consumed_execute_count: number
          created_at: string
          created_by_actor_user_id: string | null
          expired_at: string | null
          expires_at: string | null
          id: string
          max_execute_count: number
          organization_id: string
          publication_id: string
          reason: string | null
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          authorized_at?: string
          closed_at?: string | null
          closed_by_actor_user_id?: string | null
          connection_id?: string | null
          consumed_at?: string | null
          consumed_execute_count?: number
          created_at?: string
          created_by_actor_user_id?: string | null
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          max_execute_count?: number
          organization_id: string
          publication_id: string
          reason?: string | null
          status: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          authorized_at?: string
          closed_at?: string | null
          closed_by_actor_user_id?: string | null
          connection_id?: string | null
          consumed_at?: string | null
          consumed_execute_count?: number
          created_at?: string
          created_by_actor_user_id?: string | null
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          max_execute_count?: number
          organization_id?: string
          publication_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_controlled_publish_windows_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "social_account_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_controlled_publish_windows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_controlled_publish_windows_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "social_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_controlled_publish_windows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_goals: {
        Row: {
          archived_at: string | null
          brand_id: string
          created_at: string
          created_by_member_id: string
          description: string | null
          display_name: string
          goal_kind: string
          id: string
          organization_id: string
          priority: number
          source_kind: string
          success_criteria: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          created_at?: string
          created_by_member_id: string
          description?: string | null
          display_name: string
          goal_kind: string
          id?: string
          organization_id: string
          priority?: number
          source_kind?: string
          success_criteria?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          created_at?: string
          created_by_member_id?: string
          description?: string | null
          display_name?: string
          goal_kind?: string
          id?: string
          organization_id?: string
          priority?: number
          source_kind?: string
          success_criteria?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_goals_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_goals_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_goals_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_assets: {
        Row: {
          alt_text: string | null
          archived_at: string | null
          brand_id: string
          byte_size: number
          checksum_sha256: string | null
          created_at: string
          created_by_member_id: string
          derivation_kind: string | null
          duration_ms: number | null
          height_px: number | null
          id: string
          media_category: string
          mime_type: string
          organization_id: string
          origin_kind: string
          parent_asset_id: string | null
          processing_state: string
          storage_object_key: string
          updated_at: string
          width_px: number | null
          workspace_id: string
        }
        Insert: {
          alt_text?: string | null
          archived_at?: string | null
          brand_id: string
          byte_size?: number
          checksum_sha256?: string | null
          created_at?: string
          created_by_member_id: string
          derivation_kind?: string | null
          duration_ms?: number | null
          height_px?: number | null
          id?: string
          media_category: string
          mime_type: string
          organization_id: string
          origin_kind?: string
          parent_asset_id?: string | null
          processing_state?: string
          storage_object_key: string
          updated_at?: string
          width_px?: number | null
          workspace_id: string
        }
        Update: {
          alt_text?: string | null
          archived_at?: string | null
          brand_id?: string
          byte_size?: number
          checksum_sha256?: string | null
          created_at?: string
          created_by_member_id?: string
          derivation_kind?: string | null
          duration_ms?: number | null
          height_px?: number | null
          id?: string
          media_category?: string
          mime_type?: string
          organization_id?: string
          origin_kind?: string
          parent_asset_id?: string | null
          processing_state?: string
          storage_object_key?: string
          updated_at?: string
          width_px?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_assets_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_media_assets_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_media_assets_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_assets_parent_fk"
            columns: ["organization_id", "parent_asset_id"]
            isOneToOne: false
            referencedRelation: "social_media_assets"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_platform_strategies: {
        Row: {
          archived_at: string | null
          brand_id: string
          content_style: string | null
          created_at: string
          created_by_member_id: string
          id: string
          intended_frequency: string | null
          objective: string | null
          organization_id: string
          planned_provider: string
          source_kind: string
          strategic_role: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          content_style?: string | null
          created_at?: string
          created_by_member_id: string
          id?: string
          intended_frequency?: string | null
          objective?: string | null
          organization_id: string
          planned_provider: string
          source_kind?: string
          strategic_role?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          content_style?: string | null
          created_at?: string
          created_by_member_id?: string
          id?: string
          intended_frequency?: string | null
          objective?: string | null
          organization_id?: string
          planned_provider?: string
          source_kind?: string
          strategic_role?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_platform_strategies_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_platform_strategies_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_platform_strategies_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_publication_attempts: {
        Row: {
          attempt_number: number
          claim_generation: number
          external_container_id_present: boolean | null
          failure_class: string | null
          finished_at: string | null
          id: string
          operation_id: string
          organization_id: string
          outcome: string
          provider_error_code: number | null
          provider_error_subcode: number | null
          provider_error_type: string | null
          provider_http_status: number | null
          provider_request_dispatched: boolean | null
          provider_response_received: boolean | null
          provider_step: string | null
          publication_id: string
          retryable: boolean | null
          safe_error_code: string | null
          safe_provider_message: string | null
          started_at: string
          worker_id: string | null
        }
        Insert: {
          attempt_number: number
          claim_generation: number
          external_container_id_present?: boolean | null
          failure_class?: string | null
          finished_at?: string | null
          id?: string
          operation_id: string
          organization_id: string
          outcome?: string
          provider_error_code?: number | null
          provider_error_subcode?: number | null
          provider_error_type?: string | null
          provider_http_status?: number | null
          provider_request_dispatched?: boolean | null
          provider_response_received?: boolean | null
          provider_step?: string | null
          publication_id: string
          retryable?: boolean | null
          safe_error_code?: string | null
          safe_provider_message?: string | null
          started_at?: string
          worker_id?: string | null
        }
        Update: {
          attempt_number?: number
          claim_generation?: number
          external_container_id_present?: boolean | null
          failure_class?: string | null
          finished_at?: string | null
          id?: string
          operation_id?: string
          organization_id?: string
          outcome?: string
          provider_error_code?: number | null
          provider_error_subcode?: number | null
          provider_error_type?: string | null
          provider_http_status?: number | null
          provider_request_dispatched?: boolean | null
          provider_response_received?: boolean | null
          provider_step?: string | null
          publication_id?: string
          retryable?: boolean | null
          safe_error_code?: string | null
          safe_provider_message?: string | null
          started_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_publication_attempts_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_publication_attempts_publication_fk"
            columns: ["organization_id", "publication_id"]
            isOneToOne: false
            referencedRelation: "social_publications"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_publication_events: {
        Row: {
          actor_member_id: string | null
          actor_source: string
          attempt_id: string | null
          brand_id: string
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          publication_id: string
          workspace_id: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_source: string
          attempt_id?: string | null
          brand_id: string
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          publication_id: string
          workspace_id: string
        }
        Update: {
          actor_member_id?: string | null
          actor_source?: string
          attempt_id?: string | null
          brand_id?: string
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          publication_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_publication_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publication_events_attempt_fk"
            columns: ["organization_id", "attempt_id"]
            isOneToOne: false
            referencedRelation: "social_publication_attempts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publication_events_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_publication_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_publication_events_publication_fk"
            columns: ["organization_id", "publication_id"]
            isOneToOne: false
            referencedRelation: "social_publications"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_publications: {
        Row: {
          attempt_count: number
          brand_id: string
          cancelled_at: string | null
          claim_generation: number
          claim_lease_expires_at: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          connection_id: string
          content_id: string
          created_at: string
          created_by_member_id: string | null
          execution_mode: string
          external_publication_id: string | null
          first_started_at: string | null
          id: string
          idempotency_key: string
          intended_execute_at: string
          last_failure_class: string | null
          max_attempts: number
          next_attempt_at: string | null
          organization_id: string
          provider: string
          queued_at: string | null
          schedule_slot_id: string | null
          status: string
          updated_at: string
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Insert: {
          attempt_count?: number
          brand_id: string
          cancelled_at?: string | null
          claim_generation?: number
          claim_lease_expires_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          connection_id: string
          content_id: string
          created_at?: string
          created_by_member_id?: string | null
          execution_mode: string
          external_publication_id?: string | null
          first_started_at?: string | null
          id?: string
          idempotency_key: string
          intended_execute_at: string
          last_failure_class?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          organization_id: string
          provider: string
          queued_at?: string | null
          schedule_slot_id?: string | null
          status?: string
          updated_at?: string
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Update: {
          attempt_count?: number
          brand_id?: string
          cancelled_at?: string | null
          claim_generation?: number
          claim_lease_expires_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          connection_id?: string
          content_id?: string
          created_at?: string
          created_by_member_id?: string | null
          execution_mode?: string
          external_publication_id?: string | null
          first_started_at?: string | null
          id?: string
          idempotency_key?: string
          intended_execute_at?: string
          last_failure_class?: string | null
          max_attempts?: number
          next_attempt_at?: string | null
          organization_id?: string
          provider?: string
          queued_at?: string | null
          schedule_slot_id?: string | null
          status?: string
          updated_at?: string
          variant_id?: string
          variant_version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_publications_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_publications_connection_fk"
            columns: ["organization_id", "connection_id"]
            isOneToOne: false
            referencedRelation: "social_account_connections"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publications_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publications_created_by_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publications_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_publications_schedule_slot_fk"
            columns: ["organization_id", "schedule_slot_id"]
            isOneToOne: false
            referencedRelation: "social_content_schedule_slots"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publications_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_publications_version_fk"
            columns: ["organization_id", "variant_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_review_comments: {
        Row: {
          body: string
          brand_id: string
          created_at: string
          created_by_member_id: string
          id: string
          organization_id: string
          review_request_id: string
          variant_version_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          brand_id: string
          created_at?: string
          created_by_member_id: string
          id?: string
          organization_id: string
          review_request_id: string
          variant_version_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          brand_id?: string
          created_at?: string
          created_by_member_id?: string
          id?: string
          organization_id?: string
          review_request_id?: string
          variant_version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_review_comments_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_review_comments_created_by_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_review_comments_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_review_comments_request_fk"
            columns: ["organization_id", "review_request_id"]
            isOneToOne: false
            referencedRelation: "social_review_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_review_comments_version_fk"
            columns: ["organization_id", "variant_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_review_requests: {
        Row: {
          approval_context: string
          brand_id: string
          closed_at: string | null
          content_id: string
          created_at: string
          due_at: string | null
          id: string
          organization_id: string
          requested_by_member_id: string
          status: string
          updated_at: string
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Insert: {
          approval_context?: string
          brand_id: string
          closed_at?: string | null
          content_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          organization_id: string
          requested_by_member_id: string
          status?: string
          updated_at?: string
          variant_id: string
          variant_version_id: string
          workspace_id: string
        }
        Update: {
          approval_context?: string
          brand_id?: string
          closed_at?: string | null
          content_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          organization_id?: string
          requested_by_member_id?: string
          status?: string
          updated_at?: string
          variant_id?: string
          variant_version_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_review_requests_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_review_requests_content_fk"
            columns: ["organization_id", "content_id"]
            isOneToOne: false
            referencedRelation: "social_content_items"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_review_requests_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_review_requests_requested_by_fk"
            columns: ["organization_id", "requested_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_review_requests_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_review_requests_version_fk"
            columns: ["organization_id", "variant_version_id"]
            isOneToOne: false
            referencedRelation: "social_content_variant_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_variant_media: {
        Row: {
          asset_id: string
          asset_role: string
          created_at: string
          organization_id: string
          sort_order: number
          variant_id: string
        }
        Insert: {
          asset_id: string
          asset_role?: string
          created_at?: string
          organization_id: string
          sort_order?: number
          variant_id: string
        }
        Update: {
          asset_id?: string
          asset_role?: string
          created_at?: string
          organization_id?: string
          sort_order?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_variant_media_asset_fk"
            columns: ["organization_id", "asset_id"]
            isOneToOne: false
            referencedRelation: "social_media_assets"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_variant_media_variant_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "social_content_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_workflow_events: {
        Row: {
          actor_member_id: string | null
          actor_source: string
          approval_decision_id: string | null
          brand_id: string
          content_id: string | null
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          review_request_id: string | null
          schedule_slot_id: string | null
          variant_id: string | null
          variant_version_id: string | null
          workspace_id: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_source: string
          approval_decision_id?: string | null
          brand_id: string
          content_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          review_request_id?: string | null
          schedule_slot_id?: string | null
          variant_id?: string | null
          variant_version_id?: string | null
          workspace_id: string
        }
        Update: {
          actor_member_id?: string | null
          actor_source?: string
          approval_decision_id?: string | null
          brand_id?: string
          content_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          review_request_id?: string | null
          schedule_slot_id?: string | null
          variant_id?: string | null
          variant_version_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_workflow_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_workflow_events_brand_workspace_fk"
            columns: ["organization_id", "brand_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "brand_id", "id"]
          },
          {
            foreignKeyName: "social_workflow_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_workspace_events: {
        Row: {
          actor_member_id: string | null
          actor_source: string
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          workspace_id: string
        }
        Insert: {
          actor_member_id?: string | null
          actor_source: string
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          workspace_id: string
        }
        Update: {
          actor_member_id?: string | null
          actor_source?: string
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_workspace_events_actor_member_fk"
            columns: ["organization_id", "actor_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_workspace_events_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_workspace_events_workspace_fk"
            columns: ["organization_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "social_workspaces"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      social_workspaces: {
        Row: {
          archived_at: string | null
          brand_id: string
          client_approval_required: boolean
          created_at: string
          created_by_member_id: string
          display_name: string
          id: string
          internal_approval_required: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          brand_id: string
          client_approval_required?: boolean
          created_at?: string
          created_by_member_id: string
          display_name: string
          id?: string
          internal_approval_required?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          brand_id?: string
          client_approval_required?: boolean
          created_at?: string
          created_by_member_id?: string
          display_name?: string
          id?: string
          internal_approval_required?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_workspaces_brand_fk"
            columns: ["organization_id", "brand_id"]
            isOneToOne: true
            referencedRelation: "social_brands"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_workspaces_created_by_member_fk"
            columns: ["organization_id", "created_by_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "social_workspaces_organization_fk"
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
      taxonomy_aliases: {
        Row: {
          alias_label: string
          alias_normalized: string | null
          created_at: string
          deep_specialization_id: string | null
          foundation_id: string | null
          id: string
          industry_id: string | null
          locale: string
          niche_id: string | null
          specialization_id: string | null
          updated_at: string
        }
        Insert: {
          alias_label: string
          alias_normalized?: string | null
          created_at?: string
          deep_specialization_id?: string | null
          foundation_id?: string | null
          id?: string
          industry_id?: string | null
          locale: string
          niche_id?: string | null
          specialization_id?: string | null
          updated_at?: string
        }
        Update: {
          alias_label?: string
          alias_normalized?: string | null
          created_at?: string
          deep_specialization_id?: string | null
          foundation_id?: string | null
          id?: string
          industry_id?: string | null
          locale?: string
          niche_id?: string | null
          specialization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_aliases_deep_specialization_fk"
            columns: ["deep_specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_deep_specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_aliases_foundation_fk"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_foundations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_aliases_industry_fk"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_aliases_niche_fk"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_aliases_specialization_fk"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_deep_specializations: {
        Row: {
          catalog_visibility: string
          created_at: string
          id: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          specialization_id: string
          superseded_by_id: string | null
          updated_at: string
        }
        Insert: {
          catalog_visibility: string
          created_at?: string
          id?: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          specialization_id: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Update: {
          catalog_visibility?: string
          created_at?: string
          id?: string
          introduced_in_release_id?: string
          key?: string
          label?: string
          lifecycle_status?: string
          specialization_id?: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_deep_specializations_introduced_release_fk"
            columns: ["introduced_in_release_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_deep_specializations_specialization_fk"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_deep_specializations_superseded_by_fk"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_deep_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_foundations: {
        Row: {
          catalog_visibility: string
          created_at: string
          id: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          superseded_by_id: string | null
          updated_at: string
        }
        Insert: {
          catalog_visibility: string
          created_at?: string
          id?: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Update: {
          catalog_visibility?: string
          created_at?: string
          id?: string
          introduced_in_release_id?: string
          key?: string
          label?: string
          lifecycle_status?: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_foundations_introduced_release_fk"
            columns: ["introduced_in_release_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_foundations_superseded_by_fk"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_foundations"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_industries: {
        Row: {
          catalog_visibility: string
          created_at: string
          foundation_id: string
          id: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          superseded_by_id: string | null
          updated_at: string
        }
        Insert: {
          catalog_visibility: string
          created_at?: string
          foundation_id: string
          id?: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Update: {
          catalog_visibility?: string
          created_at?: string
          foundation_id?: string
          id?: string
          introduced_in_release_id?: string
          key?: string
          label?: string
          lifecycle_status?: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_industries_foundation_fk"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_foundations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_industries_introduced_release_fk"
            columns: ["introduced_in_release_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_industries_superseded_by_fk"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_industries"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_niches: {
        Row: {
          catalog_visibility: string
          created_at: string
          id: string
          industry_id: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          superseded_by_id: string | null
          updated_at: string
        }
        Insert: {
          catalog_visibility: string
          created_at?: string
          id?: string
          industry_id: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Update: {
          catalog_visibility?: string
          created_at?: string
          id?: string
          industry_id?: string
          introduced_in_release_id?: string
          key?: string
          label?: string
          lifecycle_status?: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_niches_industry_fk"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_niches_introduced_release_fk"
            columns: ["introduced_in_release_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_niches_superseded_by_fk"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_releases: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          lifecycle_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          lifecycle_status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          lifecycle_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_specializations: {
        Row: {
          catalog_visibility: string
          created_at: string
          id: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          niche_id: string
          superseded_by_id: string | null
          updated_at: string
        }
        Insert: {
          catalog_visibility: string
          created_at?: string
          id?: string
          introduced_in_release_id: string
          key: string
          label: string
          lifecycle_status: string
          niche_id: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Update: {
          catalog_visibility?: string
          created_at?: string
          id?: string
          introduced_in_release_id?: string
          key?: string
          label?: string
          lifecycle_status?: string
          niche_id?: string
          superseded_by_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_specializations_introduced_release_fk"
            columns: ["introduced_in_release_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_specializations_niche_fk"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_niches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taxonomy_specializations_superseded_by_fk"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "taxonomy_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abandon_authorization_pending_social_connection: {
        Args: { p_connection_id: string }
        Returns: {
          connection_id: string
          result_code: string
        }[]
      }
      abandon_queued_social_publication: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          result_code: string
        }[]
      }
      abandon_stale_social_oauth_intent: {
        Args: { p_intent_id: string; p_organization_id: string }
        Returns: {
          intent_id: string
          result_code: string
        }[]
      }
      accept_organization_invitation: {
        Args: { p_raw_token: string }
        Returns: {
          invitation_id: string
          membership_id: string
          organization_id: string
          result_code: string
        }[]
      }
      acknowledge_attention_item: {
        Args: { p_attention_item_id: string; p_organization_id: string }
        Returns: undefined
      }
      add_social_review_comment: {
        Args: {
          p_body: string
          p_organization_id: string
          p_review_request_id: string
        }
        Returns: {
          comment_id: string
          result_code: string
        }[]
      }
      apply_organization_onboarding: {
        Args: {
          p_business_type?: string
          p_clear_team_size_band?: boolean
          p_display_name?: string
          p_mode: string
          p_organization_id: string
          p_organization_name?: string
          p_primary_audience?: string
          p_primary_goal?: string
          p_primary_offering?: string
          p_team_size_band?: string
        }
        Returns: Json
      }
      archive_attention_item: {
        Args: { p_attention_item_id: string; p_organization_id: string }
        Returns: undefined
      }
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
      archive_social_audience: {
        Args: { p_audience_id: string; p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_brand_rule: {
        Args: { p_organization_id: string; p_rule_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_campaign: {
        Args: { p_campaign_id: string; p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_content_item: {
        Args: { p_content_id: string; p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_content_pillar: {
        Args: { p_organization_id: string; p_pillar_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_content_variant: {
        Args: { p_organization_id: string; p_variant_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_goal: {
        Args: { p_goal_id: string; p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_media_asset: {
        Args: { p_asset_id: string; p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_platform_strategy: {
        Args: { p_organization_id: string; p_strategy_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_social_workspace: {
        Args: { p_organization_id: string; p_workspace_id: string }
        Returns: {
          result_code: string
        }[]
      }
      archive_task: {
        Args: { p_organization_id: string; p_task_id: string }
        Returns: undefined
      }
      assert_social_closed_beta_prepare_allowed: {
        Args: { p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      assert_social_closed_beta_publish_allowed: {
        Args: { p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      assign_attention_item: {
        Args: {
          p_assignee_member_id?: string
          p_attention_item_id: string
          p_organization_id: string
        }
        Returns: undefined
      }
      b18_complete_controlled_publication_attempt: {
        Args: {
          p_attempt_id: string
          p_claim_generation: number
          p_external_container_id_present?: boolean
          p_external_publication_id?: string
          p_failure_class?: string
          p_organization_id: string
          p_outcome: string
          p_provider_error_code?: number
          p_provider_error_subcode?: number
          p_provider_error_type?: string
          p_provider_http_status?: number
          p_provider_request_dispatched?: boolean
          p_provider_response_received?: boolean
          p_provider_step?: string
          p_safe_error_code?: string
          p_safe_provider_message?: string
          p_worker_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      b18_start_controlled_publication_attempt: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          attempt_id: string
          attempt_number: number
          claim_generation: number
          publication_id: string
          result_code: string
          worker_id: string
        }[]
      }
      cancel_missed_social_publication: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          publication_id: string
          result_code: string
          status: string
        }[]
      }
      cancel_scheduled_social_publication: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          publication_id: string
          result_code: string
          status: string
        }[]
      }
      cancel_social_content_schedule_slot: {
        Args: { p_organization_id: string; p_schedule_slot_id: string }
        Returns: {
          result_code: string
        }[]
      }
      cancel_social_publication: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          result_code: string
        }[]
      }
      cancel_social_review_request: {
        Args: { p_organization_id: string; p_review_request_id: string }
        Returns: {
          result_code: string
        }[]
      }
      cancel_task: {
        Args: {
          p_cancel_reason: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: undefined
      }
      complete_organization_invitation_delivery_attempt: {
        Args: {
          p_attempt_id: string
          p_failure_category?: string
          p_organization_id: string
          p_provider_message_id?: string
          p_status: string
        }
        Returns: {
          attempt_id: string
          outcome: string
          provider_message_id: string
          status: string
        }[]
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
      complete_task: {
        Args: {
          p_completion_note?: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: undefined
      }
      consume_social_oauth_intent: {
        Args: { p_intent_id: string; p_state_fingerprint: string }
        Returns: {
          connection_id: string
          expected_external_account_id: string
          intent_kind: string
          organization_id: string
          provider: string
          result_code: string
          return_path_id: string
          workspace_id: string
        }[]
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
      create_manual_attention_item: {
        Args: {
          p_enrollment_id: string
          p_evidence_note?: string
          p_explanation: string
          p_organization_id: string
          p_severity?: string
          p_summary?: string
          p_title: string
        }
        Returns: string
      }
      create_organization_invitation: {
        Args: {
          p_email: string
          p_organization_id: string
          p_target_role: string
        }
        Returns: {
          expires_at: string
          invitation_id: string
          raw_token: string
          result_code: string
        }[]
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
      create_social_audience: {
        Args: {
          p_brand_id: string
          p_description?: string
          p_desired_outcome?: string
          p_display_name: string
          p_needs?: string
          p_organization_id: string
          p_priority?: number
        }
        Returns: {
          audience_id: string
          result_code: string
        }[]
      }
      create_social_brand_rule: {
        Args: {
          p_body: string
          p_brand_id: string
          p_organization_id: string
          p_rule_kind: string
          p_sort_order?: number
          p_title: string
        }
        Returns: {
          result_code: string
          rule_id: string
        }[]
      }
      create_social_campaign: {
        Args: {
          p_brand_id: string
          p_description?: string
          p_display_name: string
          p_ends_at?: string
          p_goal_id?: string
          p_organization_id: string
          p_starts_at?: string
          p_status?: string
          p_success_criteria?: Json
        }
        Returns: {
          campaign_id: string
          result_code: string
        }[]
      }
      create_social_connection_intent: {
        Args: {
          p_expires_at: string
          p_organization_id: string
          p_provider: string
          p_return_path_id: string
          p_state_fingerprint: string
          p_workspace_id: string
        }
        Returns: {
          connection_id: string
          intent_id: string
          result_code: string
        }[]
      }
      create_social_content_item: {
        Args: {
          p_brand_id: string
          p_campaign_id?: string
          p_concept_summary?: string
          p_internal_title: string
          p_organization_id: string
          p_origin_kind?: string
          p_primary_message?: string
          p_primary_pillar_id?: string
          p_source_content_id?: string
          p_status?: string
        }
        Returns: {
          content_id: string
          result_code: string
        }[]
      }
      create_social_content_item_version: {
        Args: {
          p_change_note?: string
          p_content_id: string
          p_organization_id: string
        }
        Returns: {
          result_code: string
          version_id: string
          version_number: number
        }[]
      }
      create_social_content_pillar: {
        Args: {
          p_brand_id: string
          p_description?: string
          p_display_name: string
          p_organization_id: string
          p_sort_order?: number
        }
        Returns: {
          pillar_id: string
          result_code: string
        }[]
      }
      create_social_content_schedule_slot: {
        Args: {
          p_organization_id: string
          p_planned_at: string
          p_planning_timezone: string
          p_variant_version_id: string
        }
        Returns: {
          result_code: string
          schedule_slot_id: string
        }[]
      }
      create_social_content_variant: {
        Args: {
          p_alt_text?: string
          p_caption?: string
          p_content_format: string
          p_content_id: string
          p_cta_text?: string
          p_description?: string
          p_hashtags?: string
          p_organization_id: string
          p_planned_provider: string
          p_provider_config?: Json
          p_status?: string
          p_title?: string
        }
        Returns: {
          result_code: string
          variant_id: string
        }[]
      }
      create_social_content_variant_version: {
        Args: {
          p_change_note?: string
          p_organization_id: string
          p_variant_id: string
        }
        Returns: {
          result_code: string
          version_id: string
          version_number: number
        }[]
      }
      create_social_goal: {
        Args: {
          p_brand_id: string
          p_description?: string
          p_display_name: string
          p_goal_kind: string
          p_organization_id: string
          p_priority?: number
          p_success_criteria?: Json
        }
        Returns: {
          goal_id: string
          result_code: string
        }[]
      }
      create_social_publication: {
        Args: {
          p_connection_id: string
          p_execution_mode: string
          p_idempotency_key?: string
          p_intended_execute_at?: string
          p_organization_id: string
          p_schedule_slot_id?: string
          p_variant_version_id: string
        }
        Returns: {
          publication_id: string
          result_code: string
        }[]
      }
      create_social_reauthorization_intent: {
        Args: {
          p_connection_id: string
          p_expires_at: string
          p_return_path_id: string
          p_state_fingerprint: string
        }
        Returns: {
          connection_id: string
          expected_external_account_id: string
          intent_id: string
          result_code: string
        }[]
      }
      create_social_review_request: {
        Args: {
          p_approval_context?: string
          p_due_at?: string
          p_organization_id: string
          p_variant_version_id: string
        }
        Returns: {
          result_code: string
          review_request_id: string
        }[]
      }
      create_social_workspace: {
        Args: {
          p_customer_id?: string
          p_display_name: string
          p_organization_id: string
        }
        Returns: {
          brand_id: string
          result_code: string
          workspace_id: string
        }[]
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
      disconnect_social_connection: {
        Args: { p_connection_id: string }
        Returns: {
          connection_id: string
          result_code: string
        }[]
      }
      dismiss_attention_item: {
        Args: {
          p_attention_item_id: string
          p_dismissal_reason: string
          p_organization_id: string
        }
        Returns: undefined
      }
      ensure_default_pipeline_stages: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      evaluate_attention_rules: {
        Args: { p_enrollment_id?: string; p_organization_id: string }
        Returns: Json
      }
      evaluate_social_provider_write_gates: {
        Args: { p_organization_id: string }
        Returns: {
          result_code: string
        }[]
      }
      evaluate_social_variant_version_workflow_readiness: {
        Args: { p_organization_id: string; p_variant_version_id: string }
        Returns: {
          client_approval_required: boolean
          has_active_schedule: boolean
          has_client_approval: boolean
          has_internal_approval: boolean
          internal_approval_required: boolean
          is_overdue_review: boolean
          media_assets_available: boolean
          result_code: string
          workflow_ready: boolean
        }[]
      }
      finalize_social_connection: {
        Args: {
          p_capabilities: Json
          p_connection_id: string
          p_display_name: string
          p_external_account_id: string
          p_professional_account_type: string
        }
        Returns: {
          connection_id: string
          result_code: string
        }[]
      }
      finalize_social_reauthorization: {
        Args: {
          p_capabilities: Json
          p_display_name: string
          p_external_account_id: string
          p_intent_id: string
          p_professional_account_type: string
        }
        Returns: {
          connection_id: string
          result_code: string
        }[]
      }
      get_active_social_controlled_publish_window: {
        Args: { p_organization_id: string }
        Returns: {
          authorized_at: string
          consumed_execute_count: number
          max_execute_count: number
          publication_id: string
          result_code: string
          status: string
          window_id: string
        }[]
      }
      get_social_closed_beta_enrollment_status: {
        Args: { p_organization_id: string }
        Returns: {
          enrollment_status: string
          result_code: string
          status_before_pause: string
        }[]
      }
      list_organization_member_labels: {
        Args: { p_membership_ids?: string[]; p_organization_id: string }
        Returns: {
          display_label: string
          membership_id: string
        }[]
      }
      load_social_provider_credential_envelope: {
        Args: { p_connection_id: string }
        Returns: {
          auth_tag: string
          ciphertext: string
          connection_id: string
          credential_id: string
          credential_version: number
          encryption_version: number
          iv: string
          key_purpose: string
          key_version: number
          organization_id: string
          provider: string
          result_code: string
        }[]
      }
      mark_social_connection_reauthorization_required: {
        Args: { p_connection_id: string }
        Returns: {
          connection_id: string
          result_code: string
        }[]
      }
      move_social_content_schedule_slot: {
        Args: {
          p_organization_id: string
          p_planned_at: string
          p_planning_timezone?: string
          p_schedule_slot_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      operator_allow_social_closed_beta_publishing: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      operator_close_social_controlled_publish_window: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
          p_window_id: string
        }
        Returns: {
          result_code: string
          window_id: string
        }[]
      }
      operator_close_social_controlled_publish_window_for_session: {
        Args: {
          p_organization_id: string
          p_reason?: string
          p_window_id: string
        }
        Returns: {
          result_code: string
          window_id: string
        }[]
      }
      operator_enroll_social_closed_beta_organization: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      operator_get_social_closed_beta_organization: {
        Args: { p_organization_id: string }
        Returns: {
          active_publication_count: number
          approved_at: string
          credential_present_count: number
          enrollment_created_at: string
          enrollment_reason: string
          enrollment_status: string
          enrollment_updated_at: string
          has_owner_or_admin: boolean
          has_social_workspace: boolean
          healthy_instagram_connection_count: number
          instagram_connection_count: number
          organization_id: string
          organization_name: string
          organization_status: string
          paused_at: string
          publish_image_capability_count: number
          publishing_allowed_at: string
          queued_publication_count: number
          reauthorization_required_count: number
          result_code: string
          revoked_at: string
          status_before_pause: string
          succeeded_publication_count: number
        }[]
      }
      operator_list_social_closed_beta_enrollment_events: {
        Args: { p_organization_id: string }
        Returns: {
          actor_source: string
          actor_user_id: string
          created_at: string
          event_id: string
          event_type: string
          next_status: string
          previous_status: string
          reason: string
          result_code: string
        }[]
      }
      operator_list_social_closed_beta_organizations: {
        Args: never
        Returns: {
          active_publication_count: number
          credential_present_count: number
          enrollment_status: string
          enrollment_updated_at: string
          has_owner_or_admin: boolean
          has_social_workspace: boolean
          healthy_instagram_connection_count: number
          instagram_connection_count: number
          last_social_activity_at: string
          organization_id: string
          organization_name: string
          organization_status: string
          publish_image_capability_count: number
          queued_publication_count: number
        }[]
      }
      operator_open_social_controlled_publish_window: {
        Args: {
          p_actor_user_id?: string
          p_max_execute_count?: number
          p_organization_id: string
          p_publication_id: string
          p_reason?: string
        }
        Returns: {
          max_execute_count: number
          publication_id: string
          result_code: string
          window_id: string
        }[]
      }
      operator_open_social_controlled_publish_window_for_session: {
        Args: {
          p_max_execute_count?: number
          p_organization_id: string
          p_publication_id: string
          p_reason?: string
        }
        Returns: {
          max_execute_count: number
          publication_id: string
          result_code: string
          window_id: string
        }[]
      }
      operator_pause_social_closed_beta_enrollment: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      operator_resume_social_closed_beta_enrollment: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      operator_revoke_social_closed_beta_enrollment: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      operator_set_social_controlled_publish_window_expiry: {
        Args: {
          p_actor_user_id?: string
          p_expires_at: string
          p_organization_id: string
          p_window_id: string
        }
        Returns: {
          expires_at: string
          result_code: string
          window_id: string
        }[]
      }
      platform_allow_social_closed_beta_publishing: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      platform_enroll_social_closed_beta_organization: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      platform_pause_social_closed_beta_enrollment: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      platform_resume_social_closed_beta_enrollment: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      platform_revoke_social_closed_beta_enrollment: {
        Args: {
          p_actor_user_id?: string
          p_organization_id: string
          p_reason?: string
        }
        Returns: {
          enrollment_id: string
          next_status: string
          previous_status: string
          result_code: string
        }[]
      }
      reassign_task: {
        Args: {
          p_assignee_member_id?: string
          p_organization_id: string
          p_task_id: string
        }
        Returns: undefined
      }
      reclaim_stale_social_publication_execution: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          next_status: string
          result_code: string
        }[]
      }
      record_attention_signal: {
        Args: {
          p_attention_item_id: string
          p_detected_at?: string
          p_evidence?: Json
          p_explanation: string
          p_organization_id: string
        }
        Returns: string
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
      register_social_media_asset: {
        Args: {
          p_alt_text?: string
          p_brand_id: string
          p_byte_size?: number
          p_checksum_sha256?: string
          p_derivation_kind?: string
          p_duration_ms?: number
          p_height_px?: number
          p_media_category: string
          p_mime_type: string
          p_organization_id: string
          p_origin_kind?: string
          p_parent_asset_id?: string
          p_processing_state?: string
          p_storage_object_key: string
          p_width_px?: number
        }
        Returns: {
          asset_id: string
          result_code: string
        }[]
      }
      reorder_pipeline_stages: {
        Args: { p_organization_id: string; p_stage_ids: string[] }
        Returns: undefined
      }
      request_social_publication_retry: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          result_code: string
        }[]
      }
      reschedule_missed_social_publication: {
        Args: {
          p_intended_execute_at: string
          p_organization_id: string
          p_publication_id: string
        }
        Returns: {
          connection_id: string
          execution_mode: string
          intended_execute_at: string
          next_attempt_at: string
          publication_id: string
          result_code: string
          variant_version_id: string
        }[]
      }
      reschedule_social_publication: {
        Args: {
          p_intended_execute_at: string
          p_organization_id: string
          p_publication_id: string
        }
        Returns: {
          connection_id: string
          execution_mode: string
          intended_execute_at: string
          next_attempt_at: string
          publication_id: string
          result_code: string
          variant_version_id: string
        }[]
      }
      reschedule_task: {
        Args: { p_due_at: string; p_organization_id: string; p_task_id: string }
        Returns: undefined
      }
      resend_organization_invitation: {
        Args: { p_invitation_id: string; p_organization_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          raw_token: string
          result_code: string
        }[]
      }
      resolve_attention_item: {
        Args: {
          p_attention_item_id: string
          p_organization_id: string
          p_resolution_reason: string
        }
        Returns: undefined
      }
      resolve_organization_invitation_delivery_attempt: {
        Args: {
          p_generation_key: string
          p_idempotency_key: string
          p_invitation_id: string
          p_operation: string
          p_organization_id: string
        }
        Returns: {
          attempt_id: string
          outcome: string
          provider_message_id: string
          status: string
        }[]
      }
      resolve_unknown_external_social_publication: {
        Args: {
          p_organization_id: string
          p_publication_id: string
          p_resolution: string
        }
        Returns: {
          next_status: string
          result_code: string
        }[]
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
      revoke_organization_invitation: {
        Args: { p_invitation_id: string; p_organization_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          raw_token: string
          result_code: string
        }[]
      }
      schedule_social_publication: {
        Args: {
          p_intended_execute_at: string
          p_organization_id: string
          p_publication_id: string
        }
        Returns: {
          connection_id: string
          execution_mode: string
          intended_execute_at: string
          next_attempt_at: string
          publication_id: string
          result_code: string
          variant_version_id: string
        }[]
      }
      scheduler_complete_scheduled_publication_attempt: {
        Args: {
          p_attempt_id: string
          p_claim_generation: number
          p_external_container_id_present?: boolean
          p_external_publication_id?: string
          p_failure_class?: string
          p_organization_id: string
          p_outcome: string
          p_provider_error_code?: number
          p_provider_error_subcode?: number
          p_provider_error_type?: string
          p_provider_http_status?: number
          p_provider_request_dispatched?: boolean
          p_provider_response_received?: boolean
          p_provider_step?: string
          p_safe_error_code?: string
          p_safe_provider_message?: string
          p_worker_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      scheduler_list_due_scheduled_social_publications: {
        Args: { p_limit?: number }
        Returns: {
          due_at: string
          execution_mode: string
          intended_execute_at: string
          next_attempt_at: string
          organization_id: string
          publication_id: string
          result_code: string
          seconds_late: number
          status: string
        }[]
      }
      scheduler_load_social_provider_credential_envelope: {
        Args: { p_connection_id: string }
        Returns: {
          auth_tag: string
          ciphertext: string
          connection_id: string
          credential_id: string
          credential_version: number
          encryption_version: number
          iv: string
          key_purpose: string
          key_version: number
          organization_id: string
          provider: string
          result_code: string
        }[]
      }
      scheduler_load_social_publication_execution_context: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          alt_text: string
          attempt_id: string
          capability_snapshot: Json
          caption: string
          claim_generation: number
          connection_health: string
          connection_id: string
          connection_status: string
          content_format: string
          external_account_id: string
          media_snapshot: Json
          operation_id: string
          organization_id: string
          provider: string
          publication_id: string
          publication_status: string
          reauthorization_required_at: string
          result_code: string
          variant_version_id: string
          worker_id: string
          workspace_id: string
        }[]
      }
      scheduler_mark_scheduled_publication_missed: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          attention_created: boolean
          attention_item_id: string
          publication_id: string
          result_code: string
        }[]
      }
      scheduler_start_scheduled_publication_attempt: {
        Args: { p_organization_id: string; p_publication_id: string }
        Returns: {
          attempt_id: string
          attempt_number: number
          claim_generation: number
          publication_id: string
          result_code: string
          worker_id: string
        }[]
      }
      scheduler_upsert_social_intervention_attention: {
        Args: {
          p_hint_code: string
          p_organization_id: string
          p_publication_id: string
        }
        Returns: {
          attention_item_id: string
          created: boolean
          result_code: string
          rule_key: string
        }[]
      }
      set_default_pipeline_stage: {
        Args: { p_organization_id: string; p_stage_id: string }
        Returns: undefined
      }
      set_social_campaign_assignments: {
        Args: {
          p_audience_ids?: string[]
          p_campaign_id: string
          p_organization_id: string
          p_pillar_ids?: string[]
          p_planned_providers?: string[]
        }
        Returns: {
          result_code: string
        }[]
      }
      set_social_content_media_attachments: {
        Args: {
          p_attachments: Json
          p_content_id: string
          p_organization_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      set_social_variant_media_attachments: {
        Args: {
          p_attachments: Json
          p_organization_id: string
          p_variant_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      submit_social_approval_decision: {
        Args: {
          p_decision: string
          p_organization_id: string
          p_reason?: string
          p_review_request_id?: string
          p_variant_version_id: string
        }
        Returns: {
          decision_id: string
          result_code: string
        }[]
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
      update_attention_severity: {
        Args: {
          p_attention_item_id: string
          p_organization_id: string
          p_severity: string
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
      update_social_campaign: {
        Args: {
          p_campaign_id: string
          p_description?: string
          p_display_name: string
          p_ends_at?: string
          p_goal_id?: string
          p_organization_id: string
          p_starts_at?: string
          p_status?: string
          p_success_criteria?: Json
        }
        Returns: {
          result_code: string
        }[]
      }
      update_social_content_item: {
        Args: {
          p_campaign_id?: string
          p_concept_summary?: string
          p_content_id: string
          p_internal_title: string
          p_organization_id: string
          p_primary_message?: string
          p_primary_pillar_id?: string
          p_status?: string
        }
        Returns: {
          result_code: string
        }[]
      }
      update_social_content_variant: {
        Args: {
          p_alt_text?: string
          p_caption?: string
          p_content_format?: string
          p_cta_text?: string
          p_description?: string
          p_hashtags?: string
          p_organization_id: string
          p_provider_config?: Json
          p_status?: string
          p_title?: string
          p_variant_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      update_social_workspace: {
        Args: {
          p_display_name: string
          p_organization_id: string
          p_workspace_id: string
        }
        Returns: {
          result_code: string
        }[]
      }
      update_social_workspace_approval_policy: {
        Args: {
          p_client_approval_required: boolean
          p_internal_approval_required: boolean
          p_organization_id: string
          p_workspace_id: string
        }
        Returns: {
          result_code: string
        }[]
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
      upsert_registration_intent: {
        Args: { p_company_name: string; p_display_name: string }
        Returns: undefined
      }
      upsert_social_brand_profile: {
        Args: {
          p_brand_id: string
          p_organization_id: string
          p_positioning: string
          p_primary_language: string
          p_source_kind?: string
          p_summary: string
          p_voice_config: Json
          p_website_url: string
        }
        Returns: {
          result_code: string
        }[]
      }
      upsert_social_platform_strategy: {
        Args: {
          p_brand_id: string
          p_content_style?: string
          p_intended_frequency?: string
          p_objective?: string
          p_organization_id: string
          p_planned_provider: string
          p_strategic_role?: string
        }
        Returns: {
          result_code: string
          strategy_id: string
        }[]
      }
      upsert_social_provider_credential: {
        Args: {
          p_auth_tag: string
          p_ciphertext: string
          p_connection_id: string
          p_credential_id: string
          p_encryption_version: number
          p_expected_credential_version: number
          p_iv: string
          p_key_purpose: string
          p_key_version: number
          p_token_expires_at: string
        }
        Returns: {
          credential_id: string
          credential_version: number
          result_code: string
        }[]
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
