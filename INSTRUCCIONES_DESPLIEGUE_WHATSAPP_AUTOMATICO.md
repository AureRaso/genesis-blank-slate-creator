# 📱 Sistema de Notificaciones WhatsApp Automáticas por Nivel

## 🎯 Qué hace este sistema

Cuando un jugador, profesor o admin marca a un jugador como **ausente**:

1. ⏱️ **Espera automáticamente 10 minutos**
2. 🤖 **Si no se envió manualmente** el mensaje en esos 10 minutos, **lo envía automáticamente**
3. 🎯 **Detecta el nivel del jugador** y lo envía al grupo correspondiente:
   - **Nivel 1** → Grupo "Nivel Bronce Hespérides"
   - **Nivel 2** → Grupo "Nivel Plata Hespérides"
   - **Nivel 3** → Grupo "Nivel Oro Hespérides"
   - **Nivel 4** → Grupo "Menores Hespérides"

---

## 📋 Pasos de Despliegue

### 1️⃣ Base de Datos (SQL Scripts)

Ejecuta estos scripts **EN ORDEN** en el SQL Editor de Supabase:

#### Script 1: Crear tabla de notificaciones pendientes
```bash
Archivo: 01_create_pending_notifications_table.sql
```

Este script crea la tabla `pending_whatsapp_notifications` que gestiona las notificaciones automáticas.

**Verificación**: Ejecuta esto para confirmar que se creó:
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'pending_whatsapp_notifications'
);
```

#### Script 2: Añadir columna de nivel a grupos WhatsApp
```bash
Archivo: 02_add_level_target_to_whatsapp_groups.sql
```

Añade la columna `level_target` a la tabla `whatsapp_groups`.

**Verificación**:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_groups'
AND column_name = 'level_target';
```

#### Script 3: Asignar niveles a grupos existentes
```bash
Archivo: 03_assign_levels_to_whatsapp_groups.sql
```

Asigna los niveles a tus 4 grupos de WhatsApp de Hespérides.

**Verificación**:
```sql
SELECT group_name, level_target
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY level_target;
```

Deberías ver:
- Nivel Bronce Hespérides → 1
- Nivel Plata Hespérides → 2
- Nivel Oro Hespérides → 3
- Menores Hespérides → 4

#### Script 4: Crear trigger de base de datos
```bash
Archivo: 04_create_absence_notification_trigger.sql
```

Crea el trigger que detecta cuando se marca una ausencia y crea automáticamente la notificación pendiente.

**Verificación**:
```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_absence_marked';
```

---

### 2️⃣ Edge Function (Supabase)

#### Desplegar la Edge Function

1. **Instala Supabase CLI** (si no lo tienes):
```bash
npm install -g supabase
```

2. **Login en Supabase**:
```bash
supabase login
```

3. **Link al proyecto**:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Puedes encontrar tu `PROJECT_REF` en: Supabase Dashboard > Settings > General > Project ID

4. **Desplegar la función**:
```bash
supabase functions deploy auto-send-whatsapp-notifications
```

5. **Configurar variables de entorno en Supabase**:

Ve a: Supabase Dashboard > Edge Functions > auto-send-whatsapp-notifications > Settings

Añade estas secrets:
```
WHAPI_TOKEN=tu_token_de_whapi
APP_URL=https://tu-app.lovable.app (o tu dominio)
```

**Verificación**: Ejecuta manualmente la función:
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-whatsapp-notifications' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

Debería responder con: `{"success":true,"message":"No pending notifications","processed":0}`

---

### 3️⃣ Configurar Cron Job

Tienes 3 opciones para ejecutar la Edge Function cada minuto:

#### **Opción A: pg_cron (Recomendado)**

1. Ve a Supabase Dashboard > Database > Extensions
2. Busca `pg_cron` y haz clic en **Enable**
3. Ejecuta el script:
```bash
Archivo: 05_setup_cron_job.sql
```

**⚠️ IMPORTANTE**: Antes de ejecutarlo, reemplaza:
- `YOUR_PROJECT_REF` con tu referencia de proyecto
- `YOUR_ANON_KEY` con tu anon key (Settings > API)

**Verificación**:
```sql
SELECT jobid, schedule, command, active
FROM cron.job
WHERE jobname = 'auto-send-whatsapp-notifications';
```

#### **Opción B: External Cron Service**

Si no puedes usar pg_cron, usa un servicio externo:

1. **cron-job.org** (gratuito):
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-whatsapp-notifications`
   - Interval: Cada 1 minuto
   - Header: `Authorization: Bearer YOUR_ANON_KEY`
   - Method: POST

2. **EasyCron** (gratuito hasta 100 crons):
   - Similar configuración

#### **Opción C: GitHub Actions**

Crea `.github/workflows/cron-whatsapp.yml`:
```yaml
name: Auto Send WhatsApp Notifications
on:
  schedule:
    - cron: '* * * * *'  # Cada minuto

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-whatsapp-notifications
```

---

## ✅ Verificación Completa del Sistema

### Test End-to-End

1. **Marca un jugador como ausente** en el dashboard de asistencia
2. **Verifica que se creó la notificación pendiente**:
```sql
SELECT
  id,
  student_level,
  scheduled_for,
  status,
  class_data->>'class_name' as class_name,
  class_data->>'student_name' as student_name,
  class_data->>'target_group_name' as target_group
