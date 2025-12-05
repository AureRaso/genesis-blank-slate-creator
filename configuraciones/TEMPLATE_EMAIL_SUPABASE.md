# 📧 Configurar Template de Email en Supabase para Password Reset

## 🎯 Problema
Los enlaces del email de recuperación de contraseña no contienen el token necesario (el hash `#access_token=...&type=recovery`).

## ✅ Solución: Configurar el Email Template Correctamente

### Paso 1: Ir a Email Templates en Supabase

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto PadeLock
3. En el menú lateral: **Authentication → Email Templates**
4. Selecciona **"Change Email Address"** o **"Reset Password"**

### Paso 2: Verificar el Template Actual

El template por defecto de Supabase debería contener algo como:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**⚠️ IMPORTANTE:** La variable `{{ .ConfirmationURL }}` ya incluye automáticamente:
- La Site URL configurada
- El hash con el access_token
- El tipo de acción (recovery)

### Paso 3: Template Recomendado en Español

Reemplaza el contenido del template con esto:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            border: 1px solid #e0e0e0;
        }
        .header {
            background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 20px -30px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 15px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">PadeLock</h1>
            <p style="margin: 5px 0 0 0;">Recuperación de Contraseña</p>
        </div>

        <p>Hola,</p>

        <p>Has solicitado restablecer tu contraseña para tu cuenta de PadeLock.</p>

        <p>Para continuar, haz click en el siguiente botón:</p>

        <center>
            <a href="{{ .ConfirmationURL }}" class="button">Restablecer mi Contraseña</a>
        </center>

        <div class="warning">
            <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.
        </div>

        <p style="font-size: 14px; color: #666;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador.
            <strong>Asegúrate de copiar el enlace completo, incluyendo la parte después del símbolo #</strong>
        </p>

        <p style="font-size: 12px; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
            {{ .ConfirmationURL }}
        </p>

        <p style="margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>

        <div class="footer">
            <p>Saludos,<br>El equipo de PadeLock</p>
            <p style="margin-top: 15px;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
```

### Paso 4: Variables Disponibles

Supabase proporciona estas variables que puedes usar en el template:

| Variable | Descripción |
|----------|-------------|
| `{{ .ConfirmationURL }}` | URL completa con el token (RECOMENDADO) |
| `{{ .Token }}` | Solo el token (NO recomendado) |
| `{{ .SiteURL }}` | La Site URL configurada |
| `{{ .Email }}` | El email del usuario |
| `{{ .TokenHash }}` | Hash del token |

**⚠️ SIEMPRE usa `{{ .ConfirmationURL }}`** porque incluye automáticamente:
- La Site URL
- El access_token en el hash
- El tipo de recovery
- Todos los parámetros necesarios

### Paso 5: Guardar y Probar

1. **Guarda** el template
2. **Solicita un reset** desde `/forgot-password`
3. **Revisa el email** que recibes
4. **Verifica** que el enlace tenga esta estructura:
   ```
   https://www.padelock.com/reset-password#access_token=eyJ...&expires_at=...&type=recovery
   ```

## 🔍 Verificar que Funciona

### El enlace correcto debe contener:

```
https://www.padelock.com/reset-password#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&expires_at=1234567890&refresh_token=...&type=recovery
```

### Partes importantes:

1. ✅ **Base URL**: `https://www.padelock.com/reset-password`
2. ✅ **Hash symbol**: `#`
3. ✅ **Access token**: `access_token=eyJ...`
4. ✅ **Type**: `type=recovery`

## ❌ Problemas Comunes

### Problema 1: El enlace no tiene hash (#)

**Causa:** El template usa `{{ .SiteURL }}/reset-password` en lugar de `{{ .ConfirmationURL }}`

**Solución:** Usa siempre `{{ .ConfirmationURL }}`

### Problema 2: El hash se pierde al copiar/pegar

**Causa:** Algunos clientes de email o navegadores cortan el hash

**Solución:**
- Instruir a los usuarios a hacer click directo en el botón
- O copiar el enlace completo usando "Copiar dirección del enlace" (click derecho)

### Problema 3: El enlace apunta a localhost en producción

**Causa:** La Site URL está configurada como `http://localhost:8080`

**Solución:** Cambiar Site URL a `https://www.padelock.com`

## 📸 Ejemplo de Email Bien Configurado

El usuario debería recibir un email que se vea así:

```
┌─────────────────────────────────────────┐
│         PadeLock                        │
│    Recuperación de Contraseña           │
├─────────────────────────────────────────┤
│                                         │
│ Hola,                                   │
│                                         │
│ Has solicitado restablecer tu          │
│ contraseña...                           │
│                                         │
│   [ Restablecer mi Contraseña ]        │
│                                         │
│ ⚠️ Importante: Este enlace expirará    │
│ en 1 hora por seguridad.                │
│                                         │
└─────────────────────────────────────────┘
```

Al hacer click en el botón, debe abrir:
```
https://www.padelock.com/reset-password#access_token=...&type=recovery
```

## 🧪 Probar en Desarrollo vs Producción

### Desarrollo (localhost:8080)
- Site URL: `http://localhost:8080`
- Resultado: `http://localhost:8080/reset-password#access_token=...`

### Producción (padelock.com)
- Site URL: `https://www.padelock.com`
- Resultado: `https://www.padelock.com/reset-password#access_token=...`

## ✅ Checklist Final

- [ ] Template usa `{{ .ConfirmationURL }}`
- [ ] Site URL está configurada correctamente
- [ ] Email recibido contiene el botón/enlace
- [ ] Enlace incluye `#access_token=...&type=recovery`
- [ ] Click en el enlace abre `/reset-password` correctamente
- [ ] La página de reset detecta el token y permite cambiar la contraseña
