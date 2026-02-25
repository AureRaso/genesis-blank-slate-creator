# Sistema de Clases Particulares

## Índice
1. [Introducción](#introducción)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Sistema de Tarifas por Duración](#sistema-de-tarifas-por-duración)
4. [Disponibilidad del Entrenador](#disponibilidad-del-entrenador)
5. [Excepciones (Bloqueos, Días Extra, Vacaciones)](#excepciones-bloqueos-días-extra-vacaciones)
6. [Generación de Slots](#generación-de-slots)
7. [Flujo de Reserva - Jugador](#flujo-de-reserva---jugador)
8. [Flujo de Gestión - Entrenador/Admin](#flujo-de-gestión---entrenadoradmin)
9. [Sistema de Acompañantes y User Code](#sistema-de-acompañantes-y-user-code)
10. [Auto-cancelación por Timeout](#auto-cancelación-por-timeout)
11. [Notificaciones WhatsApp](#notificaciones-whatsapp)
12. [Visualización en Pantallas de Asistencia](#visualización-en-pantallas-de-asistencia)
13. [Hooks y Componentes](#hooks-y-componentes)
14. [Políticas RLS](#políticas-rls)
15. [Casos de Uso Comunes](#casos-de-uso-comunes)
16. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de clases particulares permite a los jugadores reservar clases privadas con entrenadores del club. El flujo completo es:

1. **Admin** configura tarifas por duración en el perfil del entrenador
2. **Entrenador** define su disponibilidad semanal (horarios mañana/tarde por día)
3. **Jugador** selecciona entrenador → fecha → slot libre → número de jugadores → confirma
4. **Entrenador** recibe solicitud pendiente → confirma o rechaza
5. **Sistema** envía notificación WhatsApp al jugador (y acompañantes si aplica)
6. Si el entrenador no responde en 2 horas → auto-cancelación automática

**Pago**: Siempre "en academia" (se paga presencialmente al confirmar la clase).

**Máquina de estados del booking**:
```
pending → confirmed    (entrenador confirma)
pending → rejected     (entrenador rechaza)
pending → cancelled    (jugador cancela)
pending → auto_cancelled (timeout 2h sin respuesta)
```

---

## Arquitectura de Base de Datos

### Tabla: `trainers` (columna añadida)

**Campo añadido**:
```sql
- private_lesson_rates: JSONB
```

**Estructura del JSONB**:
```json
{
  "60": {
    "price_1_player": 25,
    "price_2_players": 18,
    "price_3_players": 14,
    "price_4_players": 12
  },
  "90": {
    "price_1_player": 35,
    "price_2_players": 25,
    "price_3_players": 20,
    "price_4_players": 16
  }
}
```

**Clave**: Duración en minutos (string). Cada duración tiene 4 precios por persona según el número de jugadores.

**Migraciones**: `20260224000000` (columnas individuales, deprecadas) → `20260224100000` (migración a JSONB)

---

### Tabla: `private_lesson_availability`

**Propósito**: Disponibilidad semanal recurrente del entrenador para clases particulares.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- trainer_profile_id: UUID (Foreign Key a profiles)
- club_id: UUID (Foreign Key a clubs)
- day_of_week: INTEGER (0=domingo, 1=lunes, ..., 6=sábado)

-- Horarios mañana
- morning_start: TIME (ej: '09:00')
- morning_end: TIME (ej: '14:00')

-- Horarios tarde
- afternoon_start: TIME (ej: '16:00')
- afternoon_end: TIME (ej: '21:00')

-- Configuración
- slot_duration_minutes: INTEGER (ej: 60, 90)
- is_active: BOOLEAN DEFAULT true

- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Constraint único**: `(trainer_profile_id, club_id, day_of_week)` — un solo registro por entrenador/club/día.

**Constraints de validación**:
```sql
- morning_start < morning_end (si ambos no son NULL)
- afternoon_start < afternoon_end (si ambos no son NULL)
```

**Uso**:
- Se crea/actualiza mediante `upsert` (hook `useUpsertAvailability`)
- Los horarios NULL significan "no disponible en esa franja"
- `is_active = false` desactiva el día completo
- Se usa junto con excepciones para calcular los slots disponibles

---

### Tabla: `private_lesson_exceptions`

**Propósito**: Excepciones puntuales a la disponibilidad recurrente.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- trainer_profile_id: UUID (Foreign Key a profiles)
- club_id: UUID (Foreign Key a clubs)

-- Tipo de excepción
- exception_type: TEXT ('block_day' | 'extra_day' | 'vacation')

-- Para block_day y extra_day
- exception_date: DATE (fecha específica)

-- Para vacation
- start_date: DATE
- end_date: DATE

-- Para extra_day (horarios alternativos)
- morning_start: TIME
- morning_end: TIME
- afternoon_start: TIME
- afternoon_end: TIME
- slot_duration_minutes: INTEGER

-- Metadata
- reason: TEXT (motivo opcional)
- created_at: TIMESTAMPTZ
```

**Tipos de excepción**:

| Tipo | Descripción | Campos requeridos |
|------|-------------|-------------------|
| `block_day` | Bloquea un día completo | `exception_date` |
| `extra_day` | Añade disponibilidad extra un día específico | `exception_date` + horarios |
| `vacation` | Bloquea un rango de fechas | `start_date` + `end_date` |

**Constraints de validación**:
```sql
-- block_day / extra_day requieren exception_date
-- vacation requiere start_date + end_date
CHECK (
  (exception_type IN ('block_day','extra_day') AND exception_date IS NOT NULL)
  OR
  (exception_type = 'vacation' AND start_date IS NOT NULL AND end_date IS NOT NULL)
)
```

---

### Tabla: `private_lesson_bookings`

**Propósito**: Reservas de clases particulares.

**Campos clave**:
```sql
- id: UUID (Primary Key)

-- Relaciones
- trainer_profile_id: UUID (FK a profiles)
- club_id: UUID (FK a clubs)
- booked_by_profile_id: UUID (FK a profiles)

-- Datos del reservante
- booker_name: TEXT
- booker_email: TEXT
- booker_phone: TEXT

-- Clase
- lesson_date: DATE
- start_time: TIME
- end_time: TIME
- duration_minutes: INTEGER
- court_number: TEXT (pista asignada, opcional)

-- Acompañantes
- num_companions: INTEGER DEFAULT 0 (0-3)
- companion_details: JSONB (array de acompañantes)

-- Precio (snapshot al momento de reserva)
- price_per_person: NUMERIC(10,2)
- total_price: NUMERIC(10,2)

-- Pago
- payment_method: VARCHAR(20) DEFAULT 'academia'

-- Estado
- status: TEXT ('pending' | 'confirmed' | 'rejected' | 'cancelled' | 'auto_cancelled')
- rejection_reason: TEXT
- responded_at: TIMESTAMPTZ
- auto_cancel_at: TIMESTAMPTZ (se calcula automáticamente)

- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Estructura de `companion_details`**:
```json
[
  {
    "name": "María García",
    "email": "maria@email.com",
    "type": "registered",
    "user_code": "ABC123",
    "profile_id": "uuid-del-perfil"
  },
  {
    "name": "Pedro López",
    "type": "manual"
  }
]
```

**Triggers**:
- `set_auto_cancel_time`: Al insertar un booking con `status='pending'`, establece `auto_cancel_at = created_at + 2 horas`
- `update_updated_at`: Actualiza `updated_at` en cada modificación

**Índices**:
```sql
- trainer_profile_id (buscar por entrenador)
- lesson_date (buscar por fecha)
- status (filtrar por estado)
- (trainer_profile_id, lesson_date) (buscar slots ocupados)
- (status, auto_cancel_at) WHERE status='pending' (cron de auto-cancel)
```

---

### Tabla: `profiles` (columna añadida)

**Campo añadido**:
```sql
- user_code: VARCHAR(6) UNIQUE
```

**Charset**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (30 caracteres, evita confusiones 0/O, 1/I/L)

**Generación**: Trigger `set_user_code_on_insert` genera automáticamente un código único al crear perfil.

**Función RPC**: `lookup_user_by_code(p_code TEXT, p_club_id UUID DEFAULT NULL)`:
- Busca perfil por `user_code` (case-insensitive)
- Si `p_club_id` se proporciona: filtra por `profiles.club_id` o por `student_enrollments.club_id`
- Devuelve: `id, full_name, email, user_code`

---

## Sistema de Tarifas por Duración

Las tarifas se configuran en la página de entrenadores (`TrainersPage.tsx`) por el admin.

**Estructura**:
- Cada duración (60min, 90min, etc.) tiene 4 precios por persona
- El precio varía inversamente con el número de jugadores (más jugadores = menor precio por persona)

**Ejemplo**:
| Duración | 1 jugador | 2 jugadores | 3 jugadores | 4 jugadores |
|----------|-----------|-------------|-------------|-------------|
| 60 min   | 25€/pers  | 18€/pers    | 14€/pers    | 12€/pers    |
| 90 min   | 35€/pers  | 25€/pers    | 20€/pers    | 16€/pers    |

**Cálculo del precio total**:
```
total_price = price_per_person × num_jugadores
```

**Componentes relevantes**:
- `TrainerRateDialog.tsx` — Dialog para configurar tarifas (admin)
- `TrainersPrivateRatesTable.tsx` — Tabla de tarifas en página de entrenadores
- `RatesDisplayCard.tsx` — Card de solo lectura para el entrenador

---

## Disponibilidad del Entrenador

### Configuración

El entrenador configura su disponibilidad semanal desde la pestaña "Disponibilidad" en `PrivateLessonsPage.tsx`.

**Componentes**:
- `AvailabilityForm.tsx` — Formulario con 7 días (lunes a domingo)
- `AvailabilityDayCard.tsx` — Card individual por día con toggles mañana/tarde

**Datos por día**:
- Toggle activar/desactivar día
- Horario mañana: inicio y fin (ej: 09:00 - 14:00)
- Horario tarde: inicio y fin (ej: 16:00 - 21:00)
- Duración del slot: minutos (ej: 60)

**Hook**: `useUpsertAvailability()` — Hace upsert por `(trainer_profile_id, club_id, day_of_week)`

### Excepciones

**Componentes**:
- `ExceptionsList.tsx` — Lista de excepciones existentes con opción de eliminar
- `AddExceptionDialog.tsx` — Dialog para crear nueva excepción

**Tipos**:
1. **Bloquear día**: Marca un día como no disponible (ej: "15 marzo - Competición")
2. **Día extra**: Añade disponibilidad un día que normalmente no tiene (ej: "sábado 22 marzo, 10:00-14:00")
3. **Vacaciones**: Bloquea un rango de fechas completo (ej: "1-15 agosto")

**Hooks**: `useCreateException()`, `useDeleteException()`, `useTrainerExceptions()`

---

## Generación de Slots

La función pura `generateSlotsForDateRange()` calcula todos los slots disponibles para un rango de fechas.

**Archivo**: `src/hooks/usePrivateLessons.ts`

**Algoritmo**:
```
Para cada día en el rango:
  1. Comprobar si hay vacación activa → saltar día
  2. Comprobar si hay block_day → saltar día
  3. Comprobar si hay extra_day → usar horarios del extra_day
  4. Si no hay excepción → usar disponibilidad recurrente del día de la semana
  5. Si no hay disponibilidad → saltar día

  Para los horarios del día (mañana + tarde):
    6. Generar slots incrementando por slot_duration_minutes
    7. Filtrar slots que solapen con clases grupales del entrenador
    8. Marcar cada slot como: free / pending / confirmed (según bookings existentes)

Devolver ComputedSlot[] ordenados por fecha y hora
```

**Tipo `ComputedSlot`**:
```typescript
interface ComputedSlot {
  date: string;           // "2025-03-15"
  startTime: string;      // "10:00"
  endTime: string;        // "11:00"
  durationMinutes: number; // 60
  status: "free" | "pending" | "confirmed";
  bookingId?: string;     // Si status != "free"
  bookerName?: string;
}
```

**Filtrado de solapamiento con clases grupales**:
- Se consultan las `programmed_classes` del entrenador para el rango de fechas
- Si un slot de clase particular solapa con una clase grupal del mismo entrenador → se excluye

---

## Flujo de Reserva - Jugador

### Wizard de 4 pasos

**Página**: `PlayerPrivateLessonBookingPage.tsx`

**Paso 1 — Seleccionar entrenador, fecha y slot** (`BookingStepTrainer.tsx`):
```
1. Se muestran los entrenadores del club con tarifas configuradas
2. Jugador selecciona entrenador
3. Se muestra calendario con fechas disponibles
4. Jugador selecciona fecha
5. Se muestran slots libres del día
6. Jugador selecciona slot → Continuar
```

**Hook**: `useClubTrainersWithRates(clubId)` — Busca entrenadores en `trainer_clubs` y `profiles` con `private_lesson_rates` configuradas.

**Hook**: `useTrainerFreeSlots(trainerId, clubId, date)` — Genera slots para ese día y filtra solo los `status === "free"`.

**Paso 2 — Seleccionar jugadores** (`BookingStepPlayers.tsx`):
```
1. Jugador elige: 1, 2, 3, o 4 jugadores
2. Si > 1: buscar acompañantes por user_code de 6 dígitos
3. Se muestra precio dinámico según num_jugadores
4. Continuar
```

**Componente**: `CompanionSearch.tsx` — Input de búsqueda por user_code + hook `useLookupUserCode()`

**Paso 3 — Confirmar y pagar** (`BookingStepPayment.tsx`):
```
1. Resumen: entrenador, fecha, hora, duración, jugadores, precio
2. Método de pago: siempre "Pagar en academia"
3. Botón "Confirmar reserva"
```

**Hook**: `useCreatePrivateLessonBooking()` — Inserta en `private_lesson_bookings` con `status='pending'`, `payment_method='academia'`

**Paso 4 — Confirmación** (`BookingConfirmation.tsx`):
```
1. Mensaje de éxito
2. Aviso de que el entrenador tiene 2 horas para responder
3. Botón "Volver a mis clases"
```

### Visualización de reservas del jugador

El jugador ve sus reservas (como titular y como acompañante) en la pestaña "Mis Clases" del dashboard.

**Hook**: `useMyPrivateLessonBookings()` — Consulta bookings donde `booked_by_profile_id = userId` o `profile_id` aparece en `companion_details`. Marca con flag `is_companion`.

---

## Flujo de Gestión - Entrenador/Admin

### Página del entrenador

**Página**: `PrivateLessonsPage.tsx`

**4 pestañas**:

| Pestaña | Componente | Descripción |
|---------|-----------|-------------|
| Semana | `WeeklyLessonGrid.tsx` | Vista semanal de slots (libre/pendiente/confirmado) |
| Disponibilidad | `AvailabilityForm.tsx` | Configurar horarios semanales |
| Excepciones | `ExceptionsList.tsx` | Gestionar bloqueos, días extra, vacaciones |
| Solicitudes | `PendingBookingsList.tsx` | Lista de bookings pendientes |

### Responder a solicitudes

**Componente**: `PendingBookingCard.tsx`

**Acciones**:
- **Confirmar**: Cambia status a `confirmed`, establece `responded_at`
- **Rechazar**: Cambia status a `rejected`, permite añadir `rejection_reason`

**Hook**: `useRespondToBooking()`:
```typescript
// 1. Actualizar status en base de datos
await supabase
  .from('private_lesson_bookings')
  .update({ status, responded_at: new Date().toISOString(), rejection_reason })
  .eq('id', bookingId);

// 2. Invalidar caches de React Query

// 3. Fire-and-forget: enviar WhatsApp
supabase.functions.invoke('send-private-lesson-whatsapp', {
  body: { type: 'confirmed' | 'rejected', bookingId }
});
```

### Badge de solicitudes pendientes

**Hook**: `usePendingPrivateLessonCount(enabled)`:
- Cuenta bookings con `status='pending'` del entrenador
- Refetch cada 30 segundos (`refetchInterval: 30000`)
- Se muestra como badge numérico en el sidebar junto a "Clases Particulares"

---

## Sistema de Acompañantes y User Code

### User Code

Cada perfil tiene un código único de 6 caracteres generado automáticamente.

**Charset**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (evita confusiones visuales)

**Generación**: Trigger automático al crear perfil → `generate_unique_user_code()`

**Búsqueda**: RPC `lookup_user_by_code(p_code, p_club_id)` → devuelve perfil si existe en el club

### Flujo de acompañantes

```
1. Jugador A reserva clase para 3 personas
2. Jugador A busca acompañantes por user_code (6 dígitos)
3. Sistema valida que el código existe y pertenece al mismo club
4. Se almacena companion_details como JSONB:
   [{ name, email, type: "registered", user_code, profile_id }]
5. Acompañantes pueden ver la reserva (política RLS)
6. Al confirmar, acompañantes reciben WhatsApp individual
```

**Tipos de acompañante**:
- `registered`: Jugador registrado encontrado por user_code (tiene `profile_id`)
- `manual`: Nombre introducido manualmente (sin `profile_id`)

---

## Auto-cancelación por Timeout

Si el entrenador no responde a una solicitud en 2 horas, el booking se cancela automáticamente.

### Trigger de auto_cancel_at

```sql
-- Al insertar booking con status='pending':
NEW.auto_cancel_at = NEW.created_at + INTERVAL '2 hours'
```

### Cron Job

**Frecuencia**: Cada 15 minutos

**Función SQL**: `trigger_private_lesson_timeout()` — Invoca la Edge Function via `net.http_post`

### Edge Function: `process-private-lesson-timeout`

**Archivo**: `supabase/functions/process-private-lesson-timeout/index.ts`

**Flujo**:
```
1. Consultar bookings: status='pending' AND auto_cancel_at < NOW()
2. Para cada booking:
   a. UPDATE status='auto_cancelled'
   b. SET rejection_reason='Sin respuesta del entrenador en las últimas 2 horas...'
   c. SET responded_at = NOW()
   d. Verificar status='pending' para evitar race conditions
3. Devolver conteo de procesados
```

---

## Notificaciones WhatsApp

### Edge Function: `send-private-lesson-whatsapp`

**Archivo**: `supabase/functions/send-private-lesson-whatsapp/index.ts`

**Invocación**: Fire-and-forget desde `useRespondToBooking()` (no bloquea la UX del entrenador)

**Request**:
```json
{ "type": "confirmed" | "rejected", "bookingId": "uuid" }
```

### Flujo

```
1. Fetch booking (nombre, teléfono, fechas, precios, companion_details)
2. Verificar club en whitelist (WHATSAPP_ENABLED_CLUBS)
3. Fetch nombre del entrenador + idioma del club (clubs.default_language)
4. Formatear mensaje según idioma (es/en/it) y tipo

5. CONFIRMED:
   a. Enviar al reservante (booker_phone)
   b. Esperar 30 segundos (anti-ban)
   c. Para cada acompañante con teléfono:
      - Enviar mensaje de "te han incluido en una clase"
      - Esperar 30 segundos entre cada uno

6. REJECTED:
   a. Enviar solo al reservante (acompañantes no necesitan saber)
```

### Plantillas de mensajes

**Confirmación (reservante)** (ejemplo español):
```
*¡Tu clase particular ha sido confirmada!*

Profesor: Juan García
Fecha: martes, 25 de febrero
Hora: 10:00 - 11:00
Precio: 18€/persona
Club: Mi Club de Pádel

¡Nos vemos en la pista!
```

**Confirmación (acompañante)** (ejemplo español):
```
*¡Clase particular confirmada!*

Pedro López te ha incluido en una clase particular.
Profesor: Juan García
Fecha: martes, 25 de febrero
Hora: 10:00 - 11:00
Precio: 18€/persona
Club: Mi Club de Pádel

¡Nos vemos en la pista!
```

**Rechazo** (ejemplo español):
```
Hola Pedro,

Tu solicitud de clase particular del martes, 25 de febrero a las 10:00 con Juan García no ha podido ser aceptada.
Motivo: Lesión del entrenador
Puedes solicitar otra hora disponible en la app.
```

### Idiomas soportados

| Idioma | Clave | Detección |
|--------|-------|-----------|
| Español | `es` | `clubs.default_language` |
| Inglés | `en` | `clubs.default_language` |
| Italiano | `it` | `clubs.default_language` |

### Integración WhatsApp (Whapi)

- **API**: `POST {WHAPI_ENDPOINT}/messages/text`
- **Auth**: `Bearer {WHAPI_TOKEN}`
- **Formato teléfono**: `34XXXXXXXXX@s.whatsapp.net` (auto-prefijo +34 para móviles españoles)
- **Anti-ban**: 30 segundos de delay entre mensajes
- **Whitelist**: Solo clubs configurados en `WHATSAPP_ENABLED_CLUBS`

---

## Visualización en Pantallas de Asistencia

Las clases particulares aparecen como cards de solo lectura en las pantallas de asistencia diaria y semanal, después de las clases regulares.

### Hook compartido

**Hook**: `usePrivateLessonBookingsForAttendance(startDate, endDate, trainerFilter?)`

**Archivo**: `src/hooks/usePrivateLessons.ts`

```typescript
// Query: bookings con status pending/confirmed, join con trainer name
supabase
  .from('private_lesson_bookings')
  .select('*, trainer:profiles!trainer_profile_id(full_name)')
  .gte('lesson_date', startDate)
  .lte('lesson_date', endDate)
  .in('status', ['pending', 'confirmed'])
  .order('lesson_date')
  .order('start_time')
```

- RLS se encarga del acceso: trainers ven los suyos, admins ven todos del club
- Filtro por entrenador es opcional (para uso directo) o client-side por nombre (TodayAttendance/WeekAttendance)

### Componente: `PrivateLessonAttendanceCard`

**Archivo**: `src/components/private-lessons/PrivateLessonAttendanceCard.tsx`

Card de solo lectura con estilo índigo diferenciado (`border-indigo-200 bg-indigo-50/30`):

```
┌──────────────────────────────────────────────┐
│ 🎓 Clase Particular              [Confirmada]│
│ 10:00 - 11:00 (60 min) · Profesor: Juan     │
│ 📍 Pista 3                                   │
│──────────────────────────────────────────────│
│ 👤 Pedro López                               │
│ 👤 María Sánchez                             │
│──────────────────────────────────────────────│
│ 18€/persona · Total: 54€                    │
└──────────────────────────────────────────────┘
```

**Badges**:
- `Confirmada` → verde (`bg-green-100 text-green-700`)
- `Pendiente` → ámbar (`bg-amber-100 text-amber-700`)

### Integración en TodayAttendancePage

**Archivo**: `src/pages/TodayAttendancePage.tsx`

```
1. Hook: usePrivateLessonBookingsForAttendance(todayStr, todayStr)
2. Filtro client-side: si selectedTrainer !== 'all', filtra por booking.trainer.full_name
3. Renderizado: después del grid de clases regulares, sección "Clases Particulares"
4. Sin interacción: solo visual, no afecta stats ni funcionalidad existente
```

### Integración en WeekAttendancePage

**Archivo**: `src/pages/WeekAttendancePage.tsx`

```
1. Hook: usePrivateLessonBookingsForAttendance(weekStartStr, weekEndStr)
2. Filtro client-side: por selectedDate (lesson_date) + selectedTrainer (trainer.full_name)
3. Renderizado: después del grid de clases regulares del día seleccionado
4. Sin interacción: solo visual
```

---

## Hooks y Componentes

### Hooks principales

| Hook | Archivo | Descripción |
|------|---------|-------------|
| `useTrainerAvailability` | `usePrivateLessons.ts` | Disponibilidad semanal del entrenador |
| `useUpsertAvailability` | `usePrivateLessons.ts` | Crear/actualizar disponibilidad |
| `useTrainerExceptions` | `usePrivateLessons.ts` | Excepciones del entrenador |
| `useCreateException` | `usePrivateLessons.ts` | Crear excepción |
| `useDeleteException` | `usePrivateLessons.ts` | Eliminar excepción |
| `useTrainerBookings` | `usePrivateLessons.ts` | Bookings del entrenador (rango fechas) |
| `useRespondToBooking` | `usePrivateLessons.ts` | Confirmar/rechazar booking + WhatsApp |
| `usePendingPrivateLessonCount` | `usePrivateLessons.ts` | Contador de pendientes (badge sidebar) |
| `useTrainerProgrammedClassesForRange` | `usePrivateLessons.ts` | Clases grupales para filtrar solapamiento |
| `usePrivateLessonBookingsForAttendance` | `usePrivateLessons.ts` | Bookings para pantallas de asistencia |
| `useClubTrainersWithRates` | `usePlayerPrivateLessons.ts` | Entrenadores con tarifas del club |
| `useTrainerFreeSlots` | `usePlayerPrivateLessons.ts` | Slots libres para una fecha |
| `useCreatePrivateLessonBooking` | `usePlayerPrivateLessons.ts` | Crear nueva reserva |
| `useMyPrivateLessonBookings` | `usePlayerPrivateLessons.ts` | Mis reservas (titular + acompañante) |
| `useLookupUserCode` | `useLookupUserCode.ts` | Buscar perfil por user_code |
| `useTrainerWeeklySlots` | `useTrainerWeeklySlots.ts` | Clases grupales semanales del entrenador |

### Componentes — Gestión (Entrenador/Admin)

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `PrivateLessonsPage` | `pages/PrivateLessonsPage.tsx` | Página principal con 4 tabs |
| `WeeklyLessonGrid` | `private-lessons/WeeklyLessonGrid.tsx` | Grid semanal de slots |
| `AvailabilityForm` | `private-lessons/AvailabilityForm.tsx` | Formulario de disponibilidad |
| `AvailabilityDayCard` | `private-lessons/AvailabilityDayCard.tsx` | Card por día de la semana |
| `ExceptionsList` | `private-lessons/ExceptionsList.tsx` | Lista de excepciones |
| `AddExceptionDialog` | `private-lessons/AddExceptionDialog.tsx` | Dialog para crear excepción |
| `PendingBookingsList` | `private-lessons/PendingBookingsList.tsx` | Lista de solicitudes pendientes |
| `PendingBookingCard` | `private-lessons/PendingBookingCard.tsx` | Card de solicitud con acciones |
| `RatesDisplayCard` | `private-lessons/RatesDisplayCard.tsx` | Tarifas del entrenador (lectura) |

### Componentes — Reserva (Jugador)

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `PlayerPrivateLessonBookingPage` | `pages/PlayerPrivateLessonBookingPage.tsx` | Wizard de 4 pasos |
| `BookingStepTrainer` | `private-lessons/player/BookingStepTrainer.tsx` | Paso 1: entrenador + fecha + slot |
| `BookingStepPlayers` | `private-lessons/player/BookingStepPlayers.tsx` | Paso 2: jugadores + acompañantes |
| `BookingStepPayment` | `private-lessons/player/BookingStepPayment.tsx` | Paso 3: resumen + confirmar |
| `BookingConfirmation` | `private-lessons/player/BookingConfirmation.tsx` | Paso 4: mensaje de éxito |
| `CompanionSearch` | `private-lessons/player/CompanionSearch.tsx` | Búsqueda de acompañante por user_code |

### Componentes — Asistencia (Solo lectura)

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `PrivateLessonAttendanceCard` | `private-lessons/PrivateLessonAttendanceCard.tsx` | Card visual en asistencia |

### Edge Functions

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `process-private-lesson-timeout` | `supabase/functions/process-private-lesson-timeout/` | Auto-cancelar bookings expirados |
| `send-private-lesson-whatsapp` | `supabase/functions/send-private-lesson-whatsapp/` | Notificaciones WhatsApp |

---

## Políticas RLS

### `private_lesson_availability`

| Política | Rol | Operación | Condición |
|----------|-----|-----------|-----------|
| Trainers CRUD own | Entrenador | SELECT, INSERT, UPDATE, DELETE | `trainer_profile_id = auth.uid()` |
| Admins SELECT | Admin | SELECT | `club_id` del entrenador = club del admin |
| Players SELECT | Jugador | SELECT | Para ver slots al reservar |

### `private_lesson_exceptions`

| Política | Rol | Operación | Condición |
|----------|-----|-----------|-----------|
| Trainers CRUD own | Entrenador | SELECT, INSERT, UPDATE, DELETE | `trainer_profile_id = auth.uid()` |
| Admins SELECT | Admin | SELECT | Club del entrenador = club del admin |
| Players SELECT | Jugador | SELECT | Para calcular slots disponibles |

### `private_lesson_bookings`

| Política | Rol | Operación | Condición |
|----------|-----|-----------|-----------|
| Trainers SELECT own | Entrenador | SELECT | `trainer_profile_id = auth.uid()` |
| Trainers UPDATE own | Entrenador | UPDATE | `trainer_profile_id = auth.uid()` |
| Players SELECT own | Jugador | SELECT | `booked_by_profile_id = auth.uid()` |
| Players INSERT | Jugador | INSERT | `booked_by_profile_id = auth.uid()` |
| Players UPDATE own pending | Jugador | UPDATE | `booked_by_profile_id = auth.uid() AND status = 'pending'` |
| Admins SELECT club | Admin | SELECT | `club_id` = club del admin |
| Companions SELECT | Cualquiera | SELECT | `profile_id` aparece en `companion_details` JSONB |

---

## Casos de Uso Comunes

### 1. Entrenador configura disponibilidad por primera vez

```
1. Admin configura tarifas en TrainersPage → TrainerRateDialog
2. Entrenador accede a Clases Particulares → pestaña Disponibilidad
3. Activa días (ej: lunes a viernes)
4. Configura horarios mañana (09:00-14:00) y tarde (16:00-21:00)
5. Establece duración de slot (ej: 60 min)
6. Guarda → upsert en private_lesson_availability
```

### 2. Jugador reserva clase para 2 personas

```
1. Jugador accede a Clases Particulares desde dashboard
2. Selecciona entrenador (ve tarifas)
3. Selecciona fecha en calendario
4. Selecciona slot libre (ej: 10:00 - 11:00)
5. Elige "2 jugadores"
6. Busca acompañante por user_code → encuentra María
7. Ve precio: 18€/persona × 2 = 36€ total
8. Confirma reserva → status='pending'
9. Entrenador recibe notificación (badge en sidebar)
10. Entrenador confirma → status='confirmed'
11. Sistema envía WhatsApp al reservante y a María
```

### 3. Entrenador bloquea un día

```
1. Entrenador va a pestaña Excepciones
2. Click "Añadir excepción"
3. Selecciona "Bloquear día"
4. Elige fecha + motivo (ej: "Competición")
5. Guarda → los slots de ese día desaparecen para los jugadores
```

### 4. Booking se auto-cancela

```
1. Jugador reserva a las 10:00
2. auto_cancel_at se establece en 12:00
3. Cron se ejecuta cada 15 minutos
4. A las 12:00-12:15, cron detecta el booking expirado
5. Edge Function actualiza: status='auto_cancelled'
6. Jugador ve el booking como cancelado
```

---

## Troubleshooting

### Problema: Entrenador no aparece en lista del jugador

**Causas posibles**:
1. No tiene `private_lesson_rates` configuradas → Admin debe configurar tarifas
2. No está en `trainer_clubs` ni tiene `profiles.club_id` del club del jugador
3. Tiene tarifas pero todas las duraciones tienen precios en 0

**Verificación**:
```sql
SELECT t.id, p.full_name, t.private_lesson_rates
FROM trainers t
JOIN profiles p ON p.id = t.profile_id
WHERE t.club_id = 'UUID_DEL_CLUB'
  OR t.profile_id IN (SELECT profile_id FROM trainer_clubs WHERE club_id = 'UUID_DEL_CLUB');
```

### Problema: No se generan slots para un día

**Causas posibles**:
1. No hay `private_lesson_availability` activa para ese día de la semana
2. Hay una excepción `block_day` o `vacation` para esa fecha
3. Los horarios solapan completamente con clases grupales del entrenador
4. `is_active = false` en la disponibilidad

**Verificación**:
```sql
-- Disponibilidad
SELECT * FROM private_lesson_availability
WHERE trainer_profile_id = 'UUID' AND day_of_week = 2; -- 2=martes

-- Excepciones
SELECT * FROM private_lesson_exceptions
WHERE trainer_profile_id = 'UUID'
  AND (exception_date = '2025-03-15' OR ('2025-03-15' BETWEEN start_date AND end_date));
```

### Problema: WhatsApp no se envía

**Causas posibles**:
1. Club no está en `WHATSAPP_ENABLED_CLUBS` → Añadir UUID al array
2. Jugador no tiene teléfono registrado
3. `WHAPI_TOKEN` no configurado en secrets de Supabase
4. Error en formato de teléfono (debe ser 9 dígitos empezando por 6 o 7)

**Verificación**: Consultar logs de la Edge Function en Supabase Dashboard.

### Problema: Auto-cancel no funciona

**Causas posibles**:
1. Cron job no activo → Verificar en `cron.job`
2. Edge Function `process-private-lesson-timeout` no desplegada
3. `auto_cancel_at` no se establece → Verificar trigger `set_auto_cancel_time`

**Verificación**:
```sql
-- Ver cron jobs
SELECT * FROM cron.job WHERE jobname LIKE '%private%';

-- Ver bookings pendientes con auto_cancel
SELECT id, status, created_at, auto_cancel_at
FROM private_lesson_bookings
WHERE status = 'pending'
ORDER BY auto_cancel_at;
```

### Problema: Acompañante no puede ver la reserva

**Causas posibles**:
1. `companion_details` no tiene `profile_id` del acompañante (fue añadido manualmente)
2. Política RLS `companion_view_bookings` no aplicada

**Verificación**:
```sql
-- Ver companion_details
SELECT id, companion_details
FROM private_lesson_bookings
WHERE id = 'UUID_BOOKING';

-- Verificar política
SELECT * FROM pg_policies
WHERE tablename = 'private_lesson_bookings'
  AND policyname LIKE '%companion%';
```

---

## Migraciones

| Migración | Descripción |
|-----------|-------------|
| `20260224000000` | Añade columnas de precio individuales a trainers (deprecadas) |
| `20260224100000` | Migra a `private_lesson_rates` JSONB, elimina columnas individuales |
| `20260225000000` | Crea tablas principales: availability, exceptions, bookings + RLS + triggers |
| `20260225100000` | Cron job + Edge Function para auto-cancel por timeout |
| `20260225200000` | Añade `companion_details`, `payment_method`, `student_bono_id` a bookings |
| `20260225300000` | Añade `user_code` a profiles + función de generación + RPC de lookup |
| `20260225400000` | Política RLS para que acompañantes vean sus bookings |
