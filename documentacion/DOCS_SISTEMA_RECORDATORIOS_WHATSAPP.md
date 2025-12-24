# Sistema de Recordatorios y Notificaciones WhatsApp

## Índice
1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Recordatorios de 24 Horas](#recordatorios-de-24-horas)
4. [Recordatorio Semanal (Lunes)](#recordatorio-semanal-lunes)
5. [Notificaciones de Lista de Espera](#notificaciones-de-lista-de-espera)
6. [Reportes Diarios](#reportes-diarios)
7. [Configuración de Cron Jobs](#configuración-de-cron-jobs)
8. [Proveedor de WhatsApp (Whapi)](#proveedor-de-whatsapp-whapi)
9. [Variables de Entorno](#variables-de-entorno)
10. [Tablas de Base de Datos](#tablas-de-base-de-datos)
11. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de notificaciones WhatsApp de PadeLock permite enviar mensajes automáticos a jugadores y grupos para:

1. **Recordatorios de 24h**: Notificar a cada jugador sus clases del día siguiente
2. **Recordatorio semanal**: Mensaje a grupos los lunes recordando usar la app
3. **Lista de espera**: Notificar cuando hay plazas disponibles o cuando se acepta/rechaza
4. **Reportes diarios**: Resumen de asistencia para administradores

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRIGGERS (Disparadores)                      │
├─────────────────────────────────────────────────────────────────┤
│  Cron Job PostgreSQL    │  GitHub Actions    │  Manual/Frontend │
│  (cada hora)            │  (horarios fijos)  │  (botones UI)    │
└───────────┬─────────────┴────────┬───────────┴────────┬─────────┘
            │                      │                    │
            ▼                      ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS (Supabase)                     │
├─────────────────────────────────────────────────────────────────┤
│  send-attendance-reminders    │  Recordatorios 24h (email+WA)   │
│  send-class-reminder-whatsapp │  WA individual por estudiante   │
│  daily-attendance-reminder    │  Recordatorio semanal a grupos  │
│  send-waitlist-whatsapp       │  Notifica aceptado/rechazado    │
│  notify-waitlist              │  Notifica grupo plaza libre     │
│  generate-daily-report        │  Genera reporte diario          │
│  trigger-scheduled-reports    │  Dispatcher de reportes         │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROVEEDORES EXTERNOS                          │
├─────────────────────────────────────────────────────────────────┤
│  Whapi.cloud (WhatsApp)  │  Resend (Email)  │  UltraMsg (legacy)│
└─────────────────────────────────────────────────────────────────┘
```

---

## Recordatorios de 24 Horas

### Descripción
Envía recordatorios automáticos a los jugadores 24 horas antes de sus clases. Incluye email y WhatsApp (solo club Gali actualmente).

### Edge Functions Involucradas

#### 1. `send-attendance-reminders`

**Archivo**: `supabase/functions/send-attendance-reminders/index.ts`

**Propósito**: Función principal que coordina el envío de recordatorios.

**Flujo de ejecución**:
```
1. Se ejecuta cada hora (vía cron)
2. Calcula ventana de tiempo: 24h a 24h30m desde ahora
3. Obtiene clases activas en esa ventana
4. Filtra por día de la semana (soporta acentos: miércoles/miercoles)
5. Excluye clases canceladas
6. Para cada participante activo (sin ausencia confirmada):
   a) Envía email (Resend API)
   b) Si es club Gali → Envía WhatsApp
```

**Operaciones de base de datos**:
```sql
-- 1. Obtener clases activas en el rango de fecha
SELECT id, name, start_time, days_of_week, club_id, clubs:club_id (name)
FROM programmed_classes
WHERE is_active = true
  AND start_date <= :targetDate
  AND end_date >= :targetDate;

-- 2. Filtrar clases canceladas
SELECT class_id FROM cancelled_classes
WHERE class_id IN (:classIds) AND cancelled_date = :targetDate;

-- 3. Obtener participantes activos
SELECT id, student_enrollment_id, student_enrollment:student_enrollments!student_enrollment_id (id, full_name, email)
FROM class_participants
WHERE class_id = :classId
  AND status = 'active'
  AND absence_confirmed != true;
```

**Rate limiting**:
- 600ms entre emails (Resend: 2 emails/segundo)
- 1000ms entre WhatsApps
- Reintentos automáticos en error 429 (hasta 3 veces)

---

#### 2. `send-class-reminder-whatsapp`

**Archivo**: `supabase/functions/send-class-reminder-whatsapp/index.ts`

**Propósito**: Envía mensaje WhatsApp individual con detalles de clases del día siguiente.

**Input**:
```typescript
interface ClassReminderRequest {
  userEmail: string;
  testSecret?: string;
}
```

**Mensaje generado**:
```
Hola [StudentName]! 👋

Recordatorio de tus clases de mañana:

📍 Clase 1: [ClassName]
⏰ Horario: HH:MM - HH:MM
🎾 Pista: [CourtNumber]
✅ Asistencia confirmada / ❌ Ausencia confirmada / ⚠️ Pendiente de confirmar

⚠️ Recuerda: Si no puedes asistir, márcalo en la web antes de 5 horas del inicio de la clase.

🔗 Accede aquí: https://www.padelock.com/auth

¡Nos vemos en la pista! 🎾
```

**Características especiales**:
- Calcula hora de fin automáticamente (`start_time + duration_minutes`)
- Incluye botones interactivos para marcar ausencia (hasta 3 clases)
- Soporta días con y sin acentos

---

## Recordatorio Semanal (Lunes)

### Descripción
Mensaje enviado a todos los grupos de WhatsApp activos los lunes a las 8:00 AM (Madrid).

### Edge Function

**Archivo**: `supabase/functions/daily-attendance-reminder/index.ts`

**Workflow GitHub Actions**: `.github/workflows/daily-reminder.yml`

**Programación**:
```yaml
# Cron: 0 7 * * 1 = 7:00 AM UTC = 8:00 AM Madrid (invierno)
schedule:
  - cron: '0 7 * * 1'  # Lunes
```

**Mensaje**:
```
👋 ¡Buenas, equipo!

Como cada semana, recordad que la asistencia a las clases está confirmada por defecto 💪
👉 Solo tenéis que comunicar vuestra ausencia desde PadeLock si no podéis venir.

🔗 https://www.padelock.com/auth

Si tenéis cualquier duda con la aplicación, podéis escribirnos por privado a este número.

¡Nos vemos en pista! 🎾🔥
```

**Flujo**:
```
1. Verifica que es lunes (dayOfWeek === 1)
2. Obtiene todos los grupos activos de whatsapp_groups
3. Envía mensaje a cada grupo
4. Delay de 1s entre mensajes
```

---

## Notificaciones de Lista de Espera

### Descripción
Sistema para notificar a jugadores sobre el estado de su solicitud de plaza.

### Edge Functions

#### 1. `send-waitlist-whatsapp` (Individual)

**Archivo**: `supabase/functions/send-waitlist-whatsapp/index.ts`

**Propósito**: Notifica a un estudiante cuando es aceptado o rechazado de la lista de espera.

**Input**:
```typescript
interface SendWaitlistWhatsAppRequest {
  type: 'accepted' | 'rejected';
  studentEmail: string;
  studentName: string;
  className: string;
  classDate: string;
  classTime: string;
  clubName?: string;
}
```

**Mensaje ACEPTADO**:
```
*Ya tienes plaza en el entrenamiento!*

Clase: [ClassName]
Fecha: [Formatted Date]
Hora: [Time]
Club: [ClubName]

Nos vemos en la pista!
```

**Mensaje RECHAZADO**:
```
Hola [StudentName]!

El entrenamiento del [Date] a las [Time] ha quedado completo y no ha sido posible darte plaza esta vez.

Gracias por estar pendiente. *La siguiente te esperamos!*
```

**Restricción**: Solo envía a estudiantes del club Gali (para testing).

---

#### 2. `notify-waitlist` (Grupo)

**Archivo**: `supabase/functions/notify-waitlist/index.ts`

**Propósito**: Notifica a un grupo de WhatsApp cuando hay plazas disponibles en una clase.

**Input**:
```typescript
interface NotifyWaitlistRequest {
  classId: string;
  availableSpots?: number;
}
```

**Mensaje**:
```
🎾 ¡PLAZA DISPONIBLE!

📋 Clase: [ClassName]
🏟️ Club: [ClubName]
📅 Días: [DaysOfWeek]
⏰ Hora: [StartTime]
👥 Plazas disponibles: [Count]

💻 Inscríbete aquí (enlace válido 24h):
[EnrollmentURL]

¡No pierdas tu oportunidad! 🚀
```

**Características**:
- Crea token de inscripción único (UUID)
- Token válido por 24 horas
- Guarda token en tabla `enrollment_tokens`
- Usa API UltraMsg (legacy)

---

## Reportes Diarios

### Descripción
Genera y envía reportes de asistencia a grupos de WhatsApp de administradores.

### Edge Functions

#### 1. `trigger-scheduled-reports`

**Propósito**: Punto de entrada llamado por cron jobs o GitHub Actions.

**Flujo**:
```
1. Valida CRON_SECRET
2. Verifica que es día laborable (L-V)
3. Obtiene clubs con reportes habilitados
4. Llama a generate-daily-report para cada club
```

#### 2. `generate-daily-report`

**Archivo**: `supabase/functions/generate-daily-report/index.ts`

**Módulos auxiliares**:
- `data-collector.ts` - Recopila datos de asistencia
- `report-generator.ts` - Formatea el mensaje
- `whapi-client.ts` - Cliente WhatsApp

**Input**:
```typescript
{
  clubId: string;
  reportType: 'morning' | 'afternoon';
  manual?: boolean;
}
```

**Contenido del reporte**:
- Estadísticas del día (clases, alumnos, confirmados, ausentes, pendientes)
- Tasa de respuesta
- Clases completas
- Listas de espera
- Clases con huecos disponibles
- Acciones sugeridas

### Workflow GitHub Actions

**Archivo**: `.github/workflows/whatsapp-daily-reports.yml`

**Programación**:
```yaml
schedule:
  # Reporte mañana: 10:00 AM Madrid (9:00 UTC invierno)
  - cron: '0 9 * * 1-5'
  # Reporte tarde: 13:00 Madrid (12:00 UTC invierno)
  - cron: '0 12 * * 1-5'
```

---

## Configuración de Cron Jobs

### Cron Job PostgreSQL

**Archivo**: `supabase/migrations/20250119000000_create_attendance_reminders_cron.sql`

**Función SQL**:
```sql
CREATE OR REPLACE FUNCTION trigger_attendance_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-attendance-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  RAISE NOTICE 'Triggered attendance reminders check at %', NOW();
END;
$$;
```

**Job programado**:
```sql
SELECT cron.schedule(
  'attendance-reminders-hourly',
  '0 * * * *',  -- Cada hora en minuto :00
  $$SELECT trigger_attendance_reminders()$$
);
```

**Comandos útiles**:
```sql
-- Ver jobs programados
SELECT * FROM cron.job;

-- Ejecutar manualmente (testing)
SELECT trigger_attendance_reminders();

-- Desactivar job
SELECT cron.unschedule('attendance-reminders-hourly');
```

---

## Proveedor de WhatsApp (Whapi)

### Configuración

**Endpoint principal**: `https://gate.whapi.cloud`

**Endpoints usados**:
| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/messages/text` | POST | Mensajes de texto simple |
| `/messages/interactive` | POST | Mensajes con botones |

### Formato de números

**Individual**:
```
34612345678@s.whatsapp.net
```

**Grupo**:
```
34666777888-1234567890@g.us
```

### Función de formateo
```typescript
function formatPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, '');

  // Añadir prefijo España si es móvil sin prefijo
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = '34' + digits;
  }

  if (!phone.includes('@')) {
    return `${digits}@s.whatsapp.net`;
  }

  return phone;
}
```

### Ejemplo de envío

**Mensaje de texto**:
```typescript
await fetch(`${whapiEndpoint}/messages/text`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${whapiToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: formattedPhone,
    body: message,
    typing_time: 2  // Simula escritura
  }),
});
```

**Mensaje interactivo con botones**:
```typescript
await fetch(`${whapiEndpoint}/messages/interactive`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${whapiToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: formattedPhone,
    type: 'button',
    body: { text: message },
    action: {
      buttons: [
        { type: 'quick_reply', id: 'absence_123', title: '❌ No puedo ir (1)' }
      ]
    }
  }),
});
```

---

## Variables de Entorno

### Supabase Edge Functions

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypass RLS) | ✅ |
| `WHAPI_TOKEN` | Token de autenticación Whapi | ✅ |
| `WHAPI_ENDPOINT` | URL base Whapi (default: https://gate.whapi.cloud) | ❌ |
| `RESEND_API_KEY` | API key de Resend para emails | ✅ |
| `TEST_SECRET` | Secreto para testing (default: whatsapp-test-2025) | ❌ |
| `APP_BASE_URL` | URL base de la aplicación | ❌ |
| `CRON_SECRET` | Secreto para validar llamadas de cron | ✅ |

### GitHub Actions Secrets

| Secret | Descripción |
|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_URL` | URL del proyecto |
| `CRON_SECRET` | Secreto para validar cron |

