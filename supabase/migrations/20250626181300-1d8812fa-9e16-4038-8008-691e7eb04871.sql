
-- Crear tabla para inscripciones de jugadores a ligas
CREATE TABLE public.league_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(league_id, player_id)
);

-- Habilitar RLS en la tabla league_players
ALTER TABLE public.league_players ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para league_players
CREATE POLICY "Authenticated users can view league players" ON public.league_players
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can register for leagues" ON public.league_players
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Only admins can update league players" ON public.league_players
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can withdraw from leagues they registered for" ON public.league_players
  FOR DELETE TO authenticated USING (true);
