
export interface Player {
  id: string;
  name: string;
  email: string;
  level: 1 | 2 | 3 | 4 | 5; // Nivel de 1 a 5
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  player1_id: string;
  player2_id: string;
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  points_victory: number;
  points_defeat: number;
  points_per_set: boolean; // punto extra por set ganado
  registration_price: number; // precio de inscripción
  status: "upcoming" | "active" | "completed";
  club_id?: string; // referencia al club donde se juega la liga
  created_at: string;
  clubs?: {
    id: string;
    name: string;
    address: string;
    phone: string;
  }; // Optional joined club data
}

export interface Match {
  id: string;
  league_id: string;
  team1_id: string;
  team2_id: string;
  round: number;
  scheduled_date?: string;
  scheduled_time?: string;
  status: "pending" | "completed";
  created_at: string;
  created_by_profile_id?: string;
  result_submitted_by_team_id?: string;
  result_approved_by_team_id?: string;
  result_status?: "pending" | "submitted" | "approved" | "disputed";
}

export interface MatchResult {
  id: string;
  match_id: string;
  team1_set1: number;
  team1_set2: number;
  team1_set3?: number;
  team2_set1: number;
  team2_set2: number;
  team2_set3?: number;
  winner_team_id: string;
  points_team1: number;
  points_team2: number;
  created_at: string;
}

export interface LeagueStanding {
  team_id: string;
  team_name: string;
  player1_name: string;
  player2_name: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_for: number;
  sets_against: number;
  set_difference: number;
  total_points: number;
  position: number;
}

export interface PlayerMatchCreation {
  id: string;
  profile_id: string;
  week_start: string;
  matches_created: number;
  created_at: string;
}