---

## Tablas de Base de Datos

### `whatsapp_groups`

**Propósito**: Grupos de WhatsApp para recordatorios semanales.

```sql
CREATE TABLE whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id),
  group_chat_id TEXT NOT NULL,  -- ID del grupo en WhatsApp
  group_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `whatsapp_report_groups`

**Propósito**: Grupos de WhatsApp para reportes diarios.

```sql
CREATE TABLE whatsapp_report_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID UNIQUE REFERENCES clubs(id),
  group_name TEXT,
  whatsapp_group_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  send_morning_report BOOLEAN DEFAULT true,
  send_afternoon_report BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `enrollment_tokens`

**Propósito**: Tokens para inscripción desde WhatsApp.

```sql
CREATE TABLE enrollment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL,
  class_id UUID REFERENCES programmed_classes(id),
  expires_at TIMESTAMPTZ NOT NULL,
  available_spots INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `cron_debug_logs`

**Propósito**: Logs de debugging para funciones cron.

```sql
CREATE TABLE cron_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT,
  log_level TEXT,  -- 'info', 'error', 'warning'
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Troubleshooting

### Problema 1: Recordatorios no se envían

**Síntomas**: No llegan emails ni WhatsApps 24h antes de las clases.

**Diagnóstico**:
```sql
-- Verificar que el cron job existe
SELECT * FROM cron.job WHERE jobname = 'attendance-reminders-hourly';

-- Ver logs de ejecución
SELECT * FROM cron_debug_logs
WHERE function_name = 'send-attendance-reminders'
ORDER BY created_at DESC
LIMIT 10;

-- Verificar clases en las próximas 24h
SELECT id, name, start_time, days_of_week
FROM programmed_classes
WHERE is_active = true
  AND start_date <= CURRENT_DATE + 1
  AND end_date >= CURRENT_DATE + 1;
```

