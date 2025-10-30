# 🔐 Instrucciones para configurar el Recordatorio Diario Automático

**Destinatario**: Owner del repositorio (AureRaso)

## ⚡ Resumen
Necesitamos configurar UN secret en GitHub para que los recordatorios diarios de WhatsApp funcionen automáticamente cada mañana a las 9:00 AM.

## 📋 Pasos a seguir (2 minutos)

### 1. Ir a Settings del repositorio

1. Ve a: **https://github.com/AureRaso/genesis-blank-slate-creator**
2. Click en la pestaña **"Settings"** (arriba)
3. En el menú lateral izquierdo, expande **"Secrets and variables"**
4. Click en **"Actions"**

### 2. Obtener el Service Role Key de Supabase

⚠️ **IMPORTANTE**: Primero necesitas obtener la key correcta desde Supabase:

1. Ve a: **https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/settings/api**
2. En la sección **"Project API keys"**
3. Busca la fila que dice **"service_role"** (con etiqueta "secret")
4. Click en el icono del ojo 👁️ para revelar la key completa
5. **Copia toda la key** (es un texto largo que empieza con `eyJ...`)

### 3. Crear/Actualizar el Secret en GitHub

1. Si ya existe un secret con ese nombre:
   - Click en **"SUPABASE_SERVICE_ROLE_KEY"**
   - Click en **"Update"**

   Si no existe:
   - Click en el botón verde **"New repository secret"**

2. Rellena los campos:

   **Name** (nombre del secret):
   ```
   SUPABASE_SERVICE_ROLE_KEY
   ```

   **Secret** (valor del secret):
   ```
   [PEGA AQUÍ LA KEY QUE COPIASTE DE SUPABASE EN EL PASO 2]
   ```
   ⚠️ NO uses la key del ejemplo de arriba, usa la que acabas de copiar de Supabase

3. Click en **"Add secret"** (o **"Update secret"** si ya existía)

### 4. Verificar que funciona (IMPORTANTE)

1. Ve a: **https://github.com/AureRaso/genesis-blank-slate-creator/actions**
2. En el menú lateral, click en **"Daily Attendance Reminder"**
3. Click en el botón **"Run workflow"** (arriba a la derecha)
4. Selecciona la rama **"main"**
5. Click en **"Run workflow"** (botón verde)
6. Espera 10-20 segundos
7. Click en la ejecución que aparece
8. Deberías ver: ✅ "Daily reminder sent successfully!"

## ✅ ¿Qué hace esto?

Una vez configurado el secret:

- 📅 **Automático**: Cada día a las **9:00 AM** (hora de Madrid)
- 📱 **Envía mensaje** de recordatorio a TODOS los grupos de WhatsApp activos
- 🎾 **Mensaje**: Recordatorio para que confirmen asistencia a las clases del día
- 🔄 **Manual**: También se puede ejecutar manualmente desde GitHub Actions cuando quieras

## 📱 Mensaje que se envía

```
🎾 ¡Buenos días!

📅 Hoy es *[fecha]*

⏰ Recordatorio de asistencia

Por favor, confirma tu asistencia a las clases de hoy entrando en la aplicación:
👉 https://genesis-blank-slate-creator.lovable.app

✅ Confirmar asistencia
❌ Notificar ausencia

Es importante que confirmes lo antes posible para que podamos organizar mejor las clases.

¡Nos vemos en la pista! 🎾
```

## 🔧 Gestión futura

### Ver logs de ejecuciones:
1. Ve a: https://github.com/AureRaso/genesis-blank-slate-creator/actions
2. Click en "Daily Attendance Reminder"
3. Verás todas las ejecuciones pasadas con sus resultados

### Cambiar la hora:
1. Edita el archivo: `.github/workflows/daily-reminder.yml`
2. Cambia la línea: `- cron: '0 8 * * *'`
   - `0 8` = 9:00 AM Madrid (invierno)
   - `0 7` = 9:00 AM Madrid (verano)
   - `0 9` = 10:00 AM Madrid (invierno)

### Desactivar temporalmente:
1. Ve a: https://github.com/AureRao/genesis-blank-slate-creator/actions
2. Click en "Daily Attendance Reminder"
3. Click en "..." (tres puntos) → "Disable workflow"

## ⚠️ Importante

- 🔒 El secret es **privado** y solo visible para owners del repo
- 🔐 Es la **service role key** de Supabase (no compartir públicamente)
- ✅ Es **seguro** usar en GitHub Actions (encriptado)
- 🔄 Si cambias la key en Supabase, debes actualizarla aquí también

## 🆘 Si algo falla

1. Verifica que el secret se llama EXACTAMENTE: `SUPABASE_SERVICE_ROLE_KEY` (sin espacios ni mayúsculas/minúsculas diferentes)
2. Verifica que el valor del secret no tiene espacios al inicio o final
3. Prueba ejecutar manualmente desde Actions para ver el error

---

**Una vez configurado, avísame para que podamos probarlo juntos!** 🚀
