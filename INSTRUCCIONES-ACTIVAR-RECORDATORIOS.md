# 🔔 Sistema de Recordatorios de Asistencia - Instrucciones

## ✅ Estado Actual del Sistema

### Lo que YA está funcionando:
- ✅ **Edge Function desplegada**: `send-attendance-reminders` está activa
- ✅ **Lógica implementada**: Busca clases en 6-7 horas y encuentra participantes sin confirmar
- ✅ **Sistema de emails**: Usa Resend API y ya tiene templates profesionales
- ✅ **Configuración actualizada**: `verify_jwt = false` (permite invocación por cron)

### Lo que FALTA:
- ❌ **Cron Job**: El sistema automático que ejecuta la función cada hora NO está configurado

---

## 🚀 Activar el Sistema Completo (5 minutos)

### PASO 1: Ir al Dashboard de Supabase

1. Abre: https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/sql/new
2. Esto abrirá el **SQL Editor**

### PASO 2: Configurar el Cron Job

1. Abre el archivo: `setup-attendance-reminder-cron-simple.sql`
2. **Copia TODO el contenido** del archivo
3. **Pégalo** en el SQL Editor de Supabase
4. Click en **"Run"** (botón verde)

### PASO 3: Verificar que funcionó

Deberías ver un resultado como:
```
✅ Cron job está ACTIVO
```

Y una tabla con:
- `jobname`: send-attendance-reminders-hourly
- `schedule`: 0 * * * *
- `active`: true

---

## 🧪 Cómo Probar que Funciona

### Opción A: Test Inmediato (sin esperar)

Ejecuta en tu terminal:
```bash
node test-attendance-reminder-node.js
```

Esto te mostrará:
- Clases programadas
- Participantes sin confirmar
- Resultado de invocar la función manualmente

### Opción B: Test Real (con clase de prueba)

1. **Calcula la hora**: Ahora son las **17:12**, así que 6.5 horas después serían las **23:42**
2. **Crea una clase de prueba**:
   - Que empiece a las 23:42 (o similar)
   - Añade 1-2 participantes
3. **NO marques asistencia** de esos participantes
4. **Espera a las 18:00** (siguiente hora en punto)
5. **Revisa**:
   - Los emails de los participantes
   - Los logs: Dashboard > Edge Functions > send-attendance-reminders > Logs

---

## 📊 Cómo Funciona el Sistema

```
Cada hora en punto (08:00, 09:00, 10:00, etc.)
↓
El cron job invoca la función send-attendance-reminders
↓
La función busca clases que empiezan en 6-7 horas
↓
Para cada clase, busca participantes donde:
  - attendance_confirmed_for_date IS NULL
  - absence_confirmed IS NULL
↓
Envía un email a cada participante con:
  - Detalles de la clase
  - Link para confirmar asistencia
  - Recordatorio de marcar ausencia si no pueden ir
```

---

## 📧 Ejemplo de Email que se Envía

**Asunto**: ⏰ Confirma tu asistencia - [Nombre de la Clase]

**Contenido**:
- Saludo personalizado con nombre del jugador
- Fecha y hora de la clase
- Club y nombre de la clase
- Botón para confirmar ahora
- Aviso de que la plaza podría liberarse

---

## 🔍 Verificar el Estado del Sistema

### Ver si el cron está activo:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly';
```

### Ver historial de ejecuciones:
```sql
SELECT
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

### Ver logs de la función:
1. Dashboard > Edge Functions > send-attendance-reminders
2. Click en "Logs"
3. Busca mensajes como:
   - "Starting attendance reminder job"
   - "Found X classes for today"
   - "Sent X attendance reminder emails"

---

## 🛠️ Comandos Útiles

### Desactivar el cron (si necesitas):
```sql
SELECT cron.unschedule('send-attendance-reminders-hourly');
```

### Re-desplegar la función (si haces cambios):
```bash
npx supabase functions deploy send-attendance-reminders
```

### Probar manualmente la función:
```bash
node test-attendance-reminder-node.js
```

### Verificar todo el sistema:
Ejecuta en SQL Editor: `verify-attendance-reminder-system.sql`

---

## ❓ Preguntas Frecuentes

### ¿Cuándo se envían los emails?
Cada hora en punto, si hay clases que empiezan en 6-7 horas.

### ¿Qué pasa si un jugador ya confirmó?
No se le envía email. Solo se envía a quienes NO han confirmado ni asistencia ni ausencia.

### ¿Se puede cambiar el horario del cron?
Sí, edita el schedule en el SQL:
- `0 * * * *` = cada hora
- `*/30 * * * *` = cada 30 minutos
- `0 8-20 * * *` = cada hora entre 8am y 8pm

### ¿Cuántos emails se pueden enviar?
Depende de tu plan de Resend. Revisa tus límites en el dashboard de Resend.

### ¿Los emails pueden ir a spam?
Posiblemente los primeros. Asegúrate de:
- Verificar el dominio en Resend
- Pedir a los usuarios que agreguen info@padelock.com a contactos

---

## 📝 Resumen de Archivos Creados

- `setup-attendance-reminder-cron-simple.sql` - **EJECUTA ESTE** para activar el cron
- `verify-attendance-reminder-system.sql` - Verifica el estado completo
- `test-attendance-reminder-node.js` - Prueba manual del sistema
- `INSTRUCCIONES-ACTIVAR-RECORDATORIOS.md` - Este archivo

---

## ✨ Próximos Pasos Después de Activar

Una vez que el cron esté activo:

1. **Monitorea las primeras ejecuciones** (cada hora)
2. **Verifica que lleguen los emails** a las cuentas de prueba
3. **Ajusta el texto del email** si es necesario (en `supabase/functions/send-attendance-reminders/index.ts`)
4. **Considera añadir**:
   - Tabla de tracking de emails enviados
   - Prevención de emails duplicados
   - Estadísticas de tasa de apertura
   - Envío de recordatorio adicional 2h antes

---

## 🆘 Si algo no funciona

1. **Revisa los logs** en Dashboard > Edge Functions > Logs
2. **Ejecuta el script de verificación**: `verify-attendance-reminder-system.sql`
3. **Prueba manualmente**: `node test-attendance-reminder-node.js`
4. **Verifica Resend**: Asegúrate de que `RESEND_API_KEY` esté configurada en Environment Variables

---

**¿Listo para activar?** → Sigue el PASO 1 arriba ☝️