**Causas posibles**:
1. Cron job no está activo
2. Clase no tiene el día de la semana correcto (verificar acentos)
3. `RESEND_API_KEY` o `WHAPI_TOKEN` no configurados
4. Participantes tienen `absence_confirmed = true`

**Solución**:
```sql
-- Ejecutar manualmente para testing
SELECT trigger_attendance_reminders();
```

---

### Problema 2: WhatsApp no llega pero email sí

**Síntomas**: El estudiante recibe email pero no WhatsApp.

**Diagnóstico**:
1. Verificar que el estudiante es del club Gali
2. Verificar que tiene teléfono registrado

```sql
SELECT se.email, se.phone, se.club_id, c.name as club_name
FROM student_enrollments se
JOIN clubs c ON se.club_id = c.id
WHERE se.email = 'estudiante@email.com';
```

**Causas posibles**:
1. Estudiante no es del club Gali (`GALI_CLUB_ID`)
2. Campo `phone` está vacío o NULL
3. Formato de teléfono incorrecto

---

### Problema 3: Mensaje semanal no se envía

**Síntomas**: No llega el mensaje de los lunes a los grupos.

**Diagnóstico**:
```sql
-- Verificar grupos activos
SELECT * FROM whatsapp_groups WHERE is_active = true;

-- Ver logs
SELECT * FROM cron_debug_logs
WHERE function_name = 'daily-attendance-reminder'
ORDER BY created_at DESC
LIMIT 5;
```

