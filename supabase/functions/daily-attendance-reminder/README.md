# Daily Attendance Reminder

Esta Edge Function envía automáticamente recordatorios diarios a todos los grupos de WhatsApp activos para que los alumnos confirmen su asistencia.

## Funcionalidad

- Se ejecuta automáticamente todos los días a las **9:00 AM** (hora de Madrid)
- Envía un mensaje de recordatorio a **todos los grupos de WhatsApp activos**
- El mensaje incluye:
  - Saludo personalizado con la fecha actual
  - Recordatorio de confirmar asistencia
  - Link directo a la aplicación
  - Instrucciones claras sobre cómo confirmar/notificar ausencia

## Mensaje que se envía

```
🎾 ¡Buenos días!

📅 Hoy es *[fecha completa]*

⏰ *Recordatorio de asistencia*

Por favor, confirma tu asistencia a las clases de hoy entrando en la aplicación:
👉 [URL de la app]

✅ Confirmar asistencia
❌ Notificar ausencia

Es importante que confirmes lo antes posible para que podamos organizar mejor las clases.

¡Nos vemos en la pista! 🎾
```

## Configuración del Cron Job

El cron job está configurado en la migración `20251030120000_setup_daily_attendance_reminder_cron.sql`:

```sql
-- Se ejecuta a las 8:00 AM UTC = 9:00 AM Madrid (horario de invierno UTC+1)
'0 8 * * *'
```

### Ajuste para horario de verano

Durante el horario de verano (UTC+2), si quieres que siga enviándose a las 9:00 AM, debes ajustar a:
```sql
'0 7 * * *'  -- 7:00 AM UTC = 9:00 AM Madrid (horario de verano)
```

## Variables de entorno requeridas

La función requiere las siguientes variables de entorno en Supabase:

- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase
- `WHAPI_TOKEN`: Token de autenticación de Whapi.cloud
- `WHAPI_ENDPOINT`: Endpoint de Whapi.cloud (por defecto: https://gate.whapi.cloud)
- `APP_BASE_URL`: URL base de tu aplicación (por defecto: https://genesis-blank-slate-creator.lovable.app)

## Despliegue

Para desplegar la función:

```bash
npx supabase functions deploy daily-attendance-reminder
```

## Testing Manual

Puedes probar la función manualmente invocándola:

```bash
curl -X POST 'https://[your-project].supabase.co/functions/v1/daily-attendance-reminder' \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json"
```

## Monitoreo

Para ver los logs de ejecución:

```bash
npx supabase functions logs daily-attendance-reminder
```

Para ver los cron jobs programados en la base de datos:

```sql
SELECT * FROM cron.job;
```

Para ver el historial de ejecuciones:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-attendance-reminder')
ORDER BY start_time DESC
LIMIT 10;
```

## Desactivar/Reactivar

Para desactivar temporalmente el recordatorio:

```sql
SELECT cron.unschedule('daily-attendance-reminder');
```

Para reactivarlo:

```sql
SELECT cron.schedule(
  'daily-attendance-reminder',
  '0 8 * * *',
  $$SELECT invoke_daily_attendance_reminder();$$
);
```

## Grupos afectados

La función envía mensajes a todos los grupos de WhatsApp que cumplan:
- `is_active = true` en la tabla `whatsapp_groups`
- Tienen un `group_chat_id` válido

## Manejo de errores

- Si falla el envío a un grupo específico, continúa con los demás
- Añade un delay de 1 segundo entre mensajes para evitar rate limiting
- Los errores se registran en los logs pero no detienen el proceso completo
- Retorna un resumen con el número de éxitos y fallos

## Respuesta de la función

```json
{
  "success": true,
  "message": "Daily attendance reminders sent",
  "totalGroups": 5,
  "successCount": 5,
  "failureCount": 0,
  "results": [
    {
      "groupId": "uuid",
      "groupName": "Grupo Pádel Madrid",
      "success": true,
      "messageId": "whatsapp_message_id"
    }
  ]
}
```
