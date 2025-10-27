-- ============================================
-- APLICAR MANUALMENTE EN SUPABASE SQL EDITOR
-- ============================================
-- Copia este archivo completo y ejecútalo en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================

-- PASO 1: Añadir rol 'guardian'
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('player', 'trainer', 'admin', 'club_admin', 'owner', 'guardian'));

-- PASO 2: Crear tabla account_dependents
CREATE TABLE IF NOT EXISTS public.account_dependents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dependent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'child' CHECK (relationship_type IN ('child', 'other')),
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_guardian_dependent UNIQUE(guardian_profile_id, dependent_profile_id),
  CONSTRAINT no_self_dependency CHECK (guardian_profile_id != dependent_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_account_dependents_guardian ON public.account_dependents(guardian_profile_id);
CREATE INDEX IF NOT EXISTS idx_account_dependents_dependent ON public.account_dependents(dependent_profile_id);

-- PASO 3: Añadir student_profile_id a student_enrollments
ALTER TABLE public.student_enrollments
ADD COLUMN IF NOT EXISTS student_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_profile_id
ON public.student_enrollments(student_profile_id);

-- PASO 4: Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_account_dependents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_account_dependents_updated_at ON public.account_dependents;
CREATE TRIGGER update_account_dependents_updated_at
BEFORE UPDATE ON public.account_dependents
FOR EACH ROW
EXECUTE FUNCTION public.update_account_dependents_updated_at();

-- PASO 5: Habilitar RLS
ALTER TABLE public.account_dependents ENABLE ROW LEVEL SECURITY;

-- PASO 6: RLS Policies para account_dependents
DROP POLICY IF EXISTS "Guardians can manage their dependents" ON public.account_dependents;
CREATE POLICY "Guardians can manage their dependents"
ON public.account_dependents
FOR ALL
USING (guardian_profile_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view dependents of their students" ON public.account_dependents;
CREATE POLICY "Trainers can view dependents of their students"
ON public.account_dependents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_enrollments se
    WHERE se.student_profile_id = account_dependents.dependent_profile_id
    AND se.trainer_profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can view all dependents" ON public.account_dependents;
CREATE POLICY "Admins can view all dependents"
ON public.account_dependents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'club_admin')
  )
);

-- PASO 7: RLS Policies para student_enrollments
DROP POLICY IF EXISTS "Guardians can view their children enrollments" ON public.student_enrollments;
CREATE POLICY "Guardians can view their children enrollments"
ON public.student_enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.account_dependents ad
    WHERE ad.dependent_profile_id = student_enrollments.student_profile_id
    AND ad.guardian_profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view their own enrollments"
ON public.student_enrollments
FOR SELECT
USING (student_profile_id = auth.uid());

-- PASO 8: Función helper is_guardian
CREATE OR REPLACE FUNCTION public.is_guardian(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'guardian'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 9: Función helper get_guardian_children
CREATE OR REPLACE FUNCTION public.get_guardian_children(guardian_id UUID)
RETURNS TABLE (
  child_id UUID,
  child_name TEXT,
  child_email TEXT,
  child_level DECIMAL(3,1),
  child_club_id UUID,
  relationship_type TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.level,
    p.club_id,
    ad.relationship_type,
    ad.birth_date,
    ad.created_at
  FROM public.account_dependents ad
  JOIN public.profiles p ON ad.dependent_profile_id = p.id
  WHERE ad.guardian_profile_id = guardian_id
  ORDER BY ad.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- VERIFICACIÓN (ejecuta esto después para comprobar)
-- ============================================
SELECT 'VERIFICACIÓN: Constraint de roles' as test;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'profiles_role_check';

SELECT 'VERIFICACIÓN: Tabla account_dependents creada' as test;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'account_dependents'
ORDER BY ordinal_position;

SELECT 'VERIFICACIÓN: Columna student_profile_id añadida' as test;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_enrollments' AND column_name = 'student_profile_id';

SELECT '✅ Migración completada correctamente!' as status;
