# Instrucciones: Actualizar is_open a false por defecto

## Contexto

Por defecto, todas las clases programadas deben tener `is_open = false`. Solo se puede cambiar a `true` cuando hay plazas disponibles (número de participantes activos < max_participants).

## Cambios Implementados

### 1. **Script SQL** ([actualizar_is_open_false.sql](actualizar_is_open_false.sql))
Actualiza todas las clases existentes para que `is_open = false`.

### 2. **ScheduledClassForm.tsx**
- Default de `is_open` cambiado de `true` a `false`
- Validación en tiempo real de plazas disponibles
- Switch deshabilitado cuando no hay plazas
- Mensajes informativos sobre plazas disponibles

### 3. **EditClassModal.tsx**
- Default de `is_open` cambiado de `true` a `false`
- Consulta participantes activos de la clase
- Validación para prevenir abrir clase sin plazas
- Mensajes de advertencia cuando clase está completa

## Pasos para Aplicar en Producción

### Paso 1: Aplicar Migración de is_open (Si no lo has hecho)

```sql
-- En Supabase Dashboard → SQL Editor
ALTER TABLE programmed_classes
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN programmed_classes.is_open IS 'Controls if the class is visible in "Clases Disponibles" for players to book';

CREATE INDEX IF NOT EXISTS idx_programmed_classes_is_open
ON programmed_classes(is_open)
WHERE is_open = true AND is_active = true;
```

### Paso 2: Actualizar Clases Existentes

```sql
-- Ejecutar el script actualizar_is_open_false.sql
-- En Supabase Dashboard → SQL Editor

-- 1. Ver estado actual
SELECT
  id,
  name,
  is_open,
  is_active,
  max_participants,
  (SELECT COUNT(*)
   FROM class_participants cp
   WHERE cp.class_id = pc.id AND cp.status = 'active') as active_participants
FROM programmed_classes pc
WHERE is_active = true
ORDER BY created_at DESC;

-- 2. Actualizar todas a is_open = false
UPDATE programmed_classes
SET is_open = false
WHERE is_open IS NULL OR is_open = true;

-- 3. Verificar resultado
SELECT
  COUNT(*) as total_clases,
  SUM(CASE WHEN is_open = false THEN 1 ELSE 0 END) as clases_cerradas,
  SUM(CASE WHEN is_open = true THEN 1 ELSE 0 END) as clases_abiertas
FROM programmed_classes
WHERE is_active = true;
```

### Paso 3: Desplegar Código

Los cambios en el código ya están implementados:
- ✅ Validación en formulario de creación
- ✅ Validación en modal de edición
- ✅ Default `is_open = false` en ambos

## Comportamiento Esperado

### Al Crear Nueva Clase
1. El switch "Clase Abierta para Reservas" está **desactivado** por defecto
2. Si hay plazas disponibles (participantes < max_participants):
   - Switch habilitado
   - Puede activarse manualmente
   - Muestra: "X plazas disponibles"
3. Si NO hay plazas disponibles:
   - Switch deshabilitado
   - No se puede activar
   - Muestra: "⚠️ No hay plazas disponibles (X/Y ocupadas)"

### Al Editar Clase Existente
1. Calcula participantes activos en tiempo real
2. Valida plazas disponibles
3. Si intentas abrir clase sin plazas:
   - Muestra toast de error
   - No permite el cambio
   - Mensaje: "No se puede abrir la clase. La clase está completa."

### En "Clases Disponibles" (Jugadores)
- Solo aparecen clases con `is_open = true` Y `is_active = true`
- Filtradas por club del jugador
- Ordenadas por horario

## Verificación

### 1. Verificar Clases en Base de Datos
```sql
-- Ver todas las clases y su estado
SELECT
  name,
  is_open,
  is_active,
  max_participants,
  (SELECT COUNT(*) FROM class_participants cp
   WHERE cp.class_id = pc.id AND cp.status = 'active') as participants,
  club_id
FROM programmed_classes pc
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Probar Flujo Completo

**Como Admin/Profesor:**
1. Crear nueva clase → Verificar que `is_open = false` por defecto
2. Agregar estudiantes hasta llenar max_participants
3. Intentar activar "Clase Abierta" → Debe estar deshabilitado
4. Editar clase existente con plazas → Debe permitir activar switch
5. Editar clase existente sin plazas → Switch deshabilitado

**Como Jugador:**
1. Ir a "Clases Disponibles"
2. Solo deben aparecer clases con `is_open = true`
3. Deben ser solo del club del jugador

## Rollback (En caso de problemas)

Si necesitas revertir los cambios:

```sql
-- Volver todas las clases a is_open = true
UPDATE programmed_classes
SET is_open = true
WHERE is_active = true;
```

Y revertir los cambios de código:
- Cambiar `default(false)` a `default(true)` en ScheduledClassForm.tsx línea 62
- Cambiar `is_open ?? false` a `is_open ?? true` en EditClassModal.tsx línea 62

## Notas Importantes

⚠️ **IMPORTANTE**:
- Las clases existentes NO aparecerán en "Clases Disponibles" hasta que un admin/profesor las marque como abiertas manualmente
- Esto es intencional para evitar que clases antiguas o no preparadas aparezcan automáticamente
- Cada clase debe ser revisada individualmente antes de abrirse al público

✅ **Recomendación**:
- Comunicar a los admins/profesores que revisen sus clases
- Solo abrir las clases que realmente tienen plazas disponibles
- Verificar max_participants antes de abrir cada clase
