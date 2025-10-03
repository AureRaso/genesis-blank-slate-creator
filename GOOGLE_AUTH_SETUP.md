# 🔐 Configuración de Google OAuth en PadeLock

## 📝 Guía paso a paso para implementar autenticación con Google

### **Paso 1: Configurar Google Cloud Console**

1. **Ir a Google Cloud Console**
   - URL: https://console.cloud.google.com/

2. **Crear/Seleccionar proyecto**
   - Si no tienes un proyecto, crea uno nuevo
   - Nombre sugerido: "PadeLock Auth"

3. **Habilitar Google+ API**
   - Ve a "APIs & Services" > "Library"
   - Busca "Google+ API"
   - Click en "Enable"

4. **Configurar OAuth Consent Screen (Pantalla de consentimiento)**
   - Ve a "APIs & Services" > "OAuth consent screen"
   - **User Type:** External (permite que cualquier persona con cuenta de Google pueda registrarse)
   - Click en "Create"

   **Paso 1 - App information:**
   - **App name:** `PadeLock`
   - **User support email:** `infopadelock@gmail.com` (o tu email de soporte)
   - **App logo:** (Opcional) Sube el logo de PadeLock para que aparezca en la pantalla de consentimiento
   - **Application home page:** `https://padelock.es` (o tu dominio principal)
   - **Application privacy policy link:** `https://padelock.es/privacy` (crea esta página si no existe)
   - **Application terms of service link:** `https://padelock.es/terms` (crea esta página si no existe)

   **Paso 2 - Scopes:**
   - Click en "Add or Remove Scopes"
   - Selecciona solo estos scopes básicos:
     - `.../auth/userinfo.email` - Ver tu dirección de correo electrónico principal
     - `.../auth/userinfo.profile` - Ver tu información personal, incluida la que hayas hecho pública
   - Click en "Update" y luego "Save and Continue"

   **Paso 3 - Test users** (solo necesario si la app está en modo Testing):
   - Añade algunos emails de prueba si quieres probar antes de publicar
   - Click en "Save and Continue"

   **Paso 4 - Summary:**
   - Revisa toda la información
   - Click en "Back to Dashboard"

   ⚠️ **IMPORTANTE:** Para que cualquier usuario pueda registrarse (no solo los de prueba), debes:
   - Ir a "OAuth consent screen"
   - En "Publishing status", click en "Publish App"
   - Confirmar la publicación

   💡 **Nota:** Mientras la app esté en modo "Testing", solo los usuarios que agregues en "Test users" podrán usar Google OAuth.

5. **Crear credenciales OAuth 2.0**
   - Ve a "APIs & Services" > "Credentials"
   - Click en "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: **PadeLock Web**

6. **Agregar URIs autorizadas**

   ⚠️ **IMPORTANTE:** Las URIs deben coincidir EXACTAMENTE (incluyendo las barras finales)

   **Authorized JavaScript origins:**
   ```
   https://hwwvtxyezhgmhyxjpnvl.supabase.co
   http://localhost:8082
   http://localhost:5173
   ```

   **Authorized redirect URIs:**
   ```
   https://hwwvtxyezhgmhyxjpnvl.supabase.co/auth/v1/callback
   http://localhost:8082/auth/callback
   http://localhost:5173/auth/callback
   ```

   💡 **Nota:** Supabase maneja el callback automáticamente en `/auth/v1/callback`, no necesitas crear una página especial.

7. **Guardar credenciales**
   - Copia el **Client ID** (algo como: `123456789-abc123.apps.googleusercontent.com`)
   - Copia el **Client Secret** (algo como: `GOCSPX-abc123xyz`)

---

### **Paso 2: Configurar Supabase**

1. **Ir al Dashboard de Supabase**
   - URL: https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl

2. **Navegar a Authentication**
   - Click en "Authentication" en el menú lateral
   - Click en "Providers"

