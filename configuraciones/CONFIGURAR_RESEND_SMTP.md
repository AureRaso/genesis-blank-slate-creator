# 📧 Configurar Resend para Email de Recuperación de Contraseña

## 🎯 Ventajas de Usar Resend

- ✅ **Ya lo tienes configurado** para notificaciones
- ✅ **Excelente entregabilidad** (99.5%+)
- ✅ **API moderna y simple**
- ✅ **Dashboard intuitivo**
- ✅ **Pricing justo**: $0 primeros 3,000 emails/mes, luego $20/mes por 50k
- ✅ **Soporte de React Email** (plantillas modernas)

---

## 🚀 Configuración Paso a Paso

### Paso 1: Verificar Dominio en Resend (Si no está verificado)

1. Ve a: https://resend.com/domains
2. Click en **"Add Domain"**
3. Ingresa: `padelock.com`
4. Resend te mostrará registros DNS para agregar:

```
TXT: resend._domainkey.padelock.com
Value: [valor proporcionado por Resend]
```

5. Agrega estos registros en tu proveedor DNS
6. Click en "Verify" en Resend
7. Espera la verificación (usualmente 5-15 minutos)

### Paso 2: Obtener API Key de Resend

**Si ya tienes una API Key:**
- Úsala directamente (es la misma que usas para notificaciones)

**Si necesitas crear una nueva:**
1. Ve a: https://resend.com/api-keys
2. Click en **"Create API Key"**
3. Nombre: `Supabase Auth`
4. Permisos: **Sending access** (Full access no es necesario)
5. Click "Add"
6. **Copia la API Key** (solo se muestra una vez)

### Paso 3: Configurar en Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto **PadeLock**
3. **Project Settings → Auth**
4. Scroll hasta **"SMTP Settings"**
5. Click en el toggle **"Enable custom SMTP"**

6. Configura exactamente así:

```
┌─────────────────────────────────────────────┐
│ Sender details                              │
├─────────────────────────────────────────────┤
│ Sender email address:                       │
│ ┌─────────────────────────────────────────┐ │
│ │ noreply@padelock.com                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Sender name:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Padelock                                │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ SMTP provider settings                      │
├─────────────────────────────────────────────┤
│ Host:                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ smtp.resend.com                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Port number:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 587                                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Minimum interval per user:                  │
│ ┌─────────────────────────────────────────┐ │
│ │ 60                          seconds     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Username:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ resend                                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Password:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ re_xxxxxxxxxxxxxxxxxxxxxxx              │ │
│ └─────────────────────────────────────────┘ │
│     (Tu API Key de Resend)                  │
└─────────────────────────────────────────────┘

[ Save changes ]
```

**⚠️ IMPORTANTE:**
- **Username**: Debe ser exactamente `resend` (no tu email)
- **Password**: Tu API Key de Resend (empieza con `re_`)
- **Port**: Usa `587` (TLS) o `465` (SSL)

7. Click en **"Save changes"**

### Paso 4: Probar la Configuración

1. Ve a: https://www.padelock.com/forgot-password
2. Ingresa un email de prueba
3. Click en "Enviar enlace de recuperación"
4. Revisa tu bandeja de entrada

**Verifica:**
- ✅ Email recibido
- ✅ Remitente: `Padelock <noreply@padelock.com>`
- ✅ No va a spam
- ✅ Links funcionan correctamente

### Paso 5: Monitorear en Resend Dashboard

1. Ve a: https://resend.com/emails
2. Verás todos los emails enviados
3. Puedes ver:
   - Estado de entrega
   - Opens (si activas tracking)
   - Clicks
   - Bounces

---

## 🔍 Troubleshooting

### Problema: "Authentication failed"

**Causa:** Username o Password incorrectos

**Solución:**
1. Verifica que Username sea exactamente: `resend` (minúsculas)
2. Verifica que el Password sea tu API Key de Resend
3. La API Key debe empezar con `re_`
4. No uses comillas en la API Key

### Problema: "Domain not verified"

**Causa:** El dominio no está verificado en Resend

