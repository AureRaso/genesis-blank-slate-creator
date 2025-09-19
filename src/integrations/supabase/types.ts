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
      class_enrollments: {
        Row: {
          created_at: string
          enrollment_date: string
          id: string
          notes: string | null
          scheduled_class_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          student_enrollment_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrollment_date?: string
          id?: string
          notes?: string | null
          scheduled_class_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          student_enrollment_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string
          id?: string
          notes?: string | null
          scheduled_class_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          student_enrollment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_groups: {
        Row: {
          club_id: string
          created_at: string
          created_by_profile_id: string
          description: string | null
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["class_level"]
          name: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by_profile_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          level: Database["public"]["Enums"]["class_level"]
          name: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by_profile_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["class_level"]
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_groups_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_groups_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      class_participants: {
        Row: {
          amount_paid: number | null
          class_id: string
          created_at: string
          discount_1: number | null
          discount_2: number | null
          id: string
          months_paid: number[] | null
          payment_date: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_status: string
          payment_type: string | null
          payment_verified: boolean
          status: string
          student_enrollment_id: string
          total_amount_due: number | null
          total_months: number | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          class_id: string
          created_at?: string
          discount_1?: number | null
          discount_2?: number | null
          id?: string
          months_paid?: number[] | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: string
          payment_type?: string | null
          payment_verified?: boolean
          status?: string
          student_enrollment_id: string
          total_amount_due?: number | null
          total_months?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          class_id?: string
          created_at?: string
          discount_1?: number | null
          discount_2?: number | null
          id?: string
          months_paid?: number[] | null
          payment_date?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: string
          payment_type?: string | null
          payment_verified?: boolean
          status?: string
          student_enrollment_id?: string
          total_amount_due?: number | null
          total_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "programmed_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_participants_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      class_reservations: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          player_profile_id: string
          slot_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          player_profile_id: string
          slot_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          player_profile_id?: string
          slot_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_reservations_player_profile_id_fkey"
            columns: ["player_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reservations_player_profile_id_fkey"
            columns: ["player_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reservations_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "class_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      class_slots: {
        Row: {
          club_id: string
          court_number: number
          created_at: string
          created_by_profile_id: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          duration_minutes: number
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["class_level"]
          max_players: number
          objective: string
          price_per_player: number
          repeat_weekly: boolean
          start_time: string
          trainer_id: string | null
          trainer_name: string
          updated_at: string
        }
        Insert: {
          club_id: string
          court_number: number
          created_at?: string
          created_by_profile_id: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          level: Database["public"]["Enums"]["class_level"]
          max_players?: number
          objective: string
          price_per_player: number
          repeat_weekly?: boolean
          start_time: string
          trainer_id?: string | null
          trainer_name: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          court_number?: number
          created_at?: string
          created_by_profile_id?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["class_level"]
          max_players?: number
          objective?: string
          price_per_player?: number
          repeat_weekly?: boolean
          start_time?: string
          trainer_id?: string | null
          trainer_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_slots_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_slots_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_slots_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_slots_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string
          court_count: number
          court_types: string[]
          created_at: string
          created_by_profile_id: string
          description: string | null
          id: string
          name: string
          phone: string
          status: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_onboarding_completed: boolean | null
          updated_at: string
        }
        Insert: {
          address: string
          court_count: number
          court_types: string[]
          created_at?: string
          created_by_profile_id: string
          description?: string | null
          id?: string
          name: string
          phone: string
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string
          court_count?: number
          court_types?: string[]
          created_at?: string
          created_by_profile_id?: string
          description?: string | null
          id?: string
          name?: string
          phone?: string
          status?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_forms: {
        Row: {
          club_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          status: string
          student_data: Json | null
          token: string
          trainer_profile_id: string
          updated_at: string
        }
        Insert: {
          club_id: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          student_data?: Json | null
          token?: string
          trainer_profile_id: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          student_data?: Json | null
          token?: string
          trainer_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_forms_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_forms_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_forms_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_tokens: {
        Row: {
          available_spots: number
          class_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          token: string
          updated_at: string
          used_count: number
        }
        Insert: {
          available_spots?: number
          class_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          token?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          available_spots?: number
          class_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_active: boolean
          joined_date: string
          student_enrollment_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_active?: boolean
          joined_date?: string
          student_enrollment_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_active?: boolean
          joined_date?: string
          student_enrollment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_student_enrollment_id_fkey"
            columns: ["student_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      league_players: {
        Row: {
          created_at: string
          id: string
          league_id: string
          profile_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          profile_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_players_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      league_teams: {
        Row: {
          created_at: string
          id: string
          league_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          club_id: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          points_defeat: number
          points_per_set: boolean
          points_victory: number
          registration_price: number
          start_date: string
          status: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          points_defeat?: number
          points_per_set?: boolean
          points_victory?: number
          registration_price?: number
          start_date: string
          status?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          points_defeat?: number
          points_per_set?: boolean
          points_victory?: number
          registration_price?: number
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string
          id: string
          match_id: string
          points_team1: number
          points_team2: number
          team1_set1: number
          team1_set2: number
          team1_set3: number | null
          team2_set1: number
          team2_set2: number
          team2_set3: number | null
          winner_team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          points_team1?: number
          points_team2?: number
          team1_set1: number
          team1_set2: number
          team1_set3?: number | null
          team2_set1: number
          team2_set2: number
          team2_set3?: number | null
          winner_team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          points_team1?: number
          points_team2?: number
          team1_set1?: number
          team1_set2?: number
          team1_set3?: number | null
          team2_set1?: number
          team2_set2?: number
          team2_set3?: number | null
          winner_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          id: string
          league_id: string
          result_approved_by_team_id: string | null
          result_status: string | null
          result_submitted_by_team_id: string | null
          round: number
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          team1_id: string
          team2_id: string
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          league_id: string
          result_approved_by_team_id?: string | null
          result_status?: string | null
          result_submitted_by_team_id?: string | null
          round: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          team1_id: string
          team2_id: string
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          league_id?: string
          result_approved_by_team_id?: string | null
          result_status?: string | null
          result_submitted_by_team_id?: string | null
          round?: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          team1_id?: string
          team2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_creation: {
        Row: {
          created_at: string
          id: string
          matches_created: number | null
          profile_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          matches_created?: number | null
          profile_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          matches_created?: number | null
          profile_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_match_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_creation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          club_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          level: number | null
          role: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          level?: number | null
          role?: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          level?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      programmed_classes: {
        Row: {
          club_id: string
          court_number: number | null
          created_at: string
          created_by: string
          custom_level: string | null
          days_of_week: string[]
          duration_minutes: number
          end_date: string
          group_id: string | null
          id: string
          is_active: boolean
          level_from: number | null
          level_to: number | null
          max_participants: number | null
          monthly_price: number
          name: string
          recurrence_type: string
          start_date: string
          start_time: string
          trainer_profile_id: string
          updated_at: string
        }
        Insert: {
          club_id: string
          court_number?: number | null
          created_at?: string
          created_by?: string
          custom_level?: string | null
          days_of_week?: string[]
          duration_minutes?: number
          end_date: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          level_from?: number | null
          level_to?: number | null
          max_participants?: number | null
          monthly_price?: number
          name: string
          recurrence_type?: string
          start_date: string
          start_time: string
          trainer_profile_id: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          court_number?: number | null
          created_at?: string
          created_by?: string
          custom_level?: string | null
          days_of_week?: string[]
          duration_minutes?: number
          end_date?: string
          group_id?: string | null
          id?: string
          is_active?: boolean
          level_from?: number | null
          level_to?: number | null
          max_participants?: number | null
          monthly_price?: number
          name?: string
          recurrence_type?: string
          start_date?: string
          start_time?: string
          trainer_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programmed_classes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmed_classes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmed_classes_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programmed_classes_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          club_id: string
          course: string | null
          created_at: string
          created_by_profile_id: string
          discount_1: number | null
          discount_2: number | null
          email: string
          enrollment_date: string | null
          enrollment_period: string
          expected_end_date: string | null
          first_payment: number | null
          full_name: string
          id: string
          level: number
          observations: string | null
          payment_method: string | null
          phone: string
          preferred_times: string[]
          status: string
          trainer_profile_id: string
          updated_at: string
          weekly_days: string[]
        }
        Insert: {
          club_id: string
          course?: string | null
          created_at?: string
          created_by_profile_id: string
          discount_1?: number | null
          discount_2?: number | null
          email: string
          enrollment_date?: string | null
          enrollment_period: string
          expected_end_date?: string | null
          first_payment?: number | null
          full_name: string
          id?: string
          level: number
          observations?: string | null
          payment_method?: string | null
          phone: string
          preferred_times: string[]
          status?: string
          trainer_profile_id: string
          updated_at?: string
          weekly_days: string[]
        }
        Update: {
          club_id?: string
          course?: string | null
          created_at?: string
          created_by_profile_id?: string
          discount_1?: number | null
          discount_2?: number | null
          email?: string
          enrollment_date?: string | null
          enrollment_period?: string
          expected_end_date?: string | null
          first_payment?: number | null
          full_name?: string
          id?: string
          level?: number
          observations?: string | null
          payment_method?: string | null
          phone?: string
          preferred_times?: string[]
          status?: string
          trainer_profile_id?: string
          updated_at?: string
          weekly_days?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          league_id: string | null
          name: string
          player1_id: string
          player2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id?: string | null
          name: string
          player1_id: string
          player2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string | null
          name?: string
          player1_id?: string
          player2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_clubs: {
        Row: {
          club_id: string
          created_at: string
          id: string
          trainer_profile_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          trainer_profile_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          trainer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_clubs_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_clubs_trainer_profile_id_fkey"
            columns: ["trainer_profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          photo_url: string | null
          profile_id: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_players"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlists: {
        Row: {
          class_id: string
          created_at: string
          expires_at: string | null
          id: string
          joined_at: string
          notified_at: string | null
          position: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          joined_at?: string
          notified_at?: string | null
          position: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          joined_at?: string
          notified_at?: string | null
          position?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "programmed_classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_players: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_create_match_this_week: {
        Args: { _profile_id: string }
        Returns: boolean
      }
      create_trainer_user: {
        Args: {
          club_id: string
          trainer_email: string
          trainer_full_name: string
          trainer_phone: string
          trainer_photo_url: string
          trainer_specialty: string
        }
        Returns: Json
      }
      has_role: {
        Args: { expected_role: string; profile_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_club_admin_of_class: {
        Args: { class_id: string }
        Returns: boolean
      }
      is_trainer_assigned_to_club: {
        Args: { club_id: string }
        Returns: boolean
      }
      is_trainer_of_class: {
        Args: { class_id: string }
        Returns: boolean
      }
      is_trainer_of_club: {
        Args: { club_id: string }
        Returns: boolean
      }
      is_trainer_of_club_safe: {
        Args: { club_id: string }
        Returns: boolean
      }
      process_new_class_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      record_match_creation: {
        Args:
          | { _profile_id: string; _week_start: string }
          | { match_id: string; profile_id: string }
          | { profile_id: string }
        Returns: undefined
      }
      rpc_create_programmed_class: {
        Args: {
          p_club_id: string
          p_court_number: number
          p_custom_level: string
          p_days_of_week: string[]
          p_duration_minutes: number
          p_end_date: string
          p_group_id?: string
          p_level_from: number
          p_level_to: number
          p_max_participants?: number
          p_monthly_price?: number
          p_name: string
          p_recurrence_type: string
          p_selected_students?: string[]
          p_start_date: string
          p_start_time: string
          p_trainer_profile_id: string
        }
        Returns: {
          class_id: string
        }[]
      }
      rpc_create_programmed_classes_bulk: {
        Args: { p_items: Json }
        Returns: Json
      }
    }
    Enums: {
      class_level: "iniciacion" | "intermedio" | "avanzado"
      class_status: "scheduled" | "completed" | "cancelled"
      day_of_week:
        | "lunes"
        | "martes"
        | "miercoles"
        | "jueves"
        | "viernes"
        | "sabado"
        | "domingo"
      recurrence_type: "weekly" | "biweekly" | "monthly"
      reservation_status: "reservado" | "cancelado"
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
      class_level: ["iniciacion", "intermedio", "avanzado"],
      class_status: ["scheduled", "completed", "cancelled"],
      day_of_week: [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ],
      recurrence_type: ["weekly", "biweekly", "monthly"],
      reservation_status: ["reservado", "cancelado"],
    },
  },
} as const
