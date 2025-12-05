# 📧 Configurar Custom SMTP en Supabase (Email Personalizado)

## 🎯 Objetivo
Cambiar el remitente de los emails de `noreply@supabase.co` a `noreply@padelock.com` o el email que prefieras.

---

## ⚠️ Importante
Para usar Custom SMTP necesitas:
1. **Un dominio propio** (por ejemplo: padelock.com)
2. **Acceso a la configuración DNS** del dominio
3. **Un servicio de email** (recomendados: SendGrid, Mailgun, AWS SES, o Gmail)

---

## 🚀 Opciones de Proveedores SMTP

### Opción 1: SendGrid (Recomendado - Gratis hasta 100 emails/día)

**Ventajas:**
- ✅ Plan gratuito generoso
- ✅ Fácil de configurar
- ✅ Buena entregabilidad
- ✅ Dashboard con métricas

**Pasos:**
1. Crea cuenta en: https://sendgrid.com
2. Verifica tu dominio
3. Crea una API Key
4. Configura en Supabase

### Opción 2: Mailgun (Gratis los primeros 3 meses)

**Ventajas:**
- ✅ Muy buena entregabilidad
- ✅ API potente
- ✅ Logs detallados

**Pasos:**
1. Crea cuenta en: https://www.mailgun.com
2. Verifica tu dominio
3. Obtén credenciales SMTP
4. Configura en Supabase

### Opción 3: Gmail / Google Workspace

**Ventajas:**
- ✅ Si ya tienes Google Workspace
- ✅ No requiere configuración de dominio adicional
- ✅ Gratis si usas cuenta personal (con límites)

**Desventajas:**
- ⚠️ Límite de 500 emails/día (cuenta personal)
- ⚠️ Puede marcar como spam si envías muchos

---

## 📋 Guía Paso a Paso (usando SendGrid)

### Paso 1: Crear Cuenta en SendGrid

1. Ve a: https://app.sendgrid.com/signup
2. Regístrate con tu email
3. Verifica tu cuenta
4. Completa el onboarding

### Paso 2: Verificar tu Dominio

1. En SendGrid Dashboard: **Settings → Sender Authentication**
2. Click en **"Authenticate Your Domain"**
3. Elige tu proveedor DNS (GoDaddy, Namecheap, etc.)
4. Ingresa tu dominio: `padelock.com`
5. SendGrid te dará **registros DNS** para agregar:

```
CNAME: em1234.padelock.com → u1234567.wl123.sendgrid.net
CNAME: s1._domainkey.padelock.com → s1.domainkey.u1234567.wl123.sendgrid.net
CNAME: s2._domainkey.padelock.com → s2.domainkey.u1234567.wl123.sendgrid.net
```

6. Agrega estos registros en tu panel de DNS
7. Espera 24-48 horas para verificación (usualmente más rápido)

### Paso 3: Crear API Key en SendGrid

1. **Settings → API Keys**
2. Click **"Create API Key"**
3. Nombre: `Supabase Auth`
4. Permisos: **Full Access** (o Mail Send)
5. Copia y guarda la API Key (la necesitarás después)

### Paso 4: Configurar en Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto PadeLock
3. **Project Settings → Auth**
4. Scroll hasta **"SMTP Settings"**
5. Activa **"Enable Custom SMTP"**

