
-- Crear tabla de jugadores
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de parejas/equipos
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  player1_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_players CHECK (player1_id != player2_id),
  CONSTRAINT unique_team_composition UNIQUE (player1_id, player2_id)
);

-- Crear tabla de ligas
CREATE TABLE public.leagues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  points_victory INTEGER NOT NULL DEFAULT 3,
  points_defeat INTEGER NOT NULL DEFAULT 0,
  points_per_set BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Crear tabla de participación de equipos en ligas
CREATE TABLE public.league_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_team_per_league UNIQUE (league_id, team_id)
);

-- Crear tabla de partidos
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_teams CHECK (team1_id != team2_id)
);

-- Crear tabla de resultados de partidos
CREATE TABLE public.match_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE,
  team1_set1 INTEGER NOT NULL CHECK (team1_set1 >= 0),
  team1_set2 INTEGER NOT NULL CHECK (team1_set2 >= 0),
  team1_set3 INTEGER CHECK (team1_set3 >= 0),
  team2_set1 INTEGER NOT NULL CHECK (team2_set1 >= 0),
  team2_set2 INTEGER NOT NULL CHECK (team2_set2 >= 0),
  team2_set3 INTEGER CHECK (team2_set3 >= 0),
  winner_team_id UUID NOT NULL REFERENCES public.teams(id),
  points_team1 INTEGER NOT NULL DEFAULT 0,
  points_team2 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas para permitir acceso público de lectura y escritura
-- (En una aplicación real, estas políticas serían más restrictivas)

-- Políticas para players
CREATE POLICY "Everyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Everyone can insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete players" ON public.players FOR DELETE USING (true);

-- Políticas para teams
CREATE POLICY "Everyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Everyone can insert teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete teams" ON public.teams FOR DELETE USING (true);

-- Políticas para leagues
CREATE POLICY "Everyone can view leagues" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Everyone can insert leagues" ON public.leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update leagues" ON public.leagues FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete leagues" ON public.leagues FOR DELETE USING (true);

-- Políticas para league_teams
CREATE POLICY "Everyone can view league_teams" ON public.league_teams FOR SELECT USING (true);
CREATE POLICY "Everyone can insert league_teams" ON public.league_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update league_teams" ON public.league_teams FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete league_teams" ON public.league_teams FOR DELETE USING (true);

-- Políticas para matches
CREATE POLICY "Everyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Everyone can insert matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update matches" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete matches" ON public.matches FOR DELETE USING (true);

-- Políticas para match_results
CREATE POLICY "Everyone can view match_results" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "Everyone can insert match_results" ON public.match_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update match_results" ON public.match_results FOR UPDATE USING (true);
CREATE POLICY "Everyone can delete match_results" ON public.match_results FOR DELETE USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_teams_player1 ON public.teams(player1_id);
CREATE INDEX idx_teams_player2 ON public.teams(player2_id);
CREATE INDEX idx_league_teams_league ON public.league_teams(league_id);
CREATE INDEX idx_league_teams_team ON public.league_teams(team_id);
CREATE INDEX idx_matches_league ON public.matches(league_id);
CREATE INDEX idx_matches_team1 ON public.matches(team1_id);
CREATE INDEX idx_matches_team2 ON public.matches(team2_id);
CREATE INDEX idx_match_results_match ON public.match_results(match_id);