**Causas posibles**:
1. No es lunes (función verifica `dayOfWeek === 1`)
2. No hay grupos activos configurados
3. GitHub Actions workflow falló

**Solución**:
- Ejecutar manualmente desde GitHub Actions (workflow_dispatch)
- Verificar que el secreto `SUPABASE_SERVICE_ROLE_KEY` está configurado

---

### Problema 4: Notificación de lista de espera no llega

**Síntomas**: Al aceptar/rechazar de waitlist, no llega WhatsApp.

**Diagnóstico**:
```sql
-- Verificar estudiante
SELECT email, phone, club_id FROM student_enrollments
WHERE email = 'estudiante@email.com';
```

**Causas posibles**:
1. Estudiante no tiene teléfono registrado
2. Estudiante no es del club Gali
3. Campos requeridos faltantes en la solicitud

---

## Archivos de Referencia

### Edge Functions
| Archivo | Propósito |
|---------|-----------|
| `supabase/functions/send-attendance-reminders/index.ts` | Recordatorios 24h |
| `supabase/functions/send-class-reminder-whatsapp/index.ts` | WA individual |
| `supabase/functions/daily-attendance-reminder/index.ts` | Recordatorio semanal |
| `supabase/functions/send-waitlist-whatsapp/index.ts` | Waitlist individual |
| `supabase/functions/notify-waitlist/index.ts` | Waitlist grupo |
| `supabase/functions/generate-daily-report/index.ts` | Reportes diarios |
| `supabase/functions/trigger-scheduled-reports/index.ts` | Dispatcher reportes |

