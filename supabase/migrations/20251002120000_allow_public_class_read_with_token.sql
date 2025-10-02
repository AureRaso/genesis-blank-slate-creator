-- Permitir lectura pública de programmed_classes cuando existe un token de inscripción válido
CREATE POLICY "Allow public read of classes with valid enrollment token"
ON public.programmed_classes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollment_tokens
    WHERE enrollment_tokens.class_id = programmed_classes.id
      AND enrollment_tokens.is_active = true
      AND enrollment_tokens.expires_at > now()
  )
);
