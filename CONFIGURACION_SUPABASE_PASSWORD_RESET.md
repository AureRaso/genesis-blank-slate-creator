# Configuración de Supabase para Password Reset

## 🎯 Problema
Cuando los usuarios reciben el email de recuperación de contraseña, el enlace los redirige a la URL de producción (`https://www.padelock.com`) en lugar de funcionar en desarrollo local.

## ✅ Solución

### 1. Configurar Site URL en Supabase Dashboard

1. Ve a tu proyecto en **https://supabase.com/dashboard**
2. Navega a: **Authentication → URL Configuration**
3. Encuentra el campo **"Site URL"**
4. Para desarrollo local, configúralo como: `http://localhost:8080`
5. Para producción, configúralo como: `https://www.padelock.com`

⚠️ **Nota**: Solo puedes tener UNA Site URL activa a la vez.

### 2. Configurar Redirect URLs (Recomendado)

En la misma página de URL Configuration:

1. Encuentra **"Redirect URLs"**
2. Agrega las siguientes URLs (una por línea):
   ```
   http://localhost:8080/**
   http://localhost:5173/**
   https://www.padelock.com/**
   ```

Esto permitirá que Supabase acepte redirecciones desde cualquiera de estas URLs.

### 3. Configurar Email Templates

1. En Supabase Dashboard: **Authentication → Email Templates**
2. Selecciona **"Reset Password"** (también llamado "Change Email Address")
3. Verifica que el contenido incluya:
   ```html
   <p>Haz click en el siguiente enlace para restablecer tu contraseña:</p>
   <p><a href="{{ .SiteURL }}/reset-password">Restablecer Contraseña</a></p>
   ```

4. El template completo debería verse así:
   ```html
   <h2>Restablecer Contraseña</h2>
   <p>Hola,</p>
   <p>Has solicitado restablecer tu contraseña para PadeLock.</p>
   <p>Haz click en el siguiente enlace para continuar:</p>
   <p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>
   <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
   <p>Este enlace expirará en 1 hora.</p>
   <br>
   <p>Gracias,<br>El equipo de PadeLock</p>
   ```

### 4. Alternativa: Usar Variables de Entorno

En producción, puedes tener diferentes configuraciones según el entorno:

**Para desarrollo (.env.local):**
```env
VITE_SUPABASE_URL=tu-url-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SITE_URL=http://localhost:8080
```

**Para producción (.env.production):**
```env
VITE_SUPABASE_URL=tu-url-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SITE_URL=https://www.padelock.com
```

Luego en el código (ForgotPasswordPage.tsx línea 91):
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/reset-password`,
});
```

## 🧪 Prueba en Desarrollo (Workaround)

Mientras configuras Supabase, puedes probar así:

1. Ve a `/forgot-password` en localhost
2. Ingresa tu email y envía el formulario
3. Revisa tu email
4. **IMPORTANTE**: Copia el enlace del email
5. Reemplaza: `https://www.padelock.com/#` → `http://localhost:8080/#`
6. Pega la URL modificada en tu navegador
7. Deberías llegar a `/reset-password` con el token válido

## 📋 Checklist de Configuración

- [ ] Site URL configurada en Supabase Dashboard
- [ ] Redirect URLs agregadas (localhost y producción)
- [ ] Email template de "Reset Password" personalizado
- [ ] Variables de entorno configuradas (opcional)
- [ ] Probado el flujo completo en desarrollo
- [ ] Probado el flujo completo en producción

## 🔍 Debugging

Si el flujo no funciona, revisa:

1. **Console del navegador**: Busca logs que empiecen con `🔍 Reset Password`
2. **Network tab**: Verifica que la petición a Supabase se haya completado
3. **AuthContext logs**: Deberías ver `PASSWORD_RECOVERY event detected`
4. **URL en el navegador**: Debe tener `#access_token=...&type=recovery`

## 💡 Notas Importantes

- El token de recuperación expira en **1 hora** por defecto
- Supabase enviará el email solo si el usuario existe
- Por seguridad, la aplicación no revela si un email existe o no
- El rate limiting está implementado en el cliente (localStorage)
