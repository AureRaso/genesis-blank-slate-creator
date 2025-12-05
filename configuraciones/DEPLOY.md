# 🚀 Deploy Instructions for Lovable

## ⚠️ IMPORTANTE: Esta aplicación se deploya desde Lovable

La aplicación **NO se deploya manualmente** desde este repositorio.
El deploy se hace automáticamente desde la plataforma **Lovable**.

## Archivos de configuración añadidos:

### 1. `vercel.json`
Este archivo configura los headers de cache para Vercel/Lovable:
- ❌ **NO cachear** el `index.html` (siempre descarga la última versión)
- ✅ **SI cachear** archivos JS/CSS/imágenes con hash (por 1 año)
- ✅ Comprimir archivos con GZIP
- ✅ Hacer que funcione React Router (redirige todo a index.html)

### 2. `vite.config.ts`
Configurado para añadir hashes a todos los archivos build:
- `index-abc123.js` (el hash cambia cuando cambia el código)
- `main-def456.css` (el hash cambia cuando cambian los estilos)

### 3. `public/.htaccess`
**IGNORAR** - Este archivo solo se usa si deployaras manualmente a Apache.
Como usas Lovable, este archivo no hace nada.

## 📋 Proceso de Deploy

### Paso 1: Hacer commit de tus cambios
```bash
git add .
git commit -m "Tu mensaje"
git push origin main
```

### Paso 2: Publicar desde Lovable

1. Ve a tu proyecto en **Lovable** (https://lovable.dev)
2. Haz clic en **"Publish"** o **"Deploy"**
3. Lovable automáticamente:
   - Hace build del proyecto
   - Sube los archivos a Vercel/su infraestructura
   - Aplica la configuración de `vercel.json`
   - Publica en `https://padelock.com`

### Paso 3: Verificar que funciona

1. Espera 1-2 minutos para que Lovable complete el deploy
2. Abre Chrome en **modo incógnito**
3. Ve a `https://padelock.com`
4. Verifica que ves los últimos cambios

## ⚠️ Problemas comunes y soluciones

### Problema: Los usuarios siguen viendo la versión antigua

**Causa:** Cache del navegador de usuarios

**Solución:**
1. Asegúrate de que el `.htaccess` se haya subido correctamente
2. Diles a los usuarios que hagan "hard refresh":
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. O que borren la cache del navegador

### Problema: Lovable no está deployando

**Causa:** Puede haber un error en el build

**Solución:**
1. Revisa los logs en Lovable
2. Verifica que `npm run build` funcione localmente
3. Contacta con soporte de Lovable si el problema persiste

### Problema: Error 404 en rutas de React Router

**Causa:** El `vercel.json` no se aplicó correctamente

**Solución:**
1. Verifica que `vercel.json` esté en la raíz del proyecto
2. Haz un nuevo deploy desde Lovable
3. El archivo debería estar al mismo nivel que `package.json`

## 🎯 Checklist de Deploy

- [ ] Hacer commit de cambios (`git push origin main`)
- [ ] Ir a Lovable y hacer clic en "Publish"
- [ ] Esperar 1-2 minutos a que termine el deploy
- [ ] Verificar en modo incógnito que funciona
- [ ] Verificar headers de cache en DevTools (Network tab)
- [ ] Notificar a los usuarios para que limpien cache (solo la primera vez después de aplicar esta configuración)

## 📞 Contacto Lovable Support

Si tienes problemas con el deploy:
- Soporte de Lovable: https://lovable.dev/support
- Discord de Lovable (si tienen)
- Email de soporte

Menciona que necesitas ayuda con:
> "Headers de cache en vercel.json para evitar que los usuarios vean versiones antiguas de la app"

---

**Nota:** Después del primer deploy con estos cambios, los usuarios que ya visitaron el sitio necesitarán limpiar su cache una vez. Pero después de eso, NUNCA más tendrán problemas de cache gracias a la configuración de headers.
