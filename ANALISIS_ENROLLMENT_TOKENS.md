# Análisis de la tabla `enrollment_tokens` - 32,000 registros

## ¿Qué es esta tabla?

La tabla `enrollment_tokens` almacena **tokens de inscripción temporales** para permitir que usuarios se inscriban en clases mediante enlaces únicos enviados por WhatsApp.

## ¿Para qué sirve?

**Sistema de lista de espera y notificaciones:**
Cuando hay plazas disponibles en una clase (ya sea una clase nueva o cuando alguien cancela), el sistema:
1. Crea un token único de inscripción
2. Envía un mensaje de WhatsApp al grupo con un enlace único
3. El enlace es válido por 24 horas
4. Los usuarios pueden inscribirse sin necesidad de login

## Estructura de la tabla

```sql
enrollment_tokens:
- id: UUID (PK)
- token: UUID (único)
- class_id: UUID (FK a programmed_classes)
- available_spots: INTEGER (plazas disponibles)
- expires_at: TIMESTAMP (expira en 24h)
- used_count: INTEGER (cuántas veces se usó)
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMP
```

## ¿Cómo se crean tantos tokens?

### 1. Trigger automático: `on_new_programmed_class`

**Ubicación:** `20250814153356_d077f0c3-91a2-4271-aa34-cf63809e1778.sql` (líneas 89-92)

```sql
CREATE TRIGGER on_new_programmed_class
AFTER INSERT ON public.programmed_classes
FOR EACH ROW
EXECUTE FUNCTION notify_new_class();
```

**Esto significa:** Cada vez que se crea una clase programada, se dispara automáticamente.

**Función que ejecuta:** `notify_new_class()` (líneas 68-86)
- Llama a la Edge Function `notify-waitlist`
- La función crea un token de inscripción
- Envía mensaje de WhatsApp con enlace

### 2. Trigger automático: `on_participant_status_changed`

**Ubicación:** `20250814153356_d077f0c3-91a2-4271-aa34-cf63809e1778.sql` (líneas 62-65)

```sql
CREATE TRIGGER on_participant_status_changed
AFTER UPDATE ON public.class_participants
FOR EACH ROW
EXECUTE FUNCTION notify_available_spot();
```

**Esto significa:** Cada vez que un participante cambia de estado (ej: se da de baja), se dispara automáticamente.

**Función que ejecuta:** `notify_available_spot()` (líneas 44-59)
- Detecta cuando alguien se da de baja
- Llama a `detect-available-spots` Edge Function
- Que a su vez puede llamar a `notify-waitlist`
- Que crea otro token

## ¿Por qué hay 32,000 registros?

### Posibles causas:

1. **Creación masiva de clases**
   - Si se usó la creación masiva de clases, cada clase nueva crea 1 token
   - 32,000 tokens = ~32,000 clases creadas

2. **Triggers en loop infinito (poco probable pero posible)**
   - Si hubo un bug, los triggers pueden haberse ejecutado recursivamente
   - Verificar logs de Supabase Edge Functions

3. **Tokens no se limpian automáticamente**
   - Los tokens expirados se quedan en la base de datos
   - No hay proceso de limpieza automática (cron job)

4. **Pruebas/desarrollo**
   - Si se crearon y borraron clases repetidamente en desarrollo
   - Los tokens se quedan aunque la clase se elimine

## Problemas potenciales:

### 1. **Uso de base de datos**
- 32,000 filas ocupan espacio innecesario
- Puede afectar performance de queries

### 2. **Costos**
- Supabase cobra por almacenamiento
- Edge Functions se ejecutaron 32,000 veces (pueden tener costo)
- Mensajes de WhatsApp (UltraMsg) cobrados si se enviaron

### 3. **Spam de WhatsApp**
- Si los triggers funcionaron correctamente, se enviaron miles de mensajes
- Posible bloqueo de cuenta de UltraMsg

## Soluciones recomendadas:

### 1. **Limpieza inmediata de tokens expirados**

```sql
-- Eliminar tokens expirados
DELETE FROM enrollment_tokens
WHERE expires_at < NOW();

-- Eliminar tokens inactivos y no usados
DELETE FROM enrollment_tokens
WHERE is_active = false AND used_count = 0;

-- Eliminar tokens de clases que ya no existen
DELETE FROM enrollment_tokens
WHERE class_id NOT IN (SELECT id FROM programmed_classes);
```

### 2. **Deshabilitar triggers temporalmente**

Si no estás usando este sistema de notificaciones:

```sql
-- Deshabilitar triggers
DROP TRIGGER IF EXISTS on_new_programmed_class ON public.programmed_classes;
DROP TRIGGER IF EXISTS on_participant_status_changed ON public.class_participants;
```

### 3. **Agregar proceso de limpieza automática**

Crear una Edge Function que se ejecute diariamente:

```sql
-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM enrollment_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

Y configurar un cron job en Supabase para ejecutarla diariamente.

### 4. **Agregar condiciones a los triggers**

Modificar los triggers para que solo se ejecuten en producción o con ciertas condiciones:

```sql
-- Solo notificar si hay alguien en lista de espera
CREATE OR REPLACE FUNCTION notify_new_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si la clase está activa Y tiene lista de espera
  IF NEW.is_active = true AND EXISTS (
    SELECT 1 FROM class_waitlist WHERE class_id = NEW.id
  ) THEN
    PERFORM net.http_post(...);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Investigación necesaria:

Ejecutar el archivo `investigate_enrollment_tokens.sql` para obtener:
1. Cuántos tokens están expirados
2. Cuántos tokens nunca se usaron
3. Distribución de tokens por clase
4. Tokens huérfanos (clases eliminadas)
5. Espacio total ocupado

## Decisión requerida:

¿Quieres que:
1. Limpie los tokens expirados? ✅
2. Deshabilite los triggers automáticos? ⚠️
3. Cree un proceso de limpieza automática? ✅
4. Investigue más a fondo la causa raíz? 🔍
