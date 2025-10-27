# Configurar Branding de Supabase (Padelock.com)

## Problema
Cuando los usuarios se registran o inician sesión con Google, ven la URL `hwwvtxyezhgmhyxjpnvl.supabase.co` en lugar de `padelock.com`, lo que no genera confianza.

## Solución: Configurar Custom Domain y Site URL

### 1. Configurar Site URL en Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** (configuración) → **General**
3. En la sección **General settings**, busca:
   - **Site URL**: Cambia a `https://padelock.com`
   - **Additional Redirect URLs**: Añade:
     - `https://padelock.com/*`
     - `https://www.padelock.com/*`
     - `http://localhost:5173/*` (para desarrollo)

### 2. Configurar Email Templates

1. Ve a **Authentication** → **Email Templates**
2. Edita cada plantilla (Confirm signup, Magic Link, etc.)
3. Cambia las referencias de URL a `padelock.com`

### 3. Configurar Custom Domain (Opcional pero Recomendado)

Para usar tu propio dominio en lugar de `hwwvtxyezhgmhyxjpnvl.supabase.co`:

1. Ve a **Settings** → **Custom Domains**
2. Añade tu dominio: `padelock.com`
3. Configura los registros DNS en tu proveedor de dominio:
   - Tipo: `CNAME`
   - Nombre: `@` o `padelock.com`
   - Valor: El que te proporcione Supabase

### 4. Configurar OAuth Redirect URLs en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Navega a **APIs & Services** → **Credentials**
3. Selecciona tu OAuth 2.0 Client ID
4. En **Authorized redirect URIs**, añade:
   - `https://hwwvtxyezhgmhyxjpnvl.supabase.co/auth/v1/callback`
   - `https://padelock.com/auth/v1/callback` (si configuras custom domain)
5. Guarda los cambios

### 5. Actualizar Variables de Entorno (si es necesario)

Si tienes un archivo `.env` o `.env.local`, asegúrate de tener:

```env
VITE_SUPABASE_URL=https://hwwvtxyezhgmhyxjpnvl.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SITE_URL=https://padelock.com
```

### 6. Configurar Branding en Email Templates

En **Authentication** → **Email Templates**, personaliza el footer y contenido:

```html
<p>Gracias,<br/>El equipo de Padelock</p>
<p><a href="https://padelock.com">padelock.com</a></p>
```

## Verificación

1. Cierra todas las sesiones activas
2. Intenta registrarte con Google
3. Verifica que:
   - La URL de redirección muestre `padelock.com`
   - Los emails muestren `padelock.com`
   - El branding sea consistente

## Notas Importantes

- **Site URL** es la configuración más importante para OAuth
- Los cambios en OAuth pueden tardar unos minutos en propagarse
- Si usas custom domain, necesitarás configurar SSL (Supabase lo hace automáticamente)
- Para desarrollo local, mantén `http://localhost:5173` en las redirect URLs

## Configuración Rápida (Solo Site URL)

Si solo quieres el cambio rápido sin custom domain:

1. Dashboard → Settings → General
2. Site URL: `https://padelock.com`
3. Redirect URLs: Añade `https://padelock.com/*`
4. Guarda cambios
5. Reinicia la aplicación

Esto hará que en los flujos de autenticación se use `padelock.com` en lugar de la URL de Supabase.
