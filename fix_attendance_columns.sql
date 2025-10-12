-- Agregar las columnas de confirmación de asistencia si no existen
-- Ejecuta este script directamente en tu dashboard de Supabase (SQL Editor)

-- Verificar primero si las columnas existen
DO $$
BEGIN
    -- Agregar attendance_confirmed_for_date si no existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'class_participants'
          AND column_name = 'attendance_confirmed_for_date'
    ) THEN
        ALTER TABLE public.class_participants
        ADD COLUMN attendance_confirmed_for_date DATE;

        RAISE NOTICE 'Column attendance_confirmed_for_date added successfully';
    ELSE
        RAISE NOTICE 'Column attendance_confirmed_for_date already exists';
    END IF;

    -- Agregar attendance_confirmed_at si no existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'class_participants'
          AND column_name = 'attendance_confirmed_at'
    ) THEN
        ALTER TABLE public.class_participants
        ADD COLUMN attendance_confirmed_at TIMESTAMP WITH TIME ZONE;

        RAISE NOTICE 'Column attendance_confirmed_at added successfully';
    ELSE
        RAISE NOTICE 'Column attendance_confirmed_at already exists';
    END IF;
END $$;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_class_participants_attendance_date
ON public.class_participants(attendance_confirmed_for_date)
WHERE attendance_confirmed_for_date IS NOT NULL;

-- Agregar comentarios para documentación
COMMENT ON COLUMN public.class_participants.attendance_confirmed_for_date IS 'Date for which the student confirmed attendance';
COMMENT ON COLUMN public.class_participants.attendance_confirmed_at IS 'Timestamp when the student confirmed attendance';

-- Verificar que las columnas se crearon correctamente
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'class_participants'
  AND column_name IN ('attendance_confirmed_for_date', 'attendance_confirmed_at');
