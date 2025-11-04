# ✅ Checklist de Verificación del Deploy

Usa esta guía para verificar que el deploy desde Lovable se aplicó correctamente.

## 📋 Paso 1: Verificar que Lovable hizo el deploy

1. Ve a tu proyecto en Lovable
2. Busca en el historial de deploys
3. Verifica que el último deploy incluye el commit `be1204c`
4. Comprueba que el deploy dice "Success" o "Completed"

**Estado:** ⬜ Pendiente

---

## 🔍 Paso 2: Verificar Headers de Cache

### Opción A - Desde el Navegador (Más fácil)

1. Abre Chrome en **modo incógnito**
2. Abre DevTools (F12)
3. Ve a la pestaña **"Network"**
4. Marca la casilla **"Disable cache"** (para forzar descarga)
5. Visita: `https://padelock.com`
6. Busca el archivo `index.html` en la lista de Network
7. Haz clic en `index.html`
8. Ve a la pestaña **"Headers"**
9. Busca en **"Response Headers"** → **"cache-control"**

**✅ Resultado esperado:**
```
cache-control: public, max-age=0, must-revalidate
```

**❌ Si ves esto (MALO):**
```
cache-control: public, max-age=3600
cache-control: max-age=31536000
```

10. Ahora busca un archivo JavaScript en la carpeta `assets/`
11. Por ejemplo: `assets/index-abc123.js` (el nombre tendrá un hash)
12. Verifica sus headers

**✅ Resultado esperado para JS/CSS:**
```
cache-control: public, max-age=31536000, immutable
```

**Estado:** ⬜ Pendiente

### Opción B - Desde PowerShell (Más técnico)

Ejecuta este comando en PowerShell:

```powershell
# Verificar headers del index.html
curl -I https://padelock.com 2>$null | Select-String "cache-control"

# Debería mostrar: cache-control: public, max-age=0, must-revalidate
```

**Estado:** ⬜ Pendiente

---

## 🎾 Paso 3: Verificar Validación de Waitlist

### Test 1: Clase ya finalizada (3 de noviembre)

1. Abre Chrome en **modo incógnito**
2. Visita: `https://padelock.com/waitlist/73ae8432-adcc-4f22-92e5-c4f08961f074/2025-11-03`

**✅ Resultado esperado:**
- Pantalla roja
- Título: **"Clase finalizada"**
- Mensaje: **"Esta clase ya ha finalizado"**

**❌ Si ves esto (MALO):**
- "¡Plaza de clase disponible!"
- Botón para unirse a lista de espera

**Estado:** ⬜ Pendiente

### Test 2: Clase futura (debería funcionar)

1. Busca una clase que sea en el futuro (mañana o más adelante)
2. Visita el enlace de waitlist de esa clase
3. Debería mostrar: **"¡Plaza de clase disponible!"**

**Estado:** ⬜ Pendiente

---

## 👥 Paso 4: Verificar con Usuarios Reales

Pide a 2-3 usuarios que:

1. **Si ya visitaron padelock.com antes:**
   - Borren cache del navegador O
   - Hagan hard refresh: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)

2. Visiten el enlace: `https://padelock.com/waitlist/73ae8432-adcc-4f22-92e5-c4f08961f074/2025-11-03`

3. Confirmen que ven: **"Esta clase ya ha finalizado"**

**Usuarios verificados:**
- ⬜ Usuario 1: _________________
- ⬜ Usuario 2: _________________
- ⬜ Usuario 3: _________________

---

## 🐛 Troubleshooting

### Problema: Los headers de cache siguen mal

**Posible causa:** Lovable no detectó el `vercel.json`

**Solución:**
1. Verifica que `vercel.json` esté en la raíz del proyecto (al mismo nivel que `package.json`)
2. Haz otro deploy desde Lovable
3. Si persiste, contacta con soporte de Lovable

### Problema: Sigue mostrando "Plaza disponible" para clase del 3 nov

**Posible causa:** El código no se deployó correctamente

**Solución:**
1. Verifica en Lovable que el último deploy incluye el commit `be1204c`
2. Revisa los logs de build en Lovable
3. Asegúrate de que no hay errores en el build

### Problema: Funciona en incógnito pero no en navegador normal

**Causa:** Cache del navegador del usuario

**Solución:** Es normal. Cada usuario debe limpiar cache UNA VEZ.

---

## ✅ Resultado Final

Si todos estos checks pasan:

✅ Headers de cache correctos
✅ index.html no se cachea
✅ Assets JS/CSS se cachean por 1 año
✅ Validación de waitlist funciona (clase del 3 nov muestra "finalizada")
✅ Usuarios confirman que funciona

**🎉 ¡Deploy exitoso! El problema de cache está resuelto para siempre.**

---

## 📊 Registro de Verificación

**Fecha del deploy:** _______________
**Hora:** _______________
**Deploy ID en Lovable:** _______________
**Verificado por:** _______________

**Notas:**
_________________________________________
_________________________________________
_________________________________________
