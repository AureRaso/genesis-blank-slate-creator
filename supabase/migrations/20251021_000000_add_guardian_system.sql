-- ============================================
-- Migración: Sistema de Guardians (Padres/Tutores)
-- ============================================
-- Permite a padres/tutores gestionar perfiles de hijos menores
-- Los hijos aparecen como players normales en dashboards de trainers
-- ============================================

-- ============================================
-- PASO 1: Añadir rol 'guardian' al sistema
-- ============================================

-- Eliminar constraint existente
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Añadir constraint con nuevo rol 'guardian'
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('player', 'trainer', 'admin', 'club_admin', 'owner', 'guardian'));

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
'Roles permitidos: player (jugador/alumno), trainer (profesor), admin (administrador del club), club_admin (admin de club específico), owner (super admin multi-club), guardian (padre/tutor que gestiona hijos)';


-- ============================================
-- PASO 2: Crear tabla account_dependents
-- ============================================

CREATE TABLE public.account_dependents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relación padre/tutor → hijo
  guardian_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dependent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Metadata
  relationship_type TEXT NOT NULL DEFAULT 'child' CHECK (relationship_type IN ('child', 'other')),
  birth_date DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_guardian_dependent UNIQUE(guardian_profile_id, dependent_profile_id),
  CONSTRAINT no_self_dependency CHECK (guardian_profile_id != dependent_profile_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_account_dependents_guardian ON public.account_dependents(guardian_profile_id);
CREATE INDEX idx_account_dependents_dependent ON public.account_dependents(dependent_profile_id);

-- Comentarios
COMMENT ON TABLE public.account_dependents IS
'Relaciones entre tutores (guardians) y sus dependientes (hijos/menores). Permite que un padre gestione múltiples hijos y que un hijo tenga múltiples tutores.';

COMMENT ON COLUMN public.account_dependents.guardian_profile_id IS
'ID del perfil del padre/madre/tutor que gestiona al dependiente';

COMMENT ON COLUMN public.account_dependents.dependent_profile_id IS
'ID del perfil del hijo/menor que es gestionado por el guardian';


-- ============================================
-- PASO 3: Añadir student_profile_id a student_enrollments
-- ============================================

-- Añadir columna para vincular enrollment con profile del estudiante
ALTER TABLE public.student_enrollments
ADD COLUMN student_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Índice para mejorar queries
CREATE INDEX idx_student_enrollments_student_profile_id
ON public.student_enrollments(student_profile_id);

COMMENT ON COLUMN public.student_enrollments.student_profile_id IS
'ID del perfil del estudiante (cuando el estudiante tiene cuenta propia). Para hijos menores creados por guardians, este campo vincula el enrollment con el perfil del hijo.';


-- ============================================
-- PASO 4: Trigger para actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_account_dependents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_dependents_updated_at
BEFORE UPDATE ON public.account_dependents
FOR EACH ROW
EXECUTE FUNCTION public.update_account_dependents_updated_at();


-- ============================================
-- PASO 5: Habilitar RLS
-- ============================================

ALTER TABLE public.account_dependents ENABLE ROW LEVEL SECURITY;


-- ============================================
-- PASO 6: RLS Policies para account_dependents
-- ============================================

-- Los guardians pueden gestionar (CRUD) sus propios dependientes
CREATE POLICY "Guardians can manage their dependents"
ON public.account_dependents
FOR ALL
USING (guardian_profile_id = auth.uid());

-- Los trainers pueden ver dependientes de sus estudiantes
-- (para saber quién es el padre de un alumno)
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

-- Los admins y owners pueden ver todos los dependientes
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


-- ============================================
-- PASO 7: RLS Policies para student_enrollments (Guardians)
-- ============================================

-- Los guardians pueden ver los enrollments de sus hijos
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

-- Los estudiantes pueden ver sus propios enrollments
-- (para cuando el hijo crezca y tenga acceso a su cuenta)
CREATE POLICY "Students can view their own enrollments"
ON public.student_enrollments
FOR SELECT
USING (student_profile_id = auth.uid());


-- ============================================
-- PASO 8: Función helper para verificar si un usuario es guardian
-- ============================================

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

COMMENT ON FUNCTION public.is_guardian IS
'Verifica si un usuario tiene rol de guardian (padre/tutor)';


-- ============================================
-- PASO 9: Función helper para obtener hijos de un guardian
-- ============================================

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

COMMENT ON FUNCTION public.get_guardian_children IS
'Obtiene la lista de hijos/dependientes de un guardian específico';


-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el constraint se creó correctamente
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'profiles_role_check';

-- Verificar que la tabla se creó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'account_dependents'
ORDER BY ordinal_position;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los guardians NO pueden modificar enrollments directamente
--    Solo pueden verlos (las modificaciones las hace el trainer)
--
-- 2. Para crear un hijo, el guardian debe:
--    a) Crear un profile con role='player' para el hijo
--    b) Crear un registro en account_dependents vinculándose
--    c) El trainer luego crea el student_enrollment
--
-- 3. Un hijo puede tener múltiples guardians (padre Y madre)
--    Solo necesitas crear múltiples registros en account_dependents
--
-- 4. La columna student_profile_id en student_enrollments es OPCIONAL
--    Permite enrollments "antiguos" sin perfil vinculado
-- ============================================