6. Configura así:

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [TU_API_KEY_DE_SENDGRID]
Sender email: noreply@padelock.com
Sender name: Padelock
```

7. Click en **"Save"**

### Paso 5: Probar

1. Ve a tu aplicación: https://www.padelock.com/forgot-password
2. Solicita un reset de contraseña
3. Revisa el email que recibes
4. **Verifica** que el remitente sea: `Padelock <noreply@padelock.com>`

---

## 🔧 Configuración para Otros Proveedores

### Mailgun

```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@mg.padelock.com
Password: [TU_PASSWORD_DE_MAILGUN]
Sender email: noreply@padelock.com
Sender name: Padelock
```

### Gmail (Google Workspace)

```
Host: smtp.gmail.com
Port: 587
Username: noreply@padelock.com
Password: [APP_PASSWORD - NO TU CONTRASEÑA NORMAL]
Sender email: noreply@padelock.com
Sender name: Padelock
```

**⚠️ Para Gmail:** Necesitas crear una "App Password":
1. Ve a: https://myaccount.google.com/security
2. Activa verificación en 2 pasos
3. Crea una "App Password" para "Mail"
4. Usa esa contraseña en Supabase

### AWS SES (Amazon Simple Email Service)

```
Host: email-smtp.us-east-1.amazonaws.com (cambia región si es necesario)
Port: 587
Username: [TU_SMTP_USERNAME_DE_AWS]
Password: [TU_SMTP_PASSWORD_DE_AWS]
Sender email: noreply@padelock.com
Sender name: Padelock
```

---

## 📧 Configurar el Email del Remitente

Una vez configurado el SMTP, puedes elegir:

### Opción A: Email Genérico
```
Sender email: noreply@padelock.com
Sender name: Padelock
```

Resultado: `Padelock <noreply@padelock.com>`

### Opción B: Email de Soporte
```
Sender email: soporte@padelock.com
Sender name: Equipo Padelock
```

Resultado: `Equipo Padelock <soporte@padelock.com>`

### Opción C: Email Personalizado
```
Sender email: hola@padelock.com
Sender name: Padelock - Tu Academia de Pádel
```

Resultado: `Padelock - Tu Academia de Pádel <hola@padelock.com>`

---

## ✅ Verificación Final

Después de configurar, verifica:

### 1. Email Recibido Correctamente
- [ ] Email llega a la bandeja de entrada (no spam)
- [ ] Remitente muestra tu nombre y dominio
- [ ] Links funcionan correctamente
- [ ] Plantilla se ve bien

### 2. Pruebas de Spam
Usa estas herramientas:
- https://www.mail-tester.com
- Envía un test email a esta dirección
- Te dará un score /10
- Objetivo: ≥ 7/10

### 3. Logs en SendGrid
- Ve a: **Activity → Email Activity**
- Verifica que los emails se envían correctamente
- Revisa tasas de apertura y clicks

---

## ❓ Troubleshooting

### Problema: Emails no llegan

**Solución:**
1. Verifica que el dominio esté verificado en SendGrid
2. Revisa los logs en SendGrid Dashboard
3. Verifica credenciales SMTP en Supabase
4. Prueba con port 2525 si 587 no funciona

### Problema: Emails van a spam

**Solución:**
1. Verifica SPF, DKIM, DMARC records en DNS
2. Usa https://mxtoolbox.com/SuperTool.aspx para verificar
3. Asegúrate de que el dominio esté verificado
4. No uses palabras spam en el asunto

### Problema: "Authentication failed"

**Solución:**
1. Verifica usuario/contraseña
2. Para Gmail, usa App Password, no tu contraseña normal
3. Para SendGrid, username debe ser `apikey`
4. Verifica que la API Key sea correcta

---

## 💰 Costos Aproximados

| Proveedor | Gratis | Pagado |
|-----------|--------|--------|
| **SendGrid** | 100 emails/día | $15/mes (40k emails) |
| **Mailgun** | Gratis 3 meses | $35/mes (50k emails) |
| **AWS SES** | 62k emails/mes* | $0.10 / 1000 emails |
| **Gmail** | 500 emails/día | N/A |

*Dentro de AWS Free Tier

---

## 🎨 Personalización Adicional

### Agregar Logo en el Email

Si quieres que el logo de Padelock aparezca en el email:

1. Sube el logo a un hosting público (ej: Cloudinary, Imgur)
2. En el template HTML, usa:

```html
<img src="https://tu-url-publica/padelock-logo.png" alt="Padelock" style="height: 60px;">
```

### Footer Personalizado

Agrega al final del email:

```html
<div style="text-align: center; margin-top: 30px; padding: 20px; background: #f5f5f5;">
  <p style="margin: 0; font-size: 12px; color: #999;">
    © 2024 Padelock - Tu Academia de Pádel Digital
  </p>
  <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">
    Calle Example 123, Madrid, España
  </p>
</div>
```

---

## 📊 Métricas Recomendadas a Monitorear

Una vez en producción:

1. **Tasa de entrega**: > 95%
2. **Tasa de apertura**: > 20%
3. **Tasa de click**: > 10%
4. **Tasa de spam**: < 0.1%
5. **Bounces**: < 5%

Revisa estas métricas en el dashboard de tu proveedor SMTP.

---

## ✨ Resultado Final

Con SMTP configurado, tus usuarios recibirán emails que se ven así:

```
De: Padelock <noreply@padelock.com>
Para: usuario@gmail.com
Asunto: Restablecer tu contraseña de Padelock

[Logo Padelock]

Hola,

Hemos recibido una solicitud para restablecer tu contraseña...

[Botón: Restablecer contraseña]

Un saludo,
El equipo de Padelock
```

**Mucho más profesional que:**
```
De: auth@supabase.co
```

---

¿Necesitas ayuda con algún paso específico de la configuración?