FROM pending_whatsapp_notifications
ORDER BY created_at DESC
LIMIT 5;
```

3. **Espera 10 minutos** (o ejecuta manualmente la Edge Function)

4. **Verifica que se envió el mensaje**:
```sql
SELECT
  id,
  status,
  sent_at,
  error_message
FROM pending_whatsapp_notifications
WHERE status = 'sent'
ORDER BY sent_at DESC
LIMIT 5;
```

5. **Verifica en WhatsApp** que llegó el mensaje al grupo correcto

---

## 🧪 Test Manual (Envío Inmediato)

Para probar el envío manual y verificar que cancela el automático:

1. **Marca un jugador como ausente**
2. **Inmediatamente haz clic en "Notificar ausencia"** (antes de 10 minutos)
3. **Verifica que la notificación se marcó como `manual_sent`**:
```sql
SELECT status, sent_at
FROM pending_whatsapp_notifications
WHERE class_id = 'ID_DE_TU_CLASE'
ORDER BY created_at DESC;
```

Debería mostrar `status = 'manual_sent'` y no debería enviar otro mensaje después de 10 minutos.

---

## 📊 Monitoreo y Debugging

### Ver todas las notificaciones pendientes
```sql
SELECT
  id,
  class_data->>'class_name' as clase,
  class_data->>'student_name' as alumno,
  student_level as nivel,
  status,
  scheduled_for,
  created_at,
  sent_at
FROM pending_whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Ver errores de envío
```sql
SELECT
  id,
  class_data->>'class_name' as clase,
  error_message,
  created_at
FROM pending_whatsapp_notifications
WHERE status = 'error'
ORDER BY created_at DESC;
```

### Ver estadísticas
```sql
SELECT
  status,
  COUNT(*) as cantidad,
  MAX(created_at) as ultimo
FROM pending_whatsapp_notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Logs de la Edge Function

Ve a: Supabase Dashboard > Edge Functions > auto-send-whatsapp-notifications > Logs

---

## 🚨 Troubleshooting

### Problema: Las notificaciones no se están enviando automáticamente

**Solución**:
1. Verifica que el cron job está activo:
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-send-whatsapp-notifications';
```

2. Verifica los logs de la Edge Function en Supabase Dashboard

3. Prueba ejecutar manualmente la función:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-whatsapp-notifications
```

### Problema: Los mensajes se envían al grupo incorrecto

**Solución**:
1. Verifica los niveles asignados:
```sql
SELECT group_name, level_target
FROM whatsapp_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
```

2. Verifica el nivel del jugador:
```sql
SELECT full_name, level
FROM student_enrollments
WHERE email = 'email_del_jugador';
```

### Problema: El trigger no se dispara

**Solución**:
1. Verifica que el trigger existe:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_absence_marked';
```

2. Prueba marcar manualmente una ausencia y revisa los logs de Postgres

### Problema: Error de permisos RLS

**Solución**:
Verifica que las políticas RLS están correctas:
```sql
SELECT * FROM pg_policies WHERE tablename = 'pending_whatsapp_notifications';
```

---

## 📝 Mantenimiento

### Limpiar notificaciones antiguas (opcional)

Ejecuta esto mensualmente para limpiar notificaciones viejas:
```sql
DELETE FROM pending_whatsapp_notifications
WHERE created_at < NOW() - INTERVAL '30 days';
```

O crea un cron job para hacerlo automáticamente:
```sql
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 0 1 * *',  -- Primer día de cada mes a medianoche
  $$
  DELETE FROM pending_whatsapp_notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
  $$
);
```

---

## 🎉 ¡Listo!

Tu sistema de notificaciones WhatsApp automáticas por nivel está completamente configurado.

### Resumen del flujo:

1. 👤 Usuario marca ausencia
2. 🔔 Trigger crea notificación pendiente (envío en 10 min)
3. ⏰ Cron ejecuta Edge Function cada minuto
4. 🤖 Edge Function busca notificaciones pendientes > 10 min
5. 🎯 Detecta nivel del jugador → Selecciona grupo WhatsApp
6. 📱 Envía mensaje al grupo correcto
7. ✅ Marca notificación como enviada

### Si el admin envía manualmente:
1. 👤 Admin hace clic en "Notificar ausencia"
2. 🔄 Frontend marca notificación como `manual_sent`
3. ⏭️ Cron Job detecta `manual_sent` y NO envía duplicado

¡Perfecto! 🚀