**Solución:**
1. Ve a https://resend.com/domains
2. Verifica que `padelock.com` esté listado
3. Status debe ser "Verified" (verde)
4. Si no, verifica los registros DNS

### Problema: Emails van a spam

**Causa:** Falta configuración DNS (SPF, DKIM, DMARC)

**Solución:**
1. Resend configura automáticamente DKIM al verificar el dominio
2. Agrega registro SPF:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   ```
3. Agrega registro DMARC (opcional pero recomendado):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@padelock.com
   ```

### Problema: Emails no llegan

**Solución:**
1. Verifica en Resend Dashboard: https://resend.com/emails
2. Busca el email enviado
3. Revisa el status:
   - **Delivered**: Email entregado correctamente
   - **Bounced**: Email rebotó (verificar destinatario)
   - **Complained**: Marcado como spam

---

## 📊 Diferencias con tu Configuración Actual

Veo en tu captura que tienes:
- Username: `Nike` ❌
- Port: `465`

**Debe ser:**
- Username: `resend` ✅
- Port: `587` (recomendado) o `465`

---

## 💡 Ventajas de Usar Resend para Todo

Ya que usas Resend para notificaciones, úsalo también para auth:

### Ventajas:
1. **Un solo proveedor** - Más fácil de gestionar
2. **Un solo dashboard** - Ver todos los emails en un lugar
3. **Métricas unificadas** - Todas las estadísticas juntas
4. **Ahorro de costos** - No pagas por múltiples servicios
5. **Configuración simple** - Ya tienes el dominio verificado

### Emails que puedes enviar con Resend:
- ✅ Password reset (nuevo)
- ✅ Notificaciones de WhatsApp
- ✅ Confirmación de registro
- ✅ Recordatorios de clases
- ✅ Reportes de asistencia
- ✅ Cualquier email transaccional

---

## 🎨 Mejorar Template de Email (Opcional)

Resend soporta **React Email** para crear templates modernos.

Si quieres mejorar aún más el email:

1. Crea un template en: https://resend.com/docs/send-with-react
2. Usa componentes de React para el email
3. Preview en tiempo real

Ejemplo:
```tsx
import { Button, Html } from '@react-email/components';

export default function PasswordResetEmail() {
  return (
    <Html>
      <Button href="{{ .ConfirmationURL }}">
        Restablecer Contraseña
      </Button>
    </Html>
  );
}
```

---

## 📈 Límites y Pricing de Resend

| Plan | Emails/mes | Precio |
|------|-----------|---------|
| **Free** | 3,000 | $0 |
| **Pro** | 50,000 | $20 |
| **Pro+** | 500,000 | $100 |

**Para Padelock:**
- Si envías < 3,000 emails/mes → Gratis
- Si envías 3,000-50,000 → $20/mes
- Incluye: Todos los emails (auth + notificaciones + marketing)

---

## ✅ Checklist de Configuración

- [ ] Dominio verificado en Resend
- [ ] API Key creada y copiada
- [ ] SMTP configurado en Supabase:
  - [ ] Host: `smtp.resend.com`
  - [ ] Port: `587`
  - [ ] Username: `resend`
  - [ ] Password: `re_xxxxx` (API Key)
  - [ ] Sender: `noreply@padelock.com`
  - [ ] Name: `Padelock`
- [ ] Cambios guardados
- [ ] Test enviado desde `/forgot-password`
- [ ] Email recibido correctamente
- [ ] Remitente correcto mostrado

---

## 📞 Soporte

Si tienes problemas:
- **Resend Docs**: https://resend.com/docs
- **Resend Discord**: https://resend.com/discord
- **Supabase SMTP Docs**: https://supabase.com/docs/guides/auth/auth-smtp

---

## 🎉 Resultado Final

Con Resend configurado, tus emails se verán así:

```
De: Padelock <noreply@padelock.com>
Para: usuario@gmail.com
Asunto: Restablecer tu contraseña de Padelock

[Email con tu template personalizado]
```

**Dashboard Unificado:**
- Ver todos los emails de password reset
- Ver todas las notificaciones
- Métricas en un solo lugar
- Debuggear fácilmente

---

¿Necesitas ayuda para actualizar la configuración SMTP en Supabase?
