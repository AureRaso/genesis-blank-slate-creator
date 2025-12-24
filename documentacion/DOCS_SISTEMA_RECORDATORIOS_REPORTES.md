# Sistema de Recordatorios y Reportes WhatsApp

## Índice
1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Weekly Attendance Reminder](#weekly-attendance-reminder)
4. [WhatsApp Daily Reports](#whatsapp-daily-reports)
5. [Tablas de Base de Datos](#tablas-de-base-de-datos)
6. [Edge Functions](#edge-functions)
7. [Configuración de Workflows](#configuración-de-workflows)
8. [Casos de Uso Comunes](#casos-de-uso-comunes)
9. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de recordatorios y reportes automatizados envía mensajes de WhatsApp a los grupos de cada club para:

1. **Weekly Attendance Reminder**: Recordatorio semanal (lunes) para que los jugadores confirmen su asistencia
2. **WhatsApp Daily Reports**: Reportes diarios (mañana y tarde) con el resumen de clases del día para los entrenadores

Ambos sistemas utilizan:
- **GitHub Actions**: Orquestación de cron jobs
- **Supabase Edge Functions**: Lógica de negocio y envío de mensajes
- **Whapi.cloud**: API de WhatsApp para enviar mensajes a grupos

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                                │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │  daily-reminder.yml │    │  whatsapp-daily-reports.yml         │ │
│  │  (Lunes 8:00 AM)    │    │  (L-V 10:00 AM y 13:00 PM)          │ │
│  └──────────┬──────────┘    └──────────────────┬──────────────────┘ │
└─────────────┼──────────────────────────────────┼────────────────────┘
              │                                  │
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase Edge Functions                         │
│  ┌──────────────────────────┐    ┌─────────────────────────────────┐│
│  │ daily-attendance-reminder│    │ trigger-scheduled-reports       ││
│  │                          │    │         │                       ││
│  │ - Verifica día (lunes)   │    │         ▼                       ││
│  │ - Obtiene grupos activos │    │ generate-daily-report           ││
│  │ - Envía mensaje genérico │    │ - Recopila datos del día        ││
│  └────────────┬─────────────┘    │ - Genera mensaje formateado     ││
│               │                  │ - Envía por club/entrenador     ││
│               │                  └──────────────┬──────────────────┘│
└───────────────┼─────────────────────────────────┼───────────────────┘
                │                                  │
                ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Whapi.cloud API                              │
│                    POST /messages/text                               │
│                    - to: group_chat_id                               │
│                    - body: mensaje                                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Grupos de WhatsApp                               │
│                     (uno por club activo)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Weekly Attendance Reminder

### Propósito

Enviar un recordatorio semanal a todos los grupos de WhatsApp activos para que los jugadores marquen su ausencia si no pueden asistir a alguna clase.

### Cuándo se ejecuta

- **Día**: Lunes (día 1 en cron)
- **Hora**: 8:00 AM hora de Madrid (7:00 UTC en invierno, 6:00 UTC en verano)
- **Frecuencia**: Semanal

### Workflow: `.github/workflows/daily-reminder.yml`

```yaml
name: Weekly Attendance Reminder

on:
  schedule:
    # 0 7 * * 1 = 7:00 AM UTC on Mondays = 8:00 AM Madrid (horario de invierno)
    - cron: '0 7 * * 1'

  workflow_dispatch:  # Permite ejecución manual
```

### Edge Function: `daily-attendance-reminder`

**Archivo**: `supabase/functions/daily-attendance-reminder/index.ts`

**Flujo de ejecución**:

```
1. Verificar día de la semana
   └─ Si NO es lunes → return { skipped: true }
   └─ Si es lunes → continuar

2. Obtener grupos de WhatsApp activos
   └─ SELECT * FROM whatsapp_groups WHERE is_active = true

3. Para cada grupo:
   └─ Enviar mensaje via Whapi
   └─ Delay de 1 segundo entre mensajes (rate limiting)

4. Retornar resumen de envíos
```

### Mensaje enviado

```
👋 ¡Buenas, equipo!

Como cada semana, recordad que la asistencia a las clases está confirmada por defecto 💪
👉 Solo tenéis que comunicar vuestra ausencia desde PadeLock si no podéis venir.

🔗 https://www.padelock.com/auth

Si tenéis cualquier duda con la aplicación, podéis escribirnos por privado a este número.

¡Nos vemos en pista! 🎾🔥
```

### Verificación de día

La función tiene doble verificación de que es lunes:

1. **GitHub Actions**: Solo se ejecuta los lunes (`cron: '0 7 * * 1'`)
2. **Edge Function**: Verifica `today.getDay() === 1` antes de enviar

```javascript
const today = new Date();
const dayOfWeek = today.getDay();

if (dayOfWeek !== 1) {
  console.log(`⏸️ Skipping reminder - today is not Monday (day: ${dayOfWeek})`);
  return { skipped: true, message: 'Reminders are only sent on Mondays' };
}
```

---

## WhatsApp Daily Reports

### Propósito

Enviar reportes diarios a los entrenadores con el resumen de:
- Estadísticas del día (clases, participantes, ausencias, etc.)
- Clases con huecos disponibles
- Lista de espera
- Acciones sugeridas

### Cuándo se ejecuta

- **Días**: Lunes a Viernes
- **Horarios**:
  - **Morning report**: 10:00 AM hora de Madrid (9:00 UTC invierno)
  - **Afternoon report**: 13:00 PM hora de Madrid (12:00 UTC invierno)

### Workflow: `.github/workflows/whatsapp-daily-reports.yml`

```yaml
name: WhatsApp Daily Reports

on:
  schedule:
    # Morning report at 10:00 AM Madrid time
    - cron: '0 9 * * 1-5'

    # Afternoon report at 13:00 Madrid time
    - cron: '0 12 * * 1-5'

  workflow_dispatch:
    inputs:
      reportType:
        description: 'Report type (morning or afternoon)'
        required: true
        default: 'morning'
        type: choice
        options:
          - morning
          - afternoon
```

### Edge Functions involucradas

#### 1. `trigger-scheduled-reports`

**Archivo**: `supabase/functions/trigger-scheduled-reports/index.ts`

**Propósito**: Punto de entrada llamado por GitHub Actions. Orquesta el envío de reportes a todos los clubs configurados.

**Flujo**:

```
1. Validar cronSecret (seguridad)

2. Verificar día de la semana
   └─ Si es fin de semana → return { skipped: true }
   └─ Si es día laborable → continuar

3. Obtener clubs con reportes configurados
   └─ SELECT club_id FROM whatsapp_report_groups
      WHERE is_active = true
      AND send_morning_report = true (o send_afternoon_report según tipo)

4. Para cada club:
   └─ Invocar generate-daily-report con { clubId, reportType }

5. Retornar resumen de envíos por club
```

#### 2. `generate-daily-report`

**Archivo**: `supabase/functions/generate-daily-report/index.ts`

**Propósito**: Generar y enviar el reporte diario para un club específico.

**Flujo**:

```
1. Obtener grupos WhatsApp del club
   └─ SELECT * FROM whatsapp_report_groups
      WHERE club_id = clubId AND is_active = true

2. Para cada grupo:
   └─ Verificar si debe enviar (send_morning_report / send_afternoon_report)
   └─ Recopilar datos del reporte (data-collector.ts)
   └─ Generar acciones sugeridas
   └─ Formatear mensaje (report-generator.ts)
   └─ Enviar via Whapi

3. Retornar resultados por grupo
```

### Estructura del reporte

```
☀️ *¡Buenos días, [Nombre Club]!*
🎾 *RESUMEN DE LAS 10*
📅 Lunes, 9 de Diciembre 2024

📊 *ESTADÍSTICAS DEL DÍA*
━━━━━━━━━━━━━━━━━━
🎾 Clases hoy: *5*
👥 Total alumnos: *20*
✅ Asistirán: *15*
❌ No asistirán: *3*
⏳ Pendientes: *2*
📈 Tasa de respuesta: *90%*
🏆 Clases completas: *3*
⏰ En lista de espera: *2*

━━━━━━━━━━━━━━━━━━
🔴 *CLASES CON HUECOS*
━━━━━━━━━━━━━━━━━━

🌅 *Clase Iniciación - 09:00*
👤 entrenador: Juan Pérez
📊 Ocupación: 3/4 (1 hueco)

🚫 Rechazos:
   • María García - Lesión

━━━━━━━━━━━━━━━━━━
⏳ *LISTAS DE ESPERA*
━━━━━━━━━━━━━━━━━━

🔹 Pedro López
   Clase: Avanzado - 18:00
   Esperando: 2 días 3 horas

━━━━━━━━━━━━━━━━━━
💡 *ACCIONES SUGERIDAS*
━━━━━━━━━━━━━━━━━━

• Clase 09:00 tiene 2 plazas libres - buscar suplentes
• Contactar a Pedro López - lleva 2 días en espera
```

### Diferencias Morning vs Afternoon

| Aspecto | Morning (10:00) | Afternoon (13:00) |
|---------|-----------------|-------------------|
| Saludo | "Buenos días" | "Buenas tardes" |
| Emoji | ☀️ | 🌤️ |
| Título | RESUMEN DE LAS 10 | RESUMEN DE LAS 13 |
| Clases con huecos | Todas las del día | Solo clases >= 13:00 |

---

## Tablas de Base de Datos

### Tabla: `whatsapp_groups`

**Propósito**: Grupos de WhatsApp para el Weekly Attendance Reminder.

```sql
CREATE TABLE whatsapp_groups (
  id UUID PRIMARY KEY,
  group_chat_id TEXT NOT NULL,     -- ID del grupo WhatsApp (ej: "34666777888-1234567890@g.us")
  group_name TEXT NOT NULL,
  club_id UUID REFERENCES clubs(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
);
```

**Uso**: Un registro por grupo de WhatsApp de jugadores. Se usa para enviar el recordatorio semanal.

---

### Tabla: `whatsapp_report_groups`

**Propósito**: Configuración de reportes diarios por club para entrenadores/owners.

```sql
CREATE TABLE whatsapp_report_groups (
  id UUID PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) UNIQUE,
  group_name TEXT NOT NULL,
  whatsapp_group_id TEXT NOT NULL,  -- ID del grupo WhatsApp
  is_active BOOLEAN DEFAULT true,

  -- Configuración de reportes
  send_morning_report BOOLEAN DEFAULT true,
  send_afternoon_report BOOLEAN DEFAULT true,
  morning_report_time TIME DEFAULT '10:00:00',
  afternoon_report_time TIME DEFAULT '13:00:00',
  timezone TEXT DEFAULT 'Europe/Madrid',

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Uso**: Un registro por club. Configura qué reportes recibe y a qué hora.

---

### Tabla: `cron_debug_logs`

**Propósito**: Logs de debugging para las ejecuciones de cron jobs.

```sql
CREATE TABLE cron_debug_logs (
  id UUID PRIMARY KEY,
  function_name TEXT NOT NULL,
  log_level TEXT,               -- 'info', 'error', 'warning'
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso**: Registrar eventos importantes durante la ejecución de los cron jobs para debugging.

---

## Edge Functions

### Resumen de funciones

| Función | Propósito | Llamada por |
|---------|-----------|-------------|
| `daily-attendance-reminder` | Recordatorio semanal a jugadores | GitHub Actions (Lunes) |
| `trigger-scheduled-reports` | Orquestar reportes diarios | GitHub Actions (L-V) |
| `generate-daily-report` | Generar y enviar un reporte | `trigger-scheduled-reports` |

### Archivos de `generate-daily-report`

| Archivo | Propósito |
|---------|-----------|
| `index.ts` | Punto de entrada, orquestación |
| `data-collector.ts` | Recopilar datos de clases del día |
| `report-generator.ts` | Formatear mensaje de WhatsApp |
| `whapi-client.ts` | Cliente para API de Whapi |
| `types.ts` | Tipos TypeScript |

### Variables de entorno necesarias

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Whapi
WHAPI_TOKEN=xxx
WHAPI_ENDPOINT=https://gate.whapi.cloud

# Seguridad
CRON_SECRET=xxx

# App
APP_BASE_URL=https://www.padelock.com
```

---

## Configuración de Workflows

### Sintaxis cron

```
┌───────── minuto (0 - 59)
│ ┌─────── hora (0 - 23)
│ │ ┌───── día del mes (1 - 31)
│ │ │ ┌─── mes (1 - 12)
│ │ │ │ ┌─ día de la semana (0 - 6, 0 = Domingo)
│ │ │ │ │
* * * * *
```

### Ejemplos

| Cron | Descripción |
|------|-------------|
| `0 7 * * 1` | 7:00 UTC cada Lunes |
| `0 9 * * 1-5` | 9:00 UTC Lunes a Viernes |
| `0 12 * * 2-5` | 12:00 UTC Martes a Viernes |

### Horarios UTC vs Madrid

| Horario Madrid | UTC Invierno (Nov-Mar) | UTC Verano (Apr-Oct) |
|----------------|------------------------|----------------------|
| 8:00 AM | 7:00 | 6:00 |
| 10:00 AM | 9:00 | 8:00 |
| 13:00 PM | 12:00 | 11:00 |

### Modificar horarios temporalmente

Para festivos o cambios temporales, editar el archivo `.yml` correspondiente:

```yaml
# TEMPORAL: Semana del 9-13 dic 2024, ejecutar MARTES porque lunes 8 es festivo
# TODO: Volver a cambiar a '0 7 * * 1' después del 10 de diciembre
- cron: '0 7 * * 2'  # Martes en lugar de Lunes
```

---

## Casos de Uso Comunes

### Caso 1: Añadir un nuevo club a los reportes diarios

**Pasos**:
1. Crear grupo de WhatsApp con el número de Whapi
2. Obtener el `group_chat_id` del grupo
3. Insertar registro en `whatsapp_report_groups`:

```sql
INSERT INTO whatsapp_report_groups (
  club_id,
  group_name,
  whatsapp_group_id,
  send_morning_report,
  send_afternoon_report
) VALUES (
  'uuid-del-club',
  'Reportes Club XYZ',
  '34666777888-1234567890@g.us',
  true,
  true
);
```

---

### Caso 2: Desactivar reportes para un club

```sql
UPDATE whatsapp_report_groups
SET is_active = false
WHERE club_id = 'uuid-del-club';
```

---

### Caso 3: Cambiar horario de reporte de un club

```sql
UPDATE whatsapp_report_groups
SET
  morning_report_time = '09:30:00',
  afternoon_report_time = '14:00:00'
WHERE club_id = 'uuid-del-club';
```

**Nota**: Esto solo afecta a la configuración guardada. El cron de GitHub Actions seguirá ejecutándose a las horas globales (10:00 y 13:00).

---

### Caso 4: Ejecutar reporte manualmente

**Desde GitHub Actions**:
1. Ir a Actions → WhatsApp Daily Reports
2. Click en "Run workflow"
3. Seleccionar tipo de reporte (morning/afternoon)
4. Click en "Run workflow"

**Desde curl**:
```bash
curl -X POST \
  "https://xxx.supabase.co/functions/v1/generate-daily-report" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clubId": "uuid-del-club", "reportType": "morning", "manual": true}'
```

---

### Caso 5: Festivo - Saltar un día

**Para Weekly Attendance Reminder**:
```yaml
# Cambiar de lunes (1) a martes (2)
- cron: '0 7 * * 2'
```

**Para WhatsApp Daily Reports**:
```yaml
# Cambiar de L-V (1-5) a M-V (2-5)
- cron: '0 9 * * 2-5'
- cron: '0 12 * * 2-5'
```

**Importante**: Añadir comentario `# TODO:` para recordar revertir después del festivo.

---

## Troubleshooting

### Problema 1: Recordatorio no se envió el lunes

**Síntomas**:
- No llegó mensaje al grupo de WhatsApp
- No hay logs en `cron_debug_logs`

**Diagnóstico**:

1. Verificar que el workflow se ejecutó:
   - Ir a GitHub → Actions → Weekly Attendance Reminder
   - Ver historial de ejecuciones

2. Verificar logs de la función:
```sql
SELECT * FROM cron_debug_logs
WHERE function_name = 'daily-attendance-reminder'
ORDER BY created_at DESC
LIMIT 10;
```

3. Verificar grupos activos:
```sql
SELECT * FROM whatsapp_groups
WHERE is_active = true;
```

**Causas posibles**:
1. `SUPABASE_SERVICE_ROLE_KEY` no configurado en GitHub Secrets
2. `WHAPI_TOKEN` no configurado en Supabase
3. No hay grupos activos en `whatsapp_groups`
4. Error de red con Whapi

---

### Problema 2: Reporte diario no llegó

**Síntomas**:
- No llegó el reporte de las 10:00 o 13:00

**Diagnóstico**:

1. Verificar ejecución del workflow:
   - GitHub → Actions → WhatsApp Daily Reports

2. Verificar configuración del club:
```sql
SELECT * FROM whatsapp_report_groups
WHERE club_id = 'uuid-del-club';
```

3. Verificar que `send_morning_report` o `send_afternoon_report` es `true`

4. Verificar logs de Edge Functions en Supabase Dashboard

---

### Problema 3: Error "Invalid cron secret"

**Causa**: El `CRON_SECRET` del workflow no coincide con el de Supabase.

**Solución**:
1. Verificar secret en GitHub: Settings → Secrets → CRON_SECRET
2. Verificar variable de entorno en Supabase Dashboard
3. Asegurar que ambos valores son idénticos

---

### Problema 4: Mensaje enviado pero no llega al grupo

**Causa posible**: `group_chat_id` incorrecto.

**Verificación**:
1. El formato debe ser: `34XXXXXXXXX-XXXXXXXXXX@g.us`
2. Verificar que el número de Whapi es miembro del grupo
3. Verificar que el grupo no está archivado

**Obtener group_chat_id correcto**:
```bash
curl -X GET "https://gate.whapi.cloud/groups" \
  -H "Authorization: Bearer $WHAPI_TOKEN"
```

---

### Problema 5: Reporte se envía en fin de semana

**Causa**: La verificación de día está fallando.

**Verificación**:
1. La función `trigger-scheduled-reports` tiene verificación:
```javascript
if (dayOfWeek === 0 || dayOfWeek === 6) {
  return { skipped: true };
}
```

2. Verificar timezone del servidor

**Solución temporal**: Desactivar el workflow el fin de semana desde GitHub Actions.

---

## Archivos de Referencia

### Workflows
- `.github/workflows/daily-reminder.yml` - Recordatorio semanal
- `.github/workflows/whatsapp-daily-reports.yml` - Reportes diarios

### Edge Functions
- `supabase/functions/daily-attendance-reminder/index.ts`
- `supabase/functions/trigger-scheduled-reports/index.ts`
- `supabase/functions/generate-daily-report/index.ts`
- `supabase/functions/generate-daily-report/data-collector.ts`
- `supabase/functions/generate-daily-report/report-generator.ts`
- `supabase/functions/generate-daily-report/whapi-client.ts`

### Migraciones
- `supabase/migrations/20250106200000_create_daily_reports_system.sql`
- `supabase/migrations/20250119000000_create_attendance_reminders_cron.sql`

### Tests
- `tests-manuales/test-attendance-reminder.js`
- `tests-manuales/test-attendance-reminder-node.js`
- `tests-manuales/test-reminder-function.cjs`

---

## Changelog

### 2024-12-05
- ✅ Modificación temporal: Weekly Reminder se ejecuta martes 9/12 (festivo lunes 8)
- ✅ Modificación temporal: Daily Reports empiezan martes 9/12

### 2025-01-19
- ✅ Creado sistema de recordatorios de asistencia con cron

### 2025-01-06
- ✅ Creado sistema de reportes diarios por WhatsApp
- ✅ Tabla `whatsapp_report_groups` para configuración

---

**Última actualización**: 2024-12-05
**Mantenedor**: Equipo de desarrollo
**Versión**: 1.0
