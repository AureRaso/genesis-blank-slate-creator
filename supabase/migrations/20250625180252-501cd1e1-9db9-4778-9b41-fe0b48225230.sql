
-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player', 'captain')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en la tabla profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Función para manejar nuevos usuarios registrados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    'player'
  );
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para verificar roles de usuario
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Actualizar políticas RLS para players (más restrictivas)
DROP POLICY IF EXISTS "Everyone can view players" ON public.players;
DROP POLICY IF EXISTS "Everyone can insert players" ON public.players;
DROP POLICY IF EXISTS "Everyone can update players" ON public.players;
DROP POLICY IF EXISTS "Everyone can delete players" ON public.players;

-- Nuevas políticas para players
CREATE POLICY "Authenticated users can view players" ON public.players
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert players" ON public.players
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update players" ON public.players
  FOR UPDATE TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete players" ON public.players
  FOR DELETE TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Actualizar políticas RLS para teams (más restrictivas)
DROP POLICY IF EXISTS "Everyone can view teams" ON public.teams;
DROP POLICY IF EXISTS "Everyone can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Everyone can update teams" ON public.teams;
DROP POLICY IF EXISTS "Everyone can delete teams" ON public.teams;

-- Nuevas políticas para teams
CREATE POLICY "Authenticated users can view teams" ON public.teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert teams" ON public.teams
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update teams" ON public.teams
  FOR UPDATE TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete teams" ON public.teams
  FOR DELETE TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Políticas para profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Only admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete profiles" ON public.profiles
  FOR DELETE TO authenticated 
  USING (public.is_admin(auth.uid()));

-- Crear un usuario admin inicial (opcional, para testing)
-- Nota: Esto se ejecutará cuando haya al menos un usuario registrado
-- El primer usuario que se registre puede ser promovido a admin manualmente
