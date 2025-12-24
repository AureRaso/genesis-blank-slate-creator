-- =============================================
-- BIBLIOTECA DE EJERCICIOS PARA PADELOCK
-- Migración: Crear tabla ejercicios con RLS
-- =============================================

-- =============================================
-- TABLA PRINCIPAL: ejercicios
-- =============================================
CREATE TABLE IF NOT EXISTS public.ejercicios (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con club (privado por club)
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,

  -- Datos básicos
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Volea', 'Bandeja', 'Defensa', 'Táctica', 'Calentamiento', 'Remate', 'Saque')),
  nivel TEXT NOT NULL CHECK (nivel IN ('Iniciación', 'Intermedio', 'Avanzado')),
  duracion INTEGER NOT NULL CHECK (duracion > 0), -- en minutos
  jugadores INTEGER NOT NULL CHECK (jugadores BETWEEN 2 AND 4),
  intensidad TEXT NOT NULL CHECK (intensidad IN ('Baja', 'Media', 'Alta')),

  -- Descripción
  objetivo TEXT NOT NULL,
  descripcion TEXT,

  -- Etiquetas para búsqueda (array de textos)
  tags TEXT[] DEFAULT '{}',

  -- Posiciones de jugadores en la pista (JSON)
  -- Ejemplo: [{"x": 25, "y": 25, "label": "A", "color": "#10B981"}]
  posiciones JSONB DEFAULT '[]',

  -- Movimientos/trayectorias de bola (JSON)
  -- Ejemplo: [{"from": {"x": 25, "y": 25}, "to": {"x": 75, "y": 75}, "type": "bola"}]
  movimientos JSONB DEFAULT '[]',

  -- Creador del ejercicio
  created_by UUID REFERENCES auth.users(id),

  -- Metadatos
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Búsqueda por club (el más importante)
CREATE INDEX IF NOT EXISTS idx_ejercicios_club ON public.ejercicios(club_id);

-- Búsqueda por club + categoría (filtros combinados)
CREATE INDEX IF NOT EXISTS idx_ejercicios_club_categoria ON public.ejercicios(club_id, categoria);

-- Búsqueda por club + nivel
CREATE INDEX IF NOT EXISTS idx_ejercicios_club_nivel ON public.ejercicios(club_id, nivel);

-- Búsqueda por intensidad
CREATE INDEX IF NOT EXISTS idx_ejercicios_intensidad ON public.ejercicios(intensidad);

-- Búsqueda por número de jugadores
CREATE INDEX IF NOT EXISTS idx_ejercicios_jugadores ON public.ejercicios(jugadores);

-- Búsqueda por tags (índice GIN para arrays)
CREATE INDEX IF NOT EXISTS idx_ejercicios_tags ON public.ejercicios USING GIN(tags);

-- Solo ejercicios activos por club
CREATE INDEX IF NOT EXISTS idx_ejercicios_club_activos ON public.ejercicios(club_id, activo) WHERE activo = true;

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_ejercicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
DROP TRIGGER IF EXISTS trigger_ejercicios_updated_at ON public.ejercicios;
CREATE TRIGGER trigger_ejercicios_updated_at
  BEFORE UPDATE ON public.ejercicios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ejercicios_updated_at();

-- =============================================
-- HABILITAR RLS
-- =============================================
ALTER TABLE public.ejercicios ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- 1. Admin y Trainer del club pueden ver ejercicios de su club
CREATE POLICY "Club members can view exercises"
  ON public.ejercicios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.club_id = ejercicios.club_id
        AND p.role IN ('owner', 'admin', 'trainer')
    )
  );

-- 2. Admin y Trainer del club pueden crear ejercicios
CREATE POLICY "Club admins and trainers can create exercises"
  ON public.ejercicios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.club_id = ejercicios.club_id
        AND p.role IN ('owner', 'admin', 'trainer')
    )
  );

-- 3. Admin y Trainer del club pueden editar ejercicios
CREATE POLICY "Club admins and trainers can update exercises"
  ON public.ejercicios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.club_id = ejercicios.club_id
        AND p.role IN ('owner', 'admin', 'trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.club_id = ejercicios.club_id
        AND p.role IN ('owner', 'admin', 'trainer')
    )
  );

-- 4. Solo Admin puede eliminar ejercicios
CREATE POLICY "Only club admins can delete exercises"
  ON public.ejercicios
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.club_id = ejercicios.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- =============================================
-- COMENTARIO DE LA TABLA
-- =============================================
COMMENT ON TABLE public.ejercicios IS 'Biblioteca de ejercicios de pádel por club. RLS: admin/trainer pueden ver y editar, solo admin puede eliminar.';
