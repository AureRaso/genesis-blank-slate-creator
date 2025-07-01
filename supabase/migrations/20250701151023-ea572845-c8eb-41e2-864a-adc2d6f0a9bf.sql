
-- Política adicional para que los jugadores puedan ver clases activas de todos los clubes
CREATE POLICY "Players can view all active class slots from any club" 
  ON public.class_slots 
  FOR SELECT 
  USING (is_active = true);
