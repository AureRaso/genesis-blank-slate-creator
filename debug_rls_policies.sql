-- SCRIPT DE DEPURACIÓN PARA VERIFICAR POLÍTICAS RLS
-- Ejecuta esto en el SQL Editor de Supabase para verificar el estado actual

-- 1. Verificar si RLS está habilitado en la tabla
SELECT
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables
WHERE tablename = 'student_enrollments';

-- 2. Mostrar todas las políticas actuales para student_enrollments
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- 3. Verificar estructura de campos
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'student_enrollments'
AND column_name IN ('weekly_days', 'preferred_times', 'enrollment_period', 'created_by_profile_id', 'trainer_profile_id');

-- 4. Verificar si existen enrollment_tokens válidos
SELECT
    token,
    class_id,
    available_spots,
    used_count,
    expires_at,
    is_active,
    created_at
FROM enrollment_tokens
WHERE is_active = true
AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 5;

-- 5. Test de inserción manual (cambia los valores por datos reales)
-- NOTA: Este insert fallará si las políticas no están correctas
/*
INSERT INTO student_enrollments (
    trainer_profile_id,
    club_id,
    created_by_profile_id,
    full_name,
    email,
    phone,
    level,
    weekly_days,
    preferred_times,
    enrollment_period,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- reemplaza con trainer_profile_id real
    '00000000-0000-0000-0000-000000000000', -- reemplaza con club_id real
    '00000000-0000-0000-0000-000000000000', -- reemplaza con trainer_profile_id real
    'Test Player',
    'test@example.com',
    '123456789',
    3,
    '{}',
    '{}',
    'mensual',
    'active'
);
*/