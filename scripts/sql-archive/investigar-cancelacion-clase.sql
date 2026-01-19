-- =====================================================
-- INVESTIGAR QUIÉN CANCELÓ LA CLASE Y POR QUÉ NO SE ENVIARON MENSAJES
-- Clase ID: db1ddcc3-ab6b-49fa-9f07-41e11f5e8019
-- Fecha de actualización: 2026-01-11 18:31:45
-- =====================================================

-- 1. VER SI HAY TABLA DE AUDIT LOGS
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%audit%' OR table_name LIKE '%log%';

-- 2. BUSCAR LOGS DE WHATSAPP ENVIADOS PARA ESTA CLASE
SELECT *
FROM whatsapp_message_logs
WHERE programmed_class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019'
ORDER BY created_at DESC;

-- 3. BUSCAR CUALQUIER MENSAJE DE WHATSAPP DEL 11 DE ENERO (día que se canceló)
SELECT *
FROM whatsapp_message_logs
WHERE created_at >= '2026-01-11 00:00:00'
AND created_at < '2026-01-12 00:00:00'
ORDER BY created_at DESC;

-- 4. VER PARTICIPANTES QUE ESTABAN EN LA CLASE (a quiénes se debió notificar)
SELECT
    cp.id,
    cp.student_id,
    cp.status,
    cp.created_at,
    se.full_name as alumno_nombre,
    se.phone as alumno_telefono,
    se.guardian_phone
FROM class_participants cp
LEFT JOIN student_enrollments se ON cp.student_id = se.id
WHERE cp.programmed_class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 5. VER TODAS LAS TABLAS QUE CONTIENEN "log" o "audit"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 6. BUSCAR EN whatsapp_notifications SI EXISTE
SELECT *
FROM whatsapp_notifications
WHERE class_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019'
ORDER BY created_at DESC;

-- 7. VER HISTORIAL DE CAMBIOS SI HAY TRIGGER DE AUDITORÍA
SELECT *
FROM audit_log
WHERE table_name = 'programmed_classes'
AND record_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019'
ORDER BY created_at DESC;
