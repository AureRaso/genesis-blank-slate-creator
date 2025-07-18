
-- Primero, eliminar las políticas problemáticas que causan recursión infinita
DROP POLICY IF EXISTS "Admins can manage all enrollments in their clubs" ON public.class_enrollments;
DROP POLICY IF EXISTS "Trainers can manage enrollments for their classes" ON public.class_enrollments;

-- Crear una función de seguridad para verificar si un usuario es entrenador de una clase
CREATE OR REPLACE FUNCTION public.is_trainer_of_class(class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM scheduled_classes sc
    JOIN class_templates ct ON sc.template_id = ct.id
    WHERE sc.id = class_id 
    AND ct.trainer_profile_id = auth.uid()
  );
END;
$$;

-- Crear una función de seguridad para verificar si un usuario es admin de club de una clase
CREATE OR REPLACE FUNCTION public.is_club_admin_of_class(class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM scheduled_classes sc
    JOIN class_templates ct ON sc.template_id = ct.id
    JOIN clubs c ON ct.club_id = c.id
    WHERE sc.id = class_id 
    AND c.created_by_profile_id = auth.uid()
  );
END;
$$;

-- Función para verificar si un usuario es entrenador de un club específico
CREATE OR REPLACE FUNCTION public.is_trainer_of_club(club_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM trainer_clubs tc
    WHERE tc.club_id = is_trainer_of_club.club_id
    AND tc.trainer_profile_id = auth.uid()
  );
END;
$$;

-- Recrear las políticas para class_enrollments usando las funciones de seguridad
CREATE POLICY "Trainers can manage enrollments for their classes"
  ON public.class_enrollments
  FOR ALL
  USING (public.is_trainer_of_class(scheduled_class_id));

CREATE POLICY "Club admins can manage enrollments in their clubs"
  ON public.class_enrollments
  FOR ALL
  USING (public.is_club_admin_of_class(scheduled_class_id));

-- Arreglar las políticas de class_templates para permitir a los entrenadores crear plantillas
DROP POLICY IF EXISTS "Trainers can manage their club's templates" ON public.class_templates;

CREATE POLICY "Trainers can manage templates for their clubs"
  ON public.class_templates
  FOR ALL
  USING (public.is_trainer_of_club(club_id));

-- Asegurar que las políticas de scheduled_classes también usen las funciones de seguridad
DROP POLICY IF EXISTS "Trainers can view and manage their classes" ON public.scheduled_classes;

CREATE POLICY "Trainers can manage their scheduled classes"
  ON public.scheduled_classes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM class_templates ct
      WHERE ct.id = scheduled_classes.template_id 
      AND ct.trainer_profile_id = auth.uid()
    )
  );
