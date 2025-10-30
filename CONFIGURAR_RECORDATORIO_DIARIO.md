# Configuración del Recordatorio Diario de Asistencia

## ✅ Función creada y desplegada

La Edge Function `daily-attendance-reminder` ya está desplegada en Supabase y lista para usar.

## 📋 Pasos para configurar el recordatorio automático

### Opción 1: Usando el Dashboard de Supabase (Recomendado)

1. **Ir al Dashboard de Supabase**
   - Abre https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl
   - Ve a la sección "Database" → "Extensions"

2. **Habilitar pg_cron**
   - Busca "pg_cron" en la lista de extensiones
   - Haz clic en "Enable" si no está habilitada

3. **Crear el Cron Job**
   - Ve a "SQL Editor" en el menú lateral
   - Ejecuta el siguiente SQL:

```sql
-- Crear función para invocar la Edge Function
create or replace function public.invoke_daily_attendance_reminder()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  -- Invocar la Edge Function usando una extensión HTTP
  -- Nota: Esto requiere la extensión http (pgsql-http)
  select
    content::jsonb into result
  from
    http((
      'POST',
      current_setting('app.settings.supabase_url') || '/functions/v1/daily-attendance-reminder',
      ARRAY[
        http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
        http_header('Content-Type', 'application/json')
      ],
      'application/json',
      '{}'
    )::http_request);

  return result;
end;
$$;

-- Programar el cron job para las 8:00 AM UTC (9:00 AM hora de Madrid en invierno)
select cron.schedule(
  'daily-attendance-reminder',    -- nombre del job
  '0 8 * * *',                    -- cada día a las 8:00 AM UTC
  $$select public.invoke_daily_attendance_reminder();$$
);
```

4. **Configurar las variables necesarias**
   - Ve a "Settings" → "Vault" (o "Project Settings" → "API")
   - Asegúrate de que las siguientes variables estén configuradas:
     - `APP_BASE_URL`: URL de tu aplicación
     - Las credenciales de WHAPI ya deben estar configuradas

### Opción 2: Usando un servicio externo de Cron (Alternativa más simple)

Si tienes problemas con pg_cron, puedes usar un servicio externo como:

#### A. Usar Cron-job.org (Gratis)

1. Regístrate en https://cron-job.org
2. Crea un nuevo cron job con:
   - **URL**: `https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder`
   - **Method**: POST
   - **Headers**:
     - `Authorization: Bearer [tu-service-role-key]`
     - `Content-Type: application/json`
   - **Schedule**: Todos los días a las 9:00 AM
   - **Timezone**: Europe/Madrid

#### B. Usar EasyCron (Gratis para pocos jobs)

1. Regístrate en https://www.easycron.com
2. Configura similar a cron-job.org

#### C. Usar GitHub Actions (Gratis)

Crea un archivo `.github/workflows/daily-reminder.yml`:

```yaml
name: Daily Attendance Reminder

on:
  schedule:
    # Runs at 8:00 AM UTC (9:00 AM Madrid winter time)
    - cron: '0 8 * * *'
  workflow_dispatch: # Permite ejecutar manualmente

jobs:
  send-reminder:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Function
        run: |
          curl -X POST \
            'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

Luego añade el secret `SUPABASE_SERVICE_ROLE_KEY` en Settings → Secrets de tu repo.

## 🧪 Probar manualmente

Puedes probar el recordatorio manualmente en cualquier momento:

```bash
curl -X POST 'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

O desde el dashboard de Supabase:
1. Ve a "Edge Functions"
2. Busca "daily-attendance-reminder"
3. Haz clic en "Invoke" para probarlo

## 📊 Monitoreo

Para ver si los recordatorios se están enviando:

1. **Logs de la función**:
   - Dashboard → Edge Functions → daily-attendance-reminder → Logs
   - O con CLI: `npx supabase functions logs daily-attendance-reminder`

2. **Historial de cron jobs** (si usas pg_cron):
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-attendance-reminder')
ORDER BY start_time DESC
LIMIT 10;
```

## ⚙️ Personalizar el mensaje

Para cambiar el mensaje que se envía, edita el archivo:
`supabase/functions/daily-attendance-reminder/index.ts`

Busca la variable `message` (línea ~80) y modifícala según necesites.

Después de modificar, vuelve a desplegar:
```bash
npx supabase functions deploy daily-attendance-reminder
```

## 🕐 Ajustar la hora

Para cambiar la hora del recordatorio:

- **Horario de invierno (UTC+1)**: `'0 8 * * *'` = 9:00 AM Madrid
- **Horario de verano (UTC+2)**: `'0 7 * * *'` = 9:00 AM Madrid
- **Para las 10:00 AM**: `'0 9 * * *'` (invierno) o `'0 8 * * *'` (verano)

## ❌ Desactivar temporalmente

Si necesitas desactivar los recordatorios:

**Con pg_cron**:
```sql
SELECT cron.unschedule('daily-attendance-reminder');
```

**Con servicio externo**:
- Simplemente pausa o elimina el cron job en el dashboard del servicio

## 🔧 Troubleshooting

### Los mensajes no se envían

1. Verifica que WHAPI_TOKEN esté configurado en Supabase
2. Revisa los logs de la función
3. Verifica que hay grupos activos en `whatsapp_groups`
4. Prueba invocar la función manualmente

### El horario no coincide

- Verifica tu timezone en la configuración del cron
- Recuerda que UTC no ajusta por horario de verano/invierno automáticamente

### Error "WHAPI_TOKEN not configured"

1. Ve a Dashboard → Settings → Edge Functions → Environment Variables
2. Añade `WHAPI_TOKEN` con tu token de Whapi.cloud
