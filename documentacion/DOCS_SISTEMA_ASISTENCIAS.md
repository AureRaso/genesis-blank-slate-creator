# Sistema de Asistencias y Ausencias

## Índice
1. [Introducción](#introducción)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Flujo de Trabajo - Jugadores](#flujo-de-trabajo---jugadores)
4. [Flujo de Trabajo - Profesores/Administradores](#flujo-de-trabajo---profesoresadministradores)
5. [Hooks y Componentes](#hooks-y-componentes)
6. [Sistema de Historial](#sistema-de-historial)
7. [Casos de Uso Comunes](#casos-de-uso-comunes)
8. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de asistencias y ausencias permite gestionar la asistencia de los jugadores a las clases programadas. Tiene dos niveles de tracking:

1. **Nivel de inscripción** (`class_participants`): Estado general de la inscripción del jugador a la clase
2. **Nivel de sesión** (`class_attendance_confirmations`): Confirmaciones específicas para cada fecha de clase

---

## Arquitectura de Base de Datos

### Tabla: `class_participants`

**Propósito**: Representa la inscripción de un jugador a una clase programada.

**Campos clave para asistencia/ausencia**:
```sql
- id: UUID (Primary Key)
- class_id: UUID (Foreign Key a programmed_classes)
- student_enrollment_id: UUID (Foreign Key a student_enrollments)
- status: TEXT ('active', 'inactive', 'waitlist')
- is_substitute: BOOLEAN (si es suplente)

-- Campos de ausencia
- absence_confirmed: BOOLEAN
- absence_reason: TEXT
- absence_confirmed_at: TIMESTAMPTZ
- absence_locked: BOOLEAN (bloqueado tras notificación WhatsApp)

-- Campos de asistencia
- attendance_confirmed_for_date: DATE
- attendance_confirmed_at: TIMESTAMPTZ
- confirmed_by_trainer: BOOLEAN
```

**Uso**:
- Se crea UN registro por cada inscripción jugador-clase
- `absence_confirmed = true`: El jugador ha marcado ausencia (actualizado tanto por jugador como por profesor)
- `absence_locked = true`: El profesor notificó la ausencia por WhatsApp y el jugador no puede cambiarla
- Se actualiza cuando jugador o profesor marcan ausencia/asistencia

---

### Tabla: `class_attendance_confirmations`

**Propósito**: Registros independientes de asistencia/ausencia para cada sesión específica de una clase.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- class_participant_id: UUID (Foreign Key a class_participants)
- scheduled_date: DATE (fecha específica de la clase)

-- Confirmación de asistencia
- attendance_confirmed: BOOLEAN
- attendance_confirmed_at: TIMESTAMPTZ

-- Confirmación de ausencia
- absence_confirmed: BOOLEAN
- absence_reason: TEXT
- absence_confirmed_at: TIMESTAMPTZ
- absence_locked: BOOLEAN

-- Metadata
- confirmed_by_trainer: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Uso**:
- Se crea/actualiza UN registro por cada combinación jugador-clase-fecha
- Constraint único: `(class_participant_id, scheduled_date)`
- Permite tracking histórico de asistencia por fecha
- Se usa con `upsert` para crear o actualizar según sea necesario

---

### Tabla: `attendance_history`

**Propósito**: Auditoría automática de todos los cambios en asistencia/ausencia.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- class_participant_id: UUID (Foreign Key a class_participants)
- scheduled_date: DATE
- action_type: TEXT ('marked_present', 'marked_absent', 'cancelled_absence', 'confirmed_attendance')

-- Quién hizo el cambio
- changed_by: UUID (Foreign Key a profiles)
- changed_by_role: TEXT ('player', 'trainer', 'admin', 'system')

-- Estado anterior
- previous_attendance_confirmed: BOOLEAN
- previous_absence_confirmed: BOOLEAN
- previous_absence_reason: TEXT

-- Estado nuevo
- new_attendance_confirmed: BOOLEAN
- new_absence_confirmed: BOOLEAN
- new_absence_reason: TEXT

-- Metadata
- created_at: TIMESTAMPTZ
- notes: TEXT
```

**Uso**:
- Se actualiza AUTOMÁTICAMENTE mediante trigger
- Trigger: `trigger_log_attendance_change` en tabla `class_participants`
- Registra todos los cambios de asistencia/ausencia
- Útil para auditoría y resolución de conflictos

---

## Flujo de Trabajo - Jugadores

### Vista del Jugador

**Componente**: `TodayClassesConfirmation.tsx`

**Panel**: "Mis Clases" (accesible desde el dashboard del jugador)

### Acciones Disponibles

#### 1. Marcar Ausencia ("NO VOY")

**Flujo**:
```
1. Jugador hace clic en toggle "NO VOY"
2. Se muestra dropdown de motivos de ausencia
3. Jugador selecciona motivo (opcional):
   - 🤕 Lesión
   - 💼 Trabajo
   - 🏥 Enfermedad
   - 👨‍👩‍👧 Motivos familiares
   - ✏️ Otro motivo (campo de texto libre)
4. Jugador hace clic en "Guardar"
5. Se ejecuta hook: useConfirmAbsence()
```

**Hook**: `useConfirmAbsence()` (archivo: `src/hooks/useAttendanceConfirmations.ts`)

**Operaciones**:
```javascript
// 1. Actualizar class_participants
UPDATE class_participants SET
  absence_confirmed = true,
  absence_reason = reason || 'Marcado por jugador',
  absence_confirmed_at = NOW(),
  attendance_confirmed_for_date = NULL,
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = false
WHERE id = classParticipantId;

// 2. Crear/actualizar registro en class_attendance_confirmations
UPSERT INTO class_attendance_confirmations
  (class_participant_id, scheduled_date, absence_confirmed, absence_reason, ...)
VALUES
  (classParticipantId, scheduledDate, true, reason, ...)
ON CONFLICT (class_participant_id, scheduled_date)
DO UPDATE SET ...;
```

**Resultado**:
- ✅ `class_participants.absence_confirmed = true`
- ✅ `class_attendance_confirmations` tiene registro con `absence_confirmed = true`
- ✅ Trigger crea registro en `attendance_history`
- ✅ UI muestra badge "No asistiré" con motivo
- ✅ Profesor ve la ausencia en panel de asistencia

---

#### 2. Cancelar Ausencia ("VOY")

**Flujo**:
```
1. Jugador hace clic en toggle "VOY"
2. Sistema verifica si ausencia está bloqueada (absence_locked)
3. Si no está bloqueada, se ejecuta hook: useCancelAbsence()
4. Se confirma asistencia automáticamente
```

**Hook**: `useCancelAbsence()` (archivo: `src/hooks/useAttendanceConfirmations.ts`)

**Operaciones**:
```javascript
// 1. Verificar si está bloqueado
SELECT absence_locked FROM class_attendance_confirmations
WHERE class_participant_id = classParticipantId
  AND scheduled_date = scheduledDate;

// Si absence_locked = true, lanzar error
// Si no está bloqueado:

// 2. Actualizar class_participants
UPDATE class_participants SET
  absence_confirmed = false,
  absence_reason = NULL,
  absence_confirmed_at = NULL
WHERE id = classParticipantId;

// 3. Actualizar class_attendance_confirmations
UPDATE class_attendance_confirmations SET
  absence_confirmed = false,
  absence_reason = NULL,
  absence_confirmed_at = NULL
WHERE class_participant_id = classParticipantId
  AND scheduled_date = scheduledDate;

// 4. Confirmar asistencia (automático)
CALL useConfirmAttendance();
```

**Resultado**:
- ✅ `class_participants.absence_confirmed = false`
- ✅ `class_attendance_confirmations.absence_confirmed = false`
- ✅ `class_attendance_confirmations.attendance_confirmed = true`
- ✅ Trigger crea registro en `attendance_history`
- ✅ UI muestra badge "Asistiré"

---

### Restricciones para Jugadores

#### Ausencia Bloqueada (absence_locked = true)

**Cuándo se bloquea**:
- El profesor notifica la ausencia por WhatsApp al grupo
- Se ejecuta función: "Notificar ausencia" desde panel de asistencia

**Efecto**:
- ❌ Jugador NO puede cambiar de "NO VOY" a "VOY"
- ⚠️ Se muestra mensaje: "No puedes cambiar tu ausencia porque el profesor ya notificó tu plaza disponible al grupo de WhatsApp"
- ✅ Jugador SÍ puede añadir/modificar el motivo de ausencia

**Razón**:
- Evitar que el jugador cancele su ausencia después de que se haya notificado al grupo
- Otros jugadores pueden haberse apuntado como suplentes

---

## Flujo de Trabajo - Profesores/Administradores

### Vista del Profesor

**Componentes**:
- `TodayAttendancePage.tsx` - Asistencia del día actual
- `WeekAttendancePage.tsx` - Asistencia de la semana

**Panel**: "Asistencia" (accesible desde menú lateral)

**Soporte Multi-Entrenador**: A partir de Diciembre 2025, las clases pueden tener hasta 2 entrenadores asignados. Ambos entrenadores ven la clase en su panel de asistencia y pueden gestionar la asistencia de los alumnos.

**Filtro de clases**:
- Los entrenadores ven clases donde son trainer principal (`trainer_profile_id`) O secundario (`trainer_profile_id_2`)
- Los administradores ven todas las clases del club y pueden filtrar por entrenador (incluyendo segundos entrenadores)

### Acciones Disponibles

#### 1. Marcar Asistencia

**Flujo**:
```
1. Profesor hace clic en checkbox de asistencia del jugador
2. Se ejecuta hook: useTrainerMarkAttendance()
```

**Hook**: `useTrainerMarkAttendance()` (archivo: `src/hooks/useTodayAttendance.ts`)

**Operaciones**:
```javascript
// 1. Actualizar class_participants
UPDATE class_participants SET
  attendance_confirmed_for_date = scheduledDate,
  attendance_confirmed_at = NOW(),
  confirmed_by_trainer = true,
  absence_confirmed = false,
  absence_reason = NULL,
  absence_confirmed_at = NULL
WHERE id = participantId;

// 2. Crear/actualizar registro en class_attendance_confirmations (para sincronizar con dashboard del jugador)
UPSERT INTO class_attendance_confirmations
  (class_participant_id, scheduled_date, attendance_confirmed, confirmed_by_trainer, absence_confirmed, ...)
VALUES
  (participantId, scheduledDate, true, true, false, ...)
ON CONFLICT (class_participant_id, scheduled_date)
DO UPDATE SET ...;
```

**Resultado**:
- ✅ `class_participants.attendance_confirmed_for_date = scheduledDate`
- ✅ `class_participants.confirmed_by_trainer = true`
- ✅ `class_attendance_confirmations` tiene registro con `attendance_confirmed = true`
- ✅ Limpia cualquier ausencia previa
- ✅ Trigger crea registro en `attendance_history`
- ✅ Dashboard del jugador se actualiza en tiempo real

---

#### 2. Marcar Ausencia

**Flujo**:
```
1. Profesor hace clic en checkbox de ausencia del jugador
2. Puede añadir motivo (opcional)
3. Se ejecuta hook: useTrainerMarkAbsence()
```

**Hook**: `useTrainerMarkAbsence()` (archivo: `src/hooks/useTodayAttendance.ts`)

**Operaciones**:
```javascript
// 1. Actualizar class_participants
UPDATE class_participants SET
  absence_confirmed = true,
  absence_reason = reason || 'Marcado por profesor',
  absence_confirmed_at = NOW(),
  attendance_confirmed_for_date = NULL,
  attendance_confirmed_at = NULL,
  confirmed_by_trainer = true
WHERE id = participantId;

// 2. Crear/actualizar registro en class_attendance_confirmations (para sincronizar con dashboard del jugador)
UPSERT INTO class_attendance_confirmations
  (class_participant_id, scheduled_date, absence_confirmed, absence_reason, confirmed_by_trainer, attendance_confirmed, ...)
VALUES
  (participantId, scheduledDate, true, reason, true, false, ...)
ON CONFLICT (class_participant_id, scheduled_date)
DO UPDATE SET ...;
```

**Resultado**:
- ✅ `class_participants.absence_confirmed = true`
- ✅ `class_participants.confirmed_by_trainer = true`
- ✅ `class_attendance_confirmations` tiene registro con `absence_confirmed = true`
- ✅ Limpia cualquier confirmación de asistencia previa
- ✅ Trigger crea registro en `attendance_history`
- ✅ Dashboard del jugador se actualiza en tiempo real

---

#### 3. Notificar Ausencia por WhatsApp

**Contexto**: Cuando hay ausencias en una clase, el profesor puede notificar al grupo de WhatsApp para buscar suplentes.

**Flujo**:
```
1. Profesor ve clase con ausencias en WeekAttendancePage
2. Hace clic en botón "Notificar ausencia"
3. Se genera mensaje de WhatsApp con:
   - Fecha y hora de la clase
   - Número de plazas disponibles
   - Botón para apuntarse como suplente
4. Se ejecuta: lockAbsentParticipants()
```

**Condición para mostrar botón**:
```javascript
// En WeekAttendancePage.tsx
const absentCount = validParticipants.filter(p => {
  const confirmationKey = `${p.id}-${notificationDate}`;
  const confirmation = confirmationsMap.get(confirmationKey);
  return confirmation
    ? confirmation.absence_confirmed
    : (p.absence_confirmed || false);
}).length;

// Botón visible si: absentCount > 0
```

**Operación de bloqueo**:
```javascript
// Para cada ausente
UPDATE class_participants SET
  absence_locked = true
WHERE id = participantId
  AND absence_confirmed = true;

// También en class_attendance_confirmations
UPDATE class_attendance_confirmations SET
  absence_locked = true
WHERE class_participant_id = participantId
  AND scheduled_date = scheduledDate
  AND absence_confirmed = true;
```

**Resultado**:
- ✅ Ausencias quedan bloqueadas (`absence_locked = true`)
- ✅ Jugadores NO pueden cambiar a "VOY"
- ✅ Se envía mensaje de WhatsApp al grupo
- ✅ Otros jugadores pueden apuntarse como suplentes

---

## Hooks y Componentes

### Hooks de Jugadores

**Archivo**: `src/hooks/useAttendanceConfirmations.ts`

| Hook | Propósito | Actualiza |
|------|-----------|-----------|
| `useConfirmAttendance()` | Confirmar asistencia | `class_attendance_confirmations` |
| `useCancelAttendanceConfirmation()` | Cancelar asistencia | `class_attendance_confirmations` |
| `useConfirmAbsence()` | Confirmar ausencia | `class_participants` + `class_attendance_confirmations` |
| `useCancelAbsence()` | Cancelar ausencia | `class_participants` + `class_attendance_confirmations` |

---

### Hooks de Profesores

**Archivo**: `src/hooks/useTodayAttendance.ts`

| Hook | Propósito | Actualiza |
|------|-----------|-----------|
| `useTrainerMarkAttendance()` | Marcar asistencia | `class_participants` + `class_attendance_confirmations` |
| `useTrainerMarkAbsence()` | Marcar ausencia | `class_participants` + `class_attendance_confirmations` |
| `useTodayAttendance()` | Obtener asistencia del día | Query |

**IMPORTANTE**: A partir de 2025-12-10, los hooks de profesor actualizan AMBAS tablas para garantizar sincronización con el dashboard del jugador.

---

### Componentes Principales

| Componente | Usuario | Funcionalidad |
|------------|---------|---------------|
| `TodayClassesConfirmation.tsx` | Jugador | Ver próximas clases, marcar ausencia/asistencia. Muestra ambos entrenadores si hay 2 asignados. |
| `TodayAttendancePage.tsx` | Profesor/Admin | Gestionar asistencia del día actual. Filtro por entrenador para admins. |
| `WeekAttendancePage.tsx` | Profesor/Admin | Gestionar asistencia de la semana, notificar ausencias. Filtro por entrenador para admins. |
| `AttendanceToggle.tsx` | Ambos | Toggle VOY/NO VOY |

---

## Sistema de Historial

### Trigger Automático

**Tabla monitoreada**: `class_participants`

**Trigger**: `trigger_log_attendance_change`

**Función**: `log_attendance_change()`

**Archivo**: `supabase/migrations/20251204_create_attendance_history.sql`

### ¿Cuándo se registra?

El trigger se ejecuta en CADA `UPDATE` de `class_participants` si cambian estos campos:
- `attendance_confirmed_for_date`
- `absence_confirmed`
- `absence_reason`

### Información registrada

```sql
INSERT INTO attendance_history (
  class_participant_id,
  scheduled_date,
  action_type,           -- 'marked_absent', 'marked_present', etc.
  changed_by,            -- UUID del usuario que hizo el cambio
  changed_by_role,       -- 'player', 'trainer', 'admin'
  previous_attendance_confirmed,
  previous_absence_confirmed,
  previous_absence_reason,
  new_attendance_confirmed,
  new_absence_confirmed,
  new_absence_reason
) VALUES (...);
```

### Consultar Historial

**Query de ejemplo** (ver archivo: `get-rocio-attendance-history.sql`):

```sql
SELECT
  ah.scheduled_date,
  ah.action_type,
  ah.changed_by_role,
  ah.previous_absence_confirmed,
  ah.new_absence_confirmed,
  ah.created_at,
  p.full_name as changed_by_name,
  se.full_name as student_name
FROM attendance_history ah
JOIN class_participants cp ON ah.class_participant_id = cp.id
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN profiles p ON ah.changed_by = p.id
WHERE se.id = 'STUDENT_ENROLLMENT_ID'
  AND cp.class_id = 'CLASS_ID'
ORDER BY ah.created_at DESC;
```

---

## Casos de Uso Comunes

### Caso 1: Jugador marca ausencia

**Escenario**: María no puede ir a la clase del jueves porque tiene trabajo.

**Pasos**:
1. María accede a "Mis Clases"
2. Ve la clase del jueves con toggle en "VOY"
3. Hace clic en "NO VOY"
4. Selecciona motivo: "💼 Trabajo"
5. Hace clic en "Guardar"

**Resultado**:
- `class_participants.absence_confirmed = true`
- `class_participants.absence_reason = "trabajo"`
- `class_attendance_confirmations` tiene registro de ausencia para el jueves
- `attendance_history` registra: "Maria marcó ausencia por trabajo"
- Profesor ve la ausencia en panel de asistencia

---

### Caso 2: Profesor notifica ausencia

**Escenario**: Hay 2 ausencias para la clase del viernes. El profesor quiere buscar suplentes.

**Pasos**:
1. Profesor accede a "Asistencia > Semana"
2. Ve la clase del viernes con 2 ausencias
3. Hace clic en "Notificar ausencia"
4. Se genera mensaje de WhatsApp con 2 plazas disponibles
5. Sistema bloquea las ausencias

**Resultado**:
- `class_participants.absence_locked = true` (para los 2 ausentes)
- `class_attendance_confirmations.absence_locked = true`
- Mensaje enviado al grupo de WhatsApp
- Los 2 jugadores ausentes NO pueden cambiar a "VOY"

---

### Caso 3: Jugador intenta cancelar ausencia bloqueada

**Escenario**: Pedro marcó ausencia y el profesor ya notificó al grupo. Pedro cambia de opinión.

**Pasos**:
1. Pedro accede a "Mis Clases"
2. Ve su clase con "NO VOY" y motivo
3. Intenta cambiar a "VOY"

**Resultado**:
- ❌ Hook `useCancelAbsence()` detecta `absence_locked = true`
- ⚠️ Se muestra error: "No puedes cambiar tu ausencia porque el profesor ya notificó tu plaza disponible al grupo de WhatsApp"
- Toggle permanece en "NO VOY"
- Pedro debe contactar al profesor directamente

---

### Caso 4: Profesor marca asistencia manualmente

**Escenario**: Ana olvidó confirmar su asistencia en la app. El profesor la ve en clase y la marca presente.

**Pasos**:
1. Profesor accede a "Asistencia > Hoy"
2. Ve la clase con Ana sin confirmar
3. Hace clic en checkbox de asistencia de Ana

**Resultado**:
- `class_participants.attendance_confirmed_for_date = TODAY`
- `class_participants.confirmed_by_trainer = true`
- `attendance_history` registra: "Profesor confirmó asistencia de Ana"
- Ana ve en su app que su asistencia fue confirmada

---

## Troubleshooting

### Problema 1: Jugador marcó ausencia pero no aparece en panel del profesor

**Síntomas**:
- Jugador ve "NO VOY" en su panel
- Profesor NO ve ausencia en panel de asistencia

**Diagnóstico**:
```sql
-- Verificar registro en class_participants
SELECT absence_confirmed, absence_reason
FROM class_participants
WHERE id = 'PARTICIPANT_ID';

-- Verificar registro en class_attendance_confirmations
SELECT absence_confirmed, absence_reason, scheduled_date
FROM class_attendance_confirmations
WHERE class_participant_id = 'PARTICIPANT_ID'
  AND scheduled_date = 'DATE';
```

**Causas posibles**:
1. Hook `useConfirmAbsence()` falló en actualizar `class_participants`
2. Cache no se invalidó correctamente
3. Profesor está viendo fecha diferente

**Solución**:
1. Verificar logs de consola en navegador del jugador
2. Refrescar página del profesor (Ctrl+R)
3. Si persiste, ejecutar manualmente:
   ```sql
   UPDATE class_participants SET
     absence_confirmed = true,
     absence_reason = 'REASON'
   WHERE id = 'PARTICIPANT_ID';
   ```

---

### Problema 2: Botón "Notificar ausencia" no aparece

**Síntomas**:
- Hay ausencias confirmadas en la clase
- Botón "Notificar ausencia" NO aparece

**Diagnóstico**:
```sql
-- Verificar que hay ausencias
SELECT
  cp.id,
  se.full_name,
  cp.absence_confirmed
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE cp.class_id = 'CLASS_ID'
  AND cp.absence_confirmed = true;
```

**Causas posibles**:
1. `absentCount` calculado incorrectamente
2. `confirmationsMap` está vacío
3. Condición del botón evalúa incorrectamente

**Solución**:
1. Verificar logs de consola: buscar "🔍 DEBUG - Clase:"
2. Verificar que `absentCount > 0`
3. Revisar código en `WeekAttendancePage.tsx` línea 1274

---

### Problema 3: Historial no registra cambios

**Síntomas**:
- Jugador/profesor marca ausencia o asistencia
- NO aparece registro en `attendance_history`

**Diagnóstico**:
```sql
-- Verificar que trigger existe
SELECT * FROM pg_trigger
WHERE tgname = 'trigger_log_attendance_change';

-- Verificar que función existe
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'log_attendance_change';

-- Ver últimos registros de historial
SELECT * FROM attendance_history
ORDER BY created_at DESC
LIMIT 10;
```

**Causas posibles**:
1. Trigger no se creó (migración falló)
2. Función tiene error de sintaxis
3. RLS policy bloquea inserción

**Solución**:
1. Aplicar migración manualmente:
   ```bash
   npx supabase db push
   ```
2. Verificar que migración `20251204_create_attendance_history.sql` se aplicó
3. Revisar logs de Supabase para errores del trigger

---

### Problema 4: Datos inconsistentes entre tablas

**Síntomas**:
- `class_participants.absence_confirmed = false`
- `class_attendance_confirmations.absence_confirmed = true`

**Diagnóstico**:
```sql
-- Comparar ambas tablas para una fecha específica
SELECT
  cp.id as participant_id,
  cp.absence_confirmed as cp_absence,
  ac.absence_confirmed as ac_absence,
  ac.scheduled_date
FROM class_participants cp
LEFT JOIN class_attendance_confirmations ac
  ON cp.id = ac.class_participant_id
WHERE cp.id = 'PARTICIPANT_ID';
```

**Causas posibles**:
1. Hook falló a mitad de operación (actualizó una tabla pero no la otra)
2. Operación manual solo actualizó una tabla
3. Error de red interrumpió la transacción

**Solución**:
1. Decidir qué tabla tiene la versión correcta
2. Sincronizar manualmente:
   ```sql
   -- Si class_attendance_confirmations es correcto:
   UPDATE class_participants cp SET
     absence_confirmed = ac.absence_confirmed,
     absence_reason = ac.absence_reason
   FROM class_attendance_confirmations ac
   WHERE cp.id = ac.class_participant_id
     AND cp.id = 'PARTICIPANT_ID';
   ```

---

## Archivos de Referencia

### Migraciones
- `supabase/migrations/20251203000003_recreate_attendance_records_table.sql` - Crea `class_attendance_confirmations`
- `supabase/migrations/20251204_create_attendance_history.sql` - Crea `attendance_history` y trigger

### Hooks
- `src/hooks/useAttendanceConfirmations.ts` - Hooks para jugadores
- `src/hooks/useTodayAttendance.ts` - Hooks para profesores
- `src/hooks/useTodayClassAttendance.ts` - Query de clases próximas (jugadores)

### Componentes
- `src/components/TodayClassesConfirmation.tsx` - Panel de jugador
- `src/pages/TodayAttendancePage.tsx` - Panel profesor (hoy)
- `src/pages/WeekAttendancePage.tsx` - Panel profesor (semana)
- `src/components/AttendanceToggle.tsx` - Toggle VOY/NO VOY

### SQL Queries de Debug
- `check-player-absence-in-confirmations.sql` - Verificar ausencia de jugador
- `get-rocio-attendance-history.sql` - Ver historial de un jugador
- `debug-paula-padilla-attendance.sql` - Debug general de asistencia

---

## Flujo de Datos Completo

### Diagrama de Flujo - Jugador Marca Ausencia

```
[Jugador]
   ↓ clic "NO VOY"
[TodayClassesConfirmation.tsx]
   ↓ llama
[useConfirmAbsence()]
   ↓ ejecuta
[1. UPDATE class_participants]
   ↓ trigger
[log_attendance_change()]
   ↓ crea
[attendance_history record]
   ↓ continúa
[2. UPSERT class_attendance_confirmations]
   ↓ invalida
[React Query cache: 'upcoming-class-attendance', 'today-attendance']
   ↓ refetch
[UI actualizada en ambos paneles]
```

### Diagrama de Flujo - Profesor Notifica Ausencia

```
[Profesor]
   ↓ clic "Notificar ausencia"
[WeekAttendancePage.tsx]
   ↓ filtra
[Obtener ausentes (absentCount > 0)]
   ↓ prepara
[Mensaje WhatsApp con plazas disponibles]
   ↓ ejecuta
[lockAbsentParticipants()]
   ↓ actualiza
[1. UPDATE class_participants SET absence_locked = true]
[2. UPDATE class_attendance_confirmations SET absence_locked = true]
   ↓ envía
[WhatsApp API]
   ↓ notifica
[Grupo de WhatsApp del club]
   ↓ resultado
[Jugadores pueden apuntarse como suplentes]
```

---

## Mejores Prácticas

### Para Desarrolladores

1. **Siempre actualizar ambas tablas**: Cuando modifiques ausencia/asistencia, actualiza tanto `class_participants` como `class_attendance_confirmations`

2. **Usar hooks existentes**: NO crear nuevos hooks para asistencia sin revisar los existentes primero

3. **Invalidar queries**: Después de mutaciones, invalidar:
   ```javascript
   queryClient.invalidateQueries({ queryKey: ['upcoming-class-attendance'] });
   queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
   ```

4. **Logging**: Usar logs descriptivos con emojis para fácil debugging:
   ```javascript
   console.log('✅ [Player] Absence confirmed:', data);
   console.log('❌ [Trainer] Error marking attendance:', error);
   ```

5. **Verificar absence_locked**: SIEMPRE verificar este campo antes de permitir cancelar ausencia

### Para Testing

1. **Casos de prueba mínimos**:
   - Jugador marca ausencia → Verificar ambas tablas
   - Jugador cancela ausencia → Verificar limpieza en ambas tablas
   - Profesor marca ausencia → Verificar flag `confirmed_by_trainer`
   - Notificar ausencia → Verificar `absence_locked = true`
   - Intentar cancelar ausencia bloqueada → Verificar error

2. **Consultas de verificación**:
   ```sql
   -- Ver archivo: check-player-absence-in-confirmations.sql
   ```

---

## Changelog

### 2025-12-11
- ✅ **NUEVO**: Soporte para segundo entrenador (`trainer_profile_id_2`) en clases
- ✅ Entrenadores ven clases donde son trainer principal O secundario
- ✅ Administradores pueden filtrar por entrenador (incluye segundos entrenadores en lista)
- ✅ Vista del jugador muestra ambos entrenadores cuando hay 2 asignados
- ✅ Queries usan notación explícita de FK para evitar error PGRST201

### 2025-12-10
- ✅ **FIX CRÍTICO**: Hooks de profesor (`useTrainerMarkAttendance`, `useTrainerMarkAbsence`) ahora actualizan AMBAS tablas (`class_participants` + `class_attendance_confirmations`)
- ✅ Esto resuelve el problema de sincronización donde los cambios del profesor no se reflejaban en el dashboard del jugador
- ✅ El dashboard del jugador consulta principalmente `class_attendance_confirmations`, por lo que era necesario que los hooks del profesor también actualicen esa tabla

### 2025-12-05
- ✅ Actualizado `useConfirmAbsence()` para actualizar `class_participants`
- ✅ Actualizado `useCancelAbsence()` para actualizar `class_participants`
- ✅ Creado trigger automático de historial en `class_participants`
- ✅ Documentación completa del sistema

### 2025-12-04
- ✅ Corregido cálculo de `absentCount` en `WeekAttendancePage`
- ✅ Corregido condición de botón "Notificar ausencia"
- ✅ Hooks de trainer actualizados para usar `class_participants`

### 2025-12-03
- ✅ Creada tabla `class_attendance_confirmations`
- ✅ Función RPC `ensure_attendance_record()`
- ✅ Sistema de confirmación por fecha específica

---

**Última actualización**: 2025-12-11
**Mantenedor**: Equipo de desarrollo
**Versión**: 1.2 (Multi-Trainer Support)
