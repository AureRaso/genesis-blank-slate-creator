# 🚀 Deploy Instructions for Namecheap

## Archivos de configuración añadidos:

### 1. `public/.htaccess`
Este archivo configura el servidor Apache de Namecheap para:
- ❌ **NO cachear** el `index.html` (siempre descarga la última versión)
- ✅ **SI cachear** archivos JS/CSS/imágenes con hash (por 1 año)
- ✅ Comprimir archivos con GZIP
- ✅ Hacer que funcione React Router (redirige todo a index.html)

### 2. `vite.config.ts`
Configurado para añadir hashes a todos los archivos build:
- `index-abc123.js` (el hash cambia cuando cambia el código)
- `main-def456.css` (el hash cambia cuando cambian los estilos)

## 📋 Proceso de Deploy

### Paso 1: Build del proyecto
```bash
npm run build
```

Esto genera la carpeta `dist/` con todos los archivos optimizados.

### Paso 2: Subir archivos a Namecheap

**Opción A - FTP (Recomendada):**
1. Conecta por FTP a tu hosting de Namecheap
   - Host: `ftp.padelock.com` (o el que te hayan dado)
   - Usuario: tu usuario de cpanel
   - Contraseña: tu contraseña de cpanel

2. Navega a la carpeta `public_html/` o `www/`

3. **IMPORTANTE:** Borra TODOS los archivos antiguos primero

4. Sube TODO el contenido de la carpeta `dist/`:
   - `index.html`
   - `.htaccess` ← IMPORTANTE
   - carpeta `assets/`
   - todos los demás archivos

**Opción B - cPanel File Manager:**
1. Entra en el cPanel de Namecheap
2. Ve a "File Manager"
3. Navega a `public_html/`
4. Borra todos los archivos antiguos
5. Sube el contenido de `dist/`

### Paso 3: Verificar que funciona

1. Abre Chrome en modo incógnito
2. Ve a `https://padelock.com`
3. Abre DevTools (F12) → pestaña "Network"
4. Busca el archivo `index.html`
5. Verifica que tenga el header:
   ```
   Cache-Control: no-cache, no-store, must-revalidate
   ```

## ⚠️ Problemas comunes y soluciones

### Problema: Los usuarios siguen viendo la versión antigua

**Causa:** Cache del navegador de usuarios

**Solución:**
1. Asegúrate de que el `.htaccess` se haya subido correctamente
2. Diles a los usuarios que hagan "hard refresh":
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
3. O que borren la cache del navegador

### Problema: El `.htaccess` no funciona

**Causa:** Apache `mod_headers` no está activado

**Solución:**
1. Contacta con soporte de Namecheap
2. Pídeles que activen el módulo `mod_headers`
3. También verifica que `mod_rewrite` esté activo

### Problema: Error 404 en rutas de React Router

**Causa:** El `.htaccess` no se subió o no está en la carpeta correcta

**Solución:**
1. El `.htaccess` DEBE estar en la carpeta raíz (`public_html/`)
2. DEBE estar al mismo nivel que `index.html`
3. DEBE llamarse exactamente `.htaccess` (con el punto delante)

## 🎯 Checklist de Deploy

- [ ] Ejecutar `npm run build`
- [ ] Verificar que `dist/` contiene `.htaccess`
- [ ] Borrar todos los archivos antiguos del servidor
- [ ] Subir TODO el contenido de `dist/`
- [ ] Verificar que `.htaccess` se subió correctamente
- [ ] Probar en modo incógnito
- [ ] Verificar headers de cache en DevTools
- [ ] Notificar a los usuarios para que limpien cache (solo la primera vez)

## 📞 Contacto Namecheap Support

Si tienes problemas con el `.htaccess`:
- Chat: https://www.namecheap.com/support/live-chat/
- Ticket: https://www.namecheap.com/support/contact/

Pídeles específicamente:
> "Necesito activar mod_headers y mod_rewrite en mi hosting Apache para que funcione el archivo .htaccess"

---

**Nota:** Después del primer deploy con estos cambios, los usuarios que ya visitaron el sitio necesitarán limpiar su cache una vez. Pero después de eso, NUNCA más tendrán problemas de cache gracias a la configuración de headers.
