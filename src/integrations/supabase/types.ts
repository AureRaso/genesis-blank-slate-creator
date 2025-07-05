export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          created_at: string
          email: string
          full_name: string
          id: string
          level: number | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          level?: number | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          level?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: []
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
          trainer_email: string
          trainer_full_name: string
          club_id: string
          trainer_phone: string
          trainer_specialty: string
          trainer_photo_url: string
        }
        Returns: Json
      }
      has_role: {
        Args: { profile_id: string; expected_role: string }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      record_match_creation: {
        Args:
          | { _profile_id: string; _week_start: string }
          | { profile_id: string }
          | { profile_id: string; match_id: string }
        Returns: undefined
      }
    }
    Enums: {
      class_level: "iniciacion" | "intermedio" | "avanzado"
      day_of_week:
        | "lunes"
        | "martes"
        | "miercoles"
        | "jueves"
        | "viernes"
        | "sabado"
        | "domingo"
      reservation_status: "reservado" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      class_level: ["iniciacion", "intermedio", "avanzado"],
      day_of_week: [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ],
      reservation_status: ["reservado", "cancelado"],
    },
  },
} as const