### GitHub Workflows
| Archivo | Propósito |
|---------|-----------|
| `.github/workflows/daily-reminder.yml` | Recordatorio semanal lunes |
| `.github/workflows/whatsapp-daily-reports.yml` | Reportes diarios |

### Migraciones SQL
| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/20250119000000_create_attendance_reminders_cron.sql` | Cron job recordatorios |

---

## Diagrama de Flujo Completo

### Recordatorio 24h
```
[Cron Job Hourly]
       ↓
[send-attendance-reminders]
       ↓
┌──────┴──────┐
↓             ↓
[Email]    [WhatsApp?]
(Resend)       ↓
          [Es club Gali?]
               ↓ Sí
       [send-class-reminder-whatsapp]
               ↓
          [Whapi API]
               ↓
       [Mensaje + Botones]
```

### Lista de Espera
```
[Profesor acepta/rechaza]
         ↓
[Frontend llama Edge Function]
         ↓
[send-waitlist-whatsapp]
         ↓
    [Es club Gali?]
         ↓ Sí
    [Tiene teléfono?]
         ↓ Sí
     [Whapi API]
         ↓
[Mensaje aceptado/rechazado]
```

---

**Última actualización**: 2025-12-11
**Mantenedor**: Equipo de desarrollo
**Versión**: 1.0
