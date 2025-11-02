# Configurar Recordatorio Diario con Cron-Job.org

GitHub Actions no está ejecutándose. La solución más simple y confiable es usar **cron-job.org**, un servicio gratuito de cron jobs.

## 🚀 Pasos para configurar (5 minutos):

### 1. Crear cuenta en cron-job.org

1. Ve a: **https://cron-job.org/en/signup/**
2. Regístrate con tu email
3. Confirma tu email
4. Inicia sesión

### 2. Crear el Cron Job

1. Una vez dentro, haz clic en **"Cronjobs"** en el menú superior
2. Haz clic en **"Create cronjob"**
3. Configura los siguientes campos:

#### Configuración básica:

**Title (Título)**:
```
Recordatorio Diario Asistencia PadelLock
```

**Address (URL)**:
```
https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/daily-attendance-reminder
```

#### Schedule (Programación):

- **Enable job**: ✅ Activado
- **Minutes**: `00` (o el minuto que quieras)
- **Hours**: `08` (para 9:00 AM Madrid hora de invierno)
- **Days**: `Every day`
- **Months**: `Every month`

**Para las 9:00 AM Madrid:**
- Horario de invierno (UTC+1): Hora `08:00`
- Horario de verano (UTC+2): Hora `07:00`

#### Request settings (Configuración de la petición):

**Request method**: `POST`

**Request timeout**: `30` segundos

**Request headers** (¡IMPORTANTE!):

Haz clic en "Add header" y añade:

Header 1:
- **Key**: `Authorization`
- **Value**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc0MjY4NSwiZXhwIjoyMDM1MzE4Njg1fQ.Lh-LKVpEFjVz1r5f9FdLHu9OJ4Mg_KS8JvBX-ZCZ-i4`

Header 2:
- **Key**: `Content-Type`
- **Value**: `application/json`

**Request body**:
```json
{}
```

#### Notifications (Notificaciones):

- **On failure**: ✅ Activado
- **Email**: Tu email

#### Advanced settings (Configuración avanzada):

- **Save responses**: ✅ Activado (para ver los logs)
- **Timezone**: `Europe/Madrid`

### 3. Guardar

Haz clic en **"Create cronjob"** al final de la página.

## ✅ ¡Listo!

El sistema enviará automáticamente los recordatorios todos los días a la hora configurada.

## 🧪 Probar inmediatamente

Para probar que funciona AHORA mismo:

1. En la lista de cronjobs, encuentra tu job
2. Haz clic en los tres puntos `...` al lado derecho
3. Haz clic en **"Execute now"**
4. ¡Los mensajes se enviarán inmediatamente!
5. Verás el resultado en la columna "Last execution"

## 📊 Ver logs y resultados

1. En tu cronjob, haz clic en el nombre
2. Ve a la pestaña **"History"**
3. Verás todas las ejecuciones con:
   - ✅ Estado (Success/Failed)
   - 📅 Fecha y hora
   - 📝 Response body (cuántos mensajes se enviaron)
   - ⏱️ Tiempo de ejecución

## 🔧 Ajustar la hora

Para cambiar la hora:

1. Haz clic en tu cronjob
2. Haz clic en **"Edit"**
3. Cambia el campo **"Hours"**
4. Guarda

## 🛑 Desactivar temporalmente

1. Haz clic en tu cronjob
2. Haz clic en **"Edit"**
3. Desmarca **"Enable job"**
4. Guarda

## 📱 ¿Qué hace exactamente?

Cada día a las 9:00 AM:
1. cron-job.org llama a tu Edge Function de Supabase
2. La función busca todos los grupos de WhatsApp activos
3. Envía el recordatorio personalizado a cada grupo
4. Te notifica por email si algo falla

## 💰 ¿Es gratis?

Sí, totalmente gratis para este uso. El plan gratuito permite:
- ✅ Hasta 50 cronjobs
- ✅ Ejecución cada minuto si quieres
- ✅ Notificaciones por email
- ✅ Historial de ejecuciones
- ✅ Sin límite de tiempo

## 🔐 Seguridad

El `service_role_key` en el header es seguro porque:
- Solo tú tienes acceso a cron-job.org
- La comunicación es HTTPS
- Puedes revocar el token en Supabase si es necesario

---

## 🎯 Alternativa: Configurar para testing AHORA (13:50)

Si quieres probarlo en 2 minutos (a las 13:50):

1. Sigue todos los pasos de arriba
2. En **Schedule**, configura:
   - **Minutes**: `50`
   - **Hours**: `12` (13:50 Madrid = 12:50 UTC)
3. Guarda y espera 2 minutos
4. ¡Recibirás los mensajes automáticamente!
5. Luego cambia la hora a `08:00` para producción
