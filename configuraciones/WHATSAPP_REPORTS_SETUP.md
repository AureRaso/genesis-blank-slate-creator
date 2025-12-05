# Configuración de Reportes Automáticos de WhatsApp

## ✅ Completado

1. ✅ Edge Function `generate-daily-report` desplegada
2. ✅ Edge Function `trigger-scheduled-reports` desplegada
3. ✅ GitHub Actions workflow creado
4. ✅ Interfaz web con botones de prueba manual

## 📋 Pasos para activar el envío automático

### 1. Configurar secreto CRON_SECRET en Supabase

```bash
npx supabase secrets set CRON_SECRET=tu-clave-secreta-aqui
```

Reemplaza `tu-clave-secreta-aqui` con una cadena aleatoria segura (por ejemplo: `whatsapp-cron-2025-secret-key`)

### 2. Configurar secretos en GitHub

Ve a tu repositorio en GitHub:
1. **Settings** → **Secrets and variables** → **Actions**
2. Crea los siguientes secretos:

   - `SUPABASE_URL`: `https://hwwvtxyezhgmhyxjpnvl.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: [Tu service role key de Supabase]
   - `CRON_SECRET`: [La misma clave que configuraste en Supabase]

### 3. Hacer commit y push del workflow

```bash
git add .github/workflows/whatsapp-daily-reports.yml
git add supabase/functions/trigger-scheduled-reports/
git commit -m "feat: Add automated WhatsApp daily reports cron job"
git push origin main
```

### 4. Verificar que funciona

#### Prueba manual desde GitHub:
1. Ve a **Actions** → **WhatsApp Daily Reports**
2. Click en **Run workflow**
3. Selecciona `morning` o `afternoon`
4. Click **Run workflow**

#### Horarios automáticos:
- **Reporte Matutino**: 10:00 AM (hora de Madrid)
- **Reporte Vespertino**: 13:00 (1:00 PM) (hora de Madrid)

## 🔧 URLs de las Edge Functions

- **Generate Report**: `https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/generate-daily-report`
- **Trigger Scheduled**: `https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/trigger-scheduled-reports`

## 🧪 Probar manualmente con curl

```bash
# Probar reporte matutino
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"reportType": "morning", "cronSecret": "YOUR_CRON_SECRET"}' \
  https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/trigger-scheduled-reports

# Probar reporte vespertino
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"reportType": "afternoon", "cronSecret": "YOUR_CRON_SECRET"}' \
  https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/trigger-scheduled-reports
```

## 📱 Configuración del Grupo de WhatsApp

1. Ve a `/owner/whatsapp-reports`
2. Selecciona el club
3. Introduce:
   - **Nombre del grupo**: Ej: "Entrenadores Club Padel"
   - **ID del grupo**: Obtén el ID desde WhatsApp Web
     - Abre el grupo en WhatsApp Web
     - Mira la URL del navegador
     - Copia el ID después de "chat/" (ejemplo: `34666777888-1234567890@g.us`)
4. Configura horarios y activa/desactiva reportes
5. **Guardar Configuración**
6. **Probar** con los botones azul (matutino) y naranja (vespertino)

## 🔍 Monitoreo

### Ver logs de las Edge Functions:
```bash
npx supabase functions logs generate-daily-report
npx supabase functions logs trigger-scheduled-reports
```

### Ver ejecuciones de GitHub Actions:
GitHub → Actions → WhatsApp Daily Reports

## ⚠️ Notas importantes

- Los reportes solo se envían a clubes con `is_active = true`
- Cada club puede tener horarios diferentes configurados
- El `WHAPI_TOKEN` ya está configurado en Supabase
- Los reportes incluyen:
  - Tasa de respuesta de alumnos
  - Clases con huecos disponibles
  - Rechazos de alumnos
  - Lista de espera
  - Acciones sugeridas automáticas

## 🐛 Troubleshooting

### Los reportes no se envían automáticamente
1. Verifica que GitHub Actions esté ejecutándose (Actions tab)
2. Revisa los logs de GitHub Actions para errores
3. Verifica que `CRON_SECRET` sea el mismo en Supabase y GitHub
4. Comprueba que `WHAPI_TOKEN` esté configurado correctamente

### Error 401 en el webhook
- El `CRON_SECRET` no coincide entre Supabase y GitHub

### Error 403 al crear/leer configuraciones
- Aplica la migración `20250106210000_fix_whatsapp_reports_rls.sql`

### No se reciben mensajes en WhatsApp
- Verifica que el ID del grupo sea correcto (debe terminar en `@g.us`)
- Comprueba que el bot de Whapi.cloud esté en el grupo
- Revisa los logs de `generate-daily-report` para ver errores de Whapi
