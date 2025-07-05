
-- Quitar el campo club_id de la tabla trainers ya que ahora se maneja via trainer_clubs
ALTER TABLE public.trainers DROP COLUMN club_id;

-- También quitar otros campos redundantes que se manejan via profiles
ALTER TABLE public.trainers DROP COLUMN IF EXISTS email;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.trainers DROP COLUMN IF EXISTS phone;
