# Configuración del Cron Job para Recordatorios de Asistencia

## Resumen
Este cron job ejecuta la función `send-attendance-reminders` cada hora para enviar emails a los participantes 24 horas antes de sus clases.

## Pasos para configurar

### 1️⃣ Obtener credenciales de Supabase

En tu proyecto de Supabase (https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl):

1. Ve a **Settings** → **API**
2. Copia el **Project URL**: `https://hwwvtxyezhgmhyxjpnvl.supabase.co`
3. Copia el **service_role key** (secret key, NO la anon key)

### 2️⃣ Configurar las variables de entorno en la base de datos

Ve a **SQL Editor** en Supabase y ejecuta estos comandos (reemplaza los valores):

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'TU_SERVICE_ROLE_KEY_AQUI';
```

Para verificar que se configuraron correctamente:

```sql
SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings%';
```

### 3️⃣ Ejecutar el script de configuración

En el **SQL Editor** de Supabase, ejecuta el contenido completo del archivo:
```
setup-attendance-reminders-cron.sql
```

Este script:
- ✅ Habilita las extensiones `pg_cron` y `pg_net`
- ✅ Crea la función `trigger_attendance_reminders()`
- ✅ Programa el cron job para ejecutarse cada hora

### 4️⃣ Verificar que funciona

Ejecuta esta consulta para ver el cron job programado:

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname = 'attendance-reminders-hourly';
```

Deberías ver:
- **jobname**: `attendance-reminders-hourly`
- **schedule**: `0 * * * *` (cada hora)
- **active**: `true`

### 5️⃣ Probar manualmente (opcional)

Para probar que el sistema funciona sin esperar a la próxima hora:

```sql
SELECT trigger_attendance_reminders();
```

Esto ejecutará la función inmediatamente y deberías ver en los logs si envió algún email.

## 📊 Monitoreo

### Ver historial de ejecuciones

```sql
SELECT
  runid,
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'attendance-reminders-hourly')
ORDER BY start_time DESC
LIMIT 20;
```

### Ver logs de la función Edge

Ve a **Edge Functions** → **send-attendance-reminders** → **Logs** en el dashboard de Supabase.

## 🔧 Troubleshooting

### El cron job no está enviando emails

1. **Verifica que el cron job está activo:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'attendance-reminders-hourly';
   ```

2. **Verifica las configuraciones:**
   ```sql
   SHOW app.settings.supabase_url;
   SHOW app.settings.service_role_key;
   ```

3. **Revisa los logs de ejecución:**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'attendance-reminders-hourly')
   ORDER BY start_time DESC
   LIMIT 5;
   ```

4. **Prueba manualmente:**
   ```sql
   SELECT trigger_attendance_reminders();
   ```

### Desactivar/eliminar el cron job

Si necesitas desactivar temporalmente el cron job:

```sql
SELECT cron.unschedule('attendance-reminders-hourly');
```

Para volver a activarlo, ejecuta de nuevo el paso 3.

## 📅 Cómo funciona

1. **Cada hora (en punto)**: El cron job ejecuta la función `trigger_attendance_reminders()`
2. **La función**: Hace una llamada HTTP POST a la Edge Function `send-attendance-reminders`
3. **La Edge Function**:
   - Busca clases que comiencen en 24-25 horas
   - Filtra clases canceladas
   - Obtiene participantes confirmados (no ausentes)
   - Envía email a cada participante recordándole su clase
4. **El email**: Informa que están confirmados y pueden marcar ausencia en la app si no pueden asistir

## ⏰ Horario de ejecución

El cron job corre **cada hora** con el formato `0 * * * *`:
- 00:00, 01:00, 02:00, ..., 23:00

Esto asegura que se capturen todas las clases que están exactamente 24 horas antes, sin importar a qué hora del día empiecen.