3. **Habilitar Google Provider**
   - Encuentra "Google" en la lista de providers
   - Click en el toggle para habilitarlo (debe ponerse verde)

4. **Configurar credenciales**
   - **Client ID (for OAuth):** Pega el Client ID de Google Cloud
   - **Client Secret (for OAuth):** Pega el Client Secret de Google Cloud

5. **Guardar cambios**
   - Click en "Save"

---

### **Paso 3: Verificar el código (Ya implementado)**

El código ya está implementado con los siguientes cambios:

#### **AuthContext.tsx**
- ✅ Función `signInWithGoogle()` agregada
- ✅ Configuración de OAuth con redirect correcto

#### **AuthPage.tsx**
- ✅ Botón de "Continuar con Google" con logo oficial
- ✅ Handler `handleGoogleSignIn()` implementado
- ✅ UI con divider y diseño profesional

---

### **Paso 4: Probar la funcionalidad**

1. **En desarrollo (localhost)**
   - Ejecuta `npm run dev`
   - Ve a http://localhost:5173/auth
   - Click en "Continuar con Google"
   - Deberías ser redirigido a Google para autenticarte
   - Después de autenticarte, volverás a la app

2. **En producción**
   - Despliega los cambios
   - Ve a tu dominio de producción
   - Prueba el flujo de Google OAuth

---

### **Paso 5: Consideraciones importantes**

#### **Permisos y Scopes**
Por defecto, Google OAuth pide:
- `email` - Email del usuario
- `profile` - Nombre y foto de perfil

#### **Datos del usuario**
Cuando un usuario se autentica con Google:
- Se crea automáticamente en `auth.users`
- Se crea automáticamente un perfil en `profiles` (gracias al trigger)
- El `user_metadata` contendrá:
  - `full_name` - Nombre completo de Google
  - `avatar_url` - URL de la foto de perfil
  - `email` - Email de Google

#### **Asignación de rol**
⚠️ **IMPORTANTE:** Los usuarios que se registran con Google necesitan que se les asigne un rol manualmente o mediante lógica adicional.

Opciones:
1. **Asignar rol por defecto** en el trigger `handle_new_user`
2. **Mostrar pantalla de selección de rol** después del primer login
3. **Asignar rol 'player' por defecto** y que admins lo cambien después

---

### **Paso 6: Troubleshooting**

#### Error: "redirect_uri_mismatch"
- **Causa:** La URL de redirect no está en la lista de URIs autorizadas
- **Solución:** Verifica que agregaste correctamente todas las URIs en Google Cloud Console

#### Error: "Access blocked: This app's request is invalid"
- **Causa:** No configuraste el OAuth consent screen
- **Solución:** Ve a Google Cloud Console > "OAuth consent screen" y completa la información

#### El usuario se crea pero no tiene perfil
- **Causa:** El trigger `handle_new_user` podría no estar funcionando
- **Solución:** Verifica que el trigger existe en Supabase SQL Editor

#### El usuario tiene perfil pero no tiene rol
- **Causa:** El trigger no asigna rol por defecto
- **Solución:** Modifica el trigger para asignar un rol por defecto

---

### **Paso 7: Mejoras opcionales**

1. **Agregar Google Sign In en página de registro**
   - Mismo botón, mismo handler

2. **Pre-rellenar datos del perfil**
   - Usar `user.user_metadata.full_name` para el nombre
   - Usar `user.user_metadata.avatar_url` para la foto de perfil

3. **Vincular cuentas existentes**
   - Si un usuario con el mismo email ya existe, permitir vincular la cuenta de Google

4. **Analytics**
   - Trackear cuántos usuarios usan Google OAuth vs email/password

---

## 🎯 Resultado final

Después de completar todos los pasos, los usuarios podrán:
- ✅ Iniciar sesión con Google en un solo click
- ✅ No necesitar crear contraseña
- ✅ Usar su foto de perfil de Google automáticamente
- ✅ Experiencia más rápida y segura

---

## 📚 Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
