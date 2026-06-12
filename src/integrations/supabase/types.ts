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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academy_certificates: {
        Row: {
          awarded_at: string
          id: string
          learner_name: string
          level_id: string
          level_title: string
          score: number
          user_id: string
          verification_code: string
        }
        Insert: {
          awarded_at?: string
          id?: string
          learner_name: string
          level_id: string
          level_title: string
          score?: number
          user_id: string
          verification_code?: string
        }
        Update: {
          awarded_at?: string
          id?: string
          learner_name?: string
          level_id?: string
          level_title?: string
          score?: number
          user_id?: string
          verification_code?: string
        }
        Relationships: []
      }
      academy_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          lesson_id: string | null
          level_id: string | null
          message: string
          rating: number | null
          route: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type?: string
          id?: string
          lesson_id?: string | null
          level_id?: string | null
          message: string
          rating?: number | null
          route?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          lesson_id?: string | null
          level_id?: string | null
          message?: string
          rating?: number | null
          route?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          level_id: string
          score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          level_id: string
          score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          level_id?: string
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_consent_log: {
        Row: {
          acknowledged_at: string
          consent_given: boolean
          consent_version: string
          created_at: string
          id: string
          ip_context: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          consent_given?: boolean
          consent_version?: string
          created_at?: string
          id?: string
          ip_context?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          consent_given?: boolean
          consent_version?: string
          created_at?: string
          id?: string
          ip_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_literacy_surveys: {
        Row: {
          created_at: string
          id: string
          project_id: string
          responses: Json
          session_number: number
          survey_phase: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          responses?: Json
          session_number: number
          survey_phase: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          responses?: Json
          session_number?: number
          survey_phase?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_literacy_surveys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          ai_generated: boolean | null
          artifact_type: Database["public"]["Enums"]["artifact_type"]
          content: Json
          created_at: string
          id: string
          project_id: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          artifact_type: Database["public"]["Enums"]["artifact_type"]
          content: Json
          created_at?: string
          id?: string
          project_id: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          artifact_type?: Database["public"]["Enums"]["artifact_type"]
          content?: Json
          created_at?: string
          id?: string
          project_id?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_error_logs: {
        Row: {
          action: string | null
          component_stack: string | null
          created_at: string
          error_message: string
          error_name: string | null
          id: string
          metadata: Json | null
          route: string | null
          stack_trace: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          viewport: string | null
        }
        Insert: {
          action?: string | null
          component_stack?: string | null
          created_at?: string
          error_message: string
          error_name?: string | null
          id?: string
          metadata?: Json | null
          route?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          viewport?: string | null
        }
        Update: {
          action?: string | null
          component_stack?: string | null
          created_at?: string
          error_message?: string
          error_name?: string | null
          id?: string
          metadata?: Json | null
          route?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          viewport?: string | null
        }
        Relationships: []
      }
      contribution_thresholds: {
        Row: {
          created_at: string
          id: string
          is_eligible_for_payout: boolean | null
          last_quality_review_at: string | null
          min_contributions_for_payout: number
          organization_id: string | null
          quality_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_eligible_for_payout?: boolean | null
          last_quality_review_at?: string | null
          min_contributions_for_payout?: number
          organization_id?: string | null
          quality_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_eligible_for_payout?: boolean | null
          last_quality_review_at?: string | null
          min_contributions_for_payout?: number
          organization_id?: string | null
          quality_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_thresholds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_purchases: {
        Row: {
          bundle_type: string | null
          buyer_email: string
          buyer_name: string | null
          community_share: number
          created_at: string
          id: string
          is_annual_license: boolean | null
          license_expires_at: string | null
          platform_share: number
          price_per_record: number
          pricing_tier: string | null
          purchased_at: string | null
          record_count: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount: number
          verified_via_webhook: boolean | null
          webhook_verified_at: string | null
        }
        Insert: {
          bundle_type?: string | null
          buyer_email: string
          buyer_name?: string | null
          community_share: number
          created_at?: string
          id?: string
          is_annual_license?: boolean | null
          license_expires_at?: string | null
          platform_share: number
          price_per_record?: number
          pricing_tier?: string | null
          purchased_at?: string | null
          record_count: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          verified_via_webhook?: boolean | null
          webhook_verified_at?: string | null
        }
        Update: {
          bundle_type?: string | null
          buyer_email?: string
          buyer_name?: string | null
          community_share?: number
          created_at?: string
          id?: string
          is_annual_license?: boolean | null
          license_expires_at?: string | null
          platform_share?: number
          price_per_record?: number
          pricing_tier?: string | null
          purchased_at?: string | null
          record_count?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          verified_via_webhook?: boolean | null
          webhook_verified_at?: string | null
        }
        Relationships: []
      }
      interrogations: {
        Row: {
          affected_groups: string[]
          anonymized: boolean | null
          challenge_tags: Database["public"]["Enums"]["harm_type"][]
          consent: boolean | null
          context_artifacts: Json | null
          created_at: string
          evidence_refs: string[] | null
          human_feedback: Json | null
          id: string
          mode: Database["public"]["Enums"]["interrogation_mode"]
          model_output: string
          model_rationale: string | null
          model_revision: string | null
          project_id: string
          redress_notes: string | null
          session_id: string
          user_prompt: string
          verdict: Database["public"]["Enums"]["verdict_type"] | null
        }
        Insert: {
          affected_groups: string[]
          anonymized?: boolean | null
          challenge_tags: Database["public"]["Enums"]["harm_type"][]
          consent?: boolean | null
          context_artifacts?: Json | null
          created_at?: string
          evidence_refs?: string[] | null
          human_feedback?: Json | null
          id?: string
          mode: Database["public"]["Enums"]["interrogation_mode"]
          model_output: string
          model_rationale?: string | null
          model_revision?: string | null
          project_id: string
          redress_notes?: string | null
          session_id: string
          user_prompt: string
          verdict?: Database["public"]["Enums"]["verdict_type"] | null
        }
        Update: {
          affected_groups?: string[]
          anonymized?: boolean | null
          challenge_tags?: Database["public"]["Enums"]["harm_type"][]
          consent?: boolean | null
          context_artifacts?: Json | null
          created_at?: string
          evidence_refs?: string[] | null
          human_feedback?: Json | null
          id?: string
          mode?: Database["public"]["Enums"]["interrogation_mode"]
          model_output?: string
          model_rationale?: string | null
          model_revision?: string | null
          project_id?: string
          redress_notes?: string | null
          session_id?: string
          user_prompt?: string
          verdict?: Database["public"]["Enums"]["verdict_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "interrogations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interrogations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_contributions: {
        Row: {
          created_at: string
          id: string
          interrogation_count: number
          organization_id: string
          period_end: string
          period_start: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interrogation_count?: number
          organization_id: string
          period_end: string
          period_start: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interrogation_count?: number
          organization_id?: string
          period_end?: string
          period_start?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_contributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_earnings: {
        Row: {
          contribution_percentage: number
          created_at: string
          earned_amount: number
          id: string
          organization_id: string
          purchase_id: string
        }
        Insert: {
          contribution_percentage: number
          created_at?: string
          earned_amount: number
          id?: string
          organization_id: string
          purchase_id: string
        }
        Update: {
          contribution_percentage?: number
          created_at?: string
          earned_amount?: number
          id?: string
          organization_id?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_earnings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "data_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_payouts: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          paid_at: string | null
          payout_month: string
          status: string
          stripe_transfer_id: string | null
          total_earned: number
          total_paid: number
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          paid_at?: string | null
          payout_month: string
          status?: string
          stripe_transfer_id?: string | null
          total_earned: number
          total_paid?: number
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          payout_month?: string
          status?: string
          stripe_transfer_id?: string | null
          total_earned?: number
          total_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          location: string | null
          mission: string | null
          name: string
          onboarding_completed_at: string | null
          onboarding_started_at: string | null
          payout_enabled: boolean | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          mission?: string | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          payout_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          mission?: string | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          payout_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      payout_ledger: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          calculated_at: string | null
          contribution_percentage: number
          created_at: string
          gross_earnings: number
          id: string
          net_payout: number
          organization_id: string
          paid_at: string | null
          period_month: string
          platform_fees: number
          status: string
          stripe_payout_id: string | null
          total_contributions: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          calculated_at?: string | null
          contribution_percentage?: number
          created_at?: string
          gross_earnings?: number
          id?: string
          net_payout?: number
          organization_id: string
          paid_at?: string | null
          period_month: string
          platform_fees?: number
          status?: string
          stripe_payout_id?: string | null
          total_contributions?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          calculated_at?: string | null
          contribution_percentage?: number
          created_at?: string
          gross_earnings?: number
          id?: string
          net_payout?: number
          organization_id?: string
          paid_at?: string | null
          period_month?: string
          platform_fees?: number
          status?: string
          stripe_payout_id?: string | null
          total_contributions?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_consent: {
        Row: {
          consented_at: string
          id: string
          policy_version: string
          user_id: string
        }
        Insert: {
          consented_at?: string
          id?: string
          policy_version?: string
          user_id: string
        }
        Update: {
          consented_at?: string
          id?: string
          policy_version?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          annual_price: number | null
          bundle_price: number | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_records: number | null
          min_records: number | null
          price_per_record: number | null
          tier_name: string
          tier_type: string
        }
        Insert: {
          annual_price?: number | null
          bundle_price?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_records?: number | null
          min_records?: number | null
          price_per_record?: number | null
          tier_name: string
          tier_type: string
        }
        Update: {
          annual_price?: number | null
          bundle_price?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_records?: number | null
          min_records?: number | null
          price_per_record?: number | null
          tier_name?: string
          tier_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      project_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          invited_by: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invited_by: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invited_by?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          consent_revocable: boolean | null
          created_at: string
          data_anonymized: boolean | null
          data_donation_consent: boolean | null
          end_date: string | null
          facilitator_id: string
          id: string
          name: string
          organization_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          consent_revocable?: boolean | null
          created_at?: string
          data_anonymized?: boolean | null
          data_donation_consent?: boolean | null
          end_date?: string | null
          facilitator_id: string
          id?: string
          name: string
          organization_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          consent_revocable?: boolean | null
          created_at?: string
          data_anonymized?: boolean | null
          data_donation_consent?: boolean | null
          end_date?: string | null
          facilitator_id?: string
          id?: string
          name?: string
          organization_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_facilitator_id_fkey"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_reviews: {
        Row: {
          id: string
          interrogation_id: string | null
          is_approved: boolean | null
          quality_score: number
          review_notes: string | null
          reviewed_at: string
          reviewer_id: string | null
        }
        Insert: {
          id?: string
          interrogation_id?: string | null
          is_approved?: boolean | null
          quality_score: number
          review_notes?: string | null
          reviewed_at?: string
          reviewer_id?: string | null
        }
        Update: {
          id?: string
          interrogation_id?: string | null
          is_approved?: boolean | null
          quality_score?: number
          review_notes?: string | null
          reviewed_at?: string
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_reviews_interrogation_id_fkey"
            columns: ["interrogation_id"]
            isOneToOne: false
            referencedRelation: "interrogations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          next_steps: string | null
          notes: string | null
          project_id: string
          session_name: string
          session_number: number
          status: Database["public"]["Enums"]["session_status"] | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          next_steps?: string | null
          notes?: string | null
          project_id: string
          session_name: string
          session_number: number
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          next_steps?: string | null
          notes?: string | null
          project_id?: string
          session_name?: string
          session_number?: number
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_contribution_percentages: {
        Args: never
        Returns: {
          organization_id: string
          organization_name: string
          percentage: number
          total_contributions: number
        }[]
      }
      calculate_monthly_payouts: {
        Args: { target_month: string }
        Returns: {
          contribution_percentage: number
          gross_earnings: number
          net_payout: number
          organization_id: string
          organization_name: string
          total_contributions: number
        }[]
      }
      finalize_monthly_payouts: {
        Args: { target_month: string }
        Returns: number
      }
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
        }[]
      }
      get_project_from_session: {
        Args: { _session_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_care_team_leader: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_facilitator: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      verify_certificate: {
        Args: { p_code: string }
        Returns: {
          awarded_at: string
          learner_name: string
          level_title: string
          score: number
          verification_code: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "facilitator"
        | "team_member"
        | "evaluator"
        | "org_viewer"
        | "monitor"
      artifact_type:
        | "problem_statement"
        | "community_group"
        | "timeline_event"
        | "invested_party"
        | "dataset"
        | "asset_map"
        | "solution"
        | "toc_node"
        | "cim_metric"
        | "data_plan"
      harm_type:
        | "bias"
        | "deficit_framing"
        | "cultural_misread"
        | "equity_gap"
        | "hallucination"
        | "data_misuse"
        | "stereotype"
        | "erasure"
      interrogation_mode: "proximity" | "belief" | "timing"
      project_role: "care_team_leader" | "care_team_member"
      session_status: "not_started" | "in_progress" | "completed"
      user_role:
        | "admin"
        | "facilitator"
        | "team_member"
        | "evaluator"
        | "org_viewer"
        | "researcher"
        | "monitor"
      verdict_type:
        | "accept_revision"
        | "needs_more_revision"
        | "reject_provide_human"
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
      app_role: [
        "facilitator",
        "team_member",
        "evaluator",
        "org_viewer",
        "monitor",
      ],
      artifact_type: [
        "problem_statement",
        "community_group",
        "timeline_event",
        "invested_party",
        "dataset",
        "asset_map",
        "solution",
        "toc_node",
        "cim_metric",
        "data_plan",
      ],
      harm_type: [
        "bias",
        "deficit_framing",
        "cultural_misread",
        "equity_gap",
        "hallucination",
        "data_misuse",
        "stereotype",
        "erasure",
      ],
      interrogation_mode: ["proximity", "belief", "timing"],
      project_role: ["care_team_leader", "care_team_member"],
      session_status: ["not_started", "in_progress", "completed"],
      user_role: [
        "admin",
        "facilitator",
        "team_member",
        "evaluator",
        "org_viewer",
        "researcher",
        "monitor",
      ],
      verdict_type: [
        "accept_revision",
        "needs_more_revision",
        "reject_provide_human",
      ],
    },
  },
} as const
