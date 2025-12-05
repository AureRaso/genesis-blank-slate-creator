# 🔍 Cómo verificar y configurar Supabase para Password Reset

## Problema Actual
Cuando haces click en el enlace del email, te redirige a `https://www.padelock.com/#` en lugar de `http://localhost:8080/#`

## Causa
La **Site URL** en Supabase está configurada para producción.

---

## ✅ Solución Paso a Paso

### 1. Ve a Supabase Dashboard
https://supabase.com/dashboard

### 2. Selecciona tu proyecto
Busca el proyecto de PadeLock

### 3. Ve a Authentication → URL Configuration
En el menú lateral izquierdo:
- Click en **Authentication** (icono de candado)
- Click en **URL Configuration**

### 4. Verifica la configuración actual

Deberías ver algo como:

```
Site URL: https://www.padelock.com
```

### 5. Cambia temporalmente para desarrollo

**Durante desarrollo**, cambia a:
```
Site URL: http://localhost:8080
```

**Redirect URLs** - Agrega estas líneas (una por línea):
```
http://localhost:8080/**
http://localhost:5173/**
https://www.padelock.com/**
```

### 6. Guarda los cambios
Click en **Save** (Guardar)

### 7. Prueba el flujo nuevamente
1. Ve a http://localhost:8080/forgot-password
2. Solicita un reset de contraseña
3. Revisa tu email
4. **Ahora el enlace del email debería apuntar a localhost**
5. Click en el enlace → Deberías llegar a http://localhost:8080/reset-password con el token

---

## 🔄 Cuando pases a producción

**IMPORTANTE**: Antes de desplegar a producción, recuerda cambiar de nuevo:

```
Site URL: https://www.padelock.com
```

Y deja las **Redirect URLs** con ambas:
```
http://localhost:8080/**
https://www.padelock.com/**
```

Así podrás trabajar en ambos ambientes.

---

## 🧪 Alternativa: Usar diferentes proyectos de Supabase

Si vas a desarrollar frecuentemente, considera tener:

- **Proyecto de Desarrollo** → Site URL: http://localhost:8080
- **Proyecto de Producción** → Site URL: https://www.padelock.com

Usa diferentes archivos `.env`:
- `.env.local` → Apunta al proyecto de desarrollo
- `.env.production` → Apunta al proyecto de producción

---

## ⚡ Workaround Mientras Configuras Supabase

Si no puedes cambiar la configuración ahora mismo, usa:

**http://localhost:8080/test-password-reset**

Esta página convierte automáticamente los enlaces de producción a localhost.

---

## 📸 Captura de Pantalla de Referencia

La sección **URL Configuration** en Supabase debería verse así:

```
┌─────────────────────────────────────────┐
│ Authentication                          │
│                                         │
│ Site URL                                │
│ ┌─────────────────────────────────────┐ │
│ │ http://localhost:8080               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Redirect URLs                           │
│ ┌─────────────────────────────────────┐ │
│ │ http://localhost:8080/**            │ │
│ │ https://www.padelock.com/**         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ Save ]                                │
└─────────────────────────────────────────┘
```

---

## ❓ ¿Necesitas ayuda?

Si tienes problemas:
1. Verifica que el servidor de desarrollo esté corriendo: `npm run dev`
2. Verifica que puedas acceder a http://localhost:8080
3. Limpia la caché del navegador si el enlace antiguo está cacheado
4. Solicita un nuevo email de reset después de cambiar la configuración
