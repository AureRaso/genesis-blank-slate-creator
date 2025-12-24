-- =============================================
-- AÑADIR CAMPOS DE VIDEO A EJERCICIOS
-- Integración con Bunny.net Stream
-- =============================================

-- Añadir columnas de video a la tabla ejercicios
ALTER TABLE public.ejercicios
ADD COLUMN IF NOT EXISTS video_id TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS video_status TEXT DEFAULT 'none' CHECK (video_status IN ('none', 'uploading', 'processing', 'ready', 'error'));

-- Índice para búsquedas por video_id
CREATE INDEX IF NOT EXISTS idx_ejercicios_video_id ON public.ejercicios(video_id) WHERE video_id IS NOT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN public.ejercicios.video_id IS 'ID del video en Bunny Stream';
COMMENT ON COLUMN public.ejercicios.video_url IS 'URL de reproducción del video (CDN de Bunny)';
COMMENT ON COLUMN public.ejercicios.video_thumbnail IS 'URL del thumbnail del video';
COMMENT ON COLUMN public.ejercicios.video_status IS 'Estado del video: none, uploading, processing, ready, error';
