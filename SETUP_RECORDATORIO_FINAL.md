# ✅ Configuración Final del Recordatorio Diario - cron-job.org

## Por qué cron-job.org

Después de probar pg_cron, encontramos que tiene limitaciones para invocar Edge Functions con autenticación correctamente. **cron-job.org** es la solución más confiable porque:

- ✅ **Funciona 100%** (ya probamos que la invocación manual funciona)
- ✅ **Gratis ilimitado** para este uso
- ✅ **Logs detallados** de cada ejecución
- ✅ **Notificaciones por email** si falla
- ✅ **Interfaz visual** para gestionar horarios
- ✅ **No depende** de configuraciones de Supabase

## 📋 Pasos de configuración (5 minutos)

### 1. Crear cuenta en cron-job.org

1. Ve a: **https://cron-job.org/en/signup/**
2. Rellena el formulario:
   - Email
   - Username
   - Password
3. Confirma tu email
4. Inicia sesión

### 2. Crear el cronjob

1. Una vez dentro, haz clic en **"Cronjobs"** en el menú superior
2. Haz clic en **"Create cronjob"** (botón verde)

### 3. Configuración del cronjob

#### Pestaña "General"

**Title (Título)**:
```
Recordatorio Diario Asistencia - PadelLock
```

**Address (URL)**:
```
https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder
```

#### Pestaña "Schedule"

**Enable job**: ✅ Marcado

**Execution schedule**:
- **Minutes**: `00` (o el minuto que prefieras)
- **Hours**: `08` (para 9:00 AM Madrid en horario de invierno)
  - ℹ️ **Importante**: En horario de verano (UTC+2), cambia a `07`
- **Days**: `Every day` (todos los días)
- **Months**: `Every month` (todos los meses)
- **Weekdays**: `Every day` (todos los días de la semana)

**Timezone**: `Europe/Madrid` ⚠️ MUY IMPORTANTE seleccionar Madrid

#### Pestaña "Advanced"

**Request method**: Selecciona `POST` del dropdown

**Authentication**: Dejar en `None`

**Request headers** (¡CRÍTICO!):

Haz clic en **"+ Add header"** DOS veces para añadir estos headers:

**Header 1**:
- Name: `Authorization`
- Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc0MjY4NSwiZXhwIjoyMDM1MzE4Njg1fQ.Lh-LKVpEFjVz1r5f9FdLHu9OJ4Mg_KS8JvBX-ZCZ-i4`

**Header 2**:
- Name: `Content-Type`
- Value: `application/json`

**Request body**:
```json
{}
```

**Request timeout**: `30` segundos

**Follow redirects**: ✅ Marcado

**Save responses**: ✅ Marcado (para ver logs)

#### Pestaña "Notifications"

**On failure**: ✅ Marcado
- Selecciona tu email para recibir notificaciones si falla

**On success**: ⬜ No marcar (o recibirás un email cada día)

**On disable**: ✅ Marcado

### 4. Guardar

Haz clic en **"Create cronjob"** al final de la página.

## 🧪 Probar AHORA (testing inmediato)

1. En la lista de cronjobs, encuentra tu job recién creado
2. En la columna de la derecha, haz clic en el icono de **play** ▶️ o en el menú "..." → **"Run now"**
3. **¡Los mensajes se enviarán inmediatamente a todos los grupos de WhatsApp!**
4. Verás el resultado en la columna "Last execution":
   - ✅ Verde = Success
   - ❌ Rojo = Failed

## 📊 Ver resultados y logs

### Ver el último resultado:

1. Haz clic en tu cronjob
2. Ve a la pestaña **"History"**
3. Verás todas las ejecuciones con:
   - **Status**: Success/Failed
   - **Date**: Fecha y hora de ejecución
   - **Duration**: Cuánto tardó
   - **HTTP Status**: 200 = OK
   - **Response**: Click en "Show" para ver la respuesta JSON completa

### Ejemplo de respuesta exitosa:

```json
{
  "success": true,
  "message": "Daily attendance reminders sent",
  "totalGroups": 4,
  "successCount": 4,
  "failureCount": 0,
  "results": [
    {
      "groupId": "...",
      "groupName": "Grupo WhatsApp Hespérides",
      "success": true,
      "messageId": "..."
    },
    ...
  ]
}
```

## 🔧 Ajustes y configuración

### Cambiar la hora:

1. Haz clic en tu cronjob
2. Haz clic en **"Edit"** (botón arriba a la derecha)
3. Ve a la pestaña "Schedule"
4. Cambia el campo **"Hours"**
5. Haz clic en **"Save"**

**Ejemplos de horarios**:
- `08` = 9:00 AM (horario invierno UTC+1)
- `07` = 9:00 AM (horario verano UTC+2)
- `09` = 10:00 AM (horario invierno)
- `07` = 8:00 AM (horario invierno)

### Desactivar temporalmente:

1. Haz clic en tu cronjob
2. Haz clic en **"Edit"**
3. Desmarca **"Enable job"**
4. Guarda

### Cambiar el mensaje:

El mensaje se genera en la Edge Function. Para cambiarlo:

1. Edita el archivo: `supabase/functions/daily-attendance-reminder/index.ts`
2. Busca la sección `const message =` (línea ~90)
3. Modifica el texto
4. Despliega: `npx supabase functions deploy daily-attendance-reminder`

## ❌ Eliminar el cronjob de pg_cron

Para limpiar y evitar ejecuciones duplicadas, ejecuta en Supabase SQL Editor:

```sql
-- Eliminar el job de test
SELECT cron.unschedule('daily-attendance-reminder-test');

-- Eliminar el job de producción si existe
SELECT cron.unschedule('daily-attendance-reminder');

-- Verificar que no hay jobs activos
SELECT * FROM cron.job WHERE jobname LIKE '%reminder%';
```

## 🎯 Resumen

- ✅ **Servicio**: cron-job.org (gratis)
- ✅ **URL**: https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder
- ✅ **Horario**: Todos los días a las 9:00 AM Madrid
- ✅ **Método**: POST con headers de autenticación
- ✅ **Resultado**: 4 grupos de WhatsApp reciben recordatorio automáticamente

## 🆘 Soporte

- **Dashboard cron-job.org**: https://cron-job.org/en/members/jobs/
- **Documentación**: https://cron-job.org/en/documentation/
- **Test manual**: http://localhost:8080/test-reminder (en desarrollo)

---

## 🎉 ¡Y listo!

Una vez configurado, el sistema:
- 📅 Enviará recordatorios automáticamente cada día a las 9 AM
- 📧 Te notificará por email si algo falla
- 📊 Guardará logs de todas las ejecuciones
- 🔄 Funcionará indefinidamente sin mantenimiento
