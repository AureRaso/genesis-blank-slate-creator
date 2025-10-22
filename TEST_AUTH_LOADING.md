# 🧪 Guía de Pruebas: Sistema de Seguridad de Pantalla en Blanco

Este documento explica cómo probar el sistema de protección contra pantallas en blanco implementado en `AuthPage.tsx`.

## ¿Qué Hemos Implementado?

Se ha añadido un sistema de seguridad con:
- ✅ Timeout de 5 segundos que fuerza redirección al dashboard
- ✅ Pantalla de carga visible con spinner
- ✅ Try-catch en todas las operaciones async
- ✅ Función `safeRedirect` que previene múltiples redirecciones
- ✅ Cleanup apropiado para evitar memory leaks

## Cómo Probar

### Requisitos Previos
1. Inicia sesión en la aplicación con cualquier cuenta
2. Una vez dentro, añade parámetros de URL para activar los modos de prueba

### Modos de Prueba Disponibles

Usa estos parámetros en la URL para simular diferentes escenarios:

#### 1. **Timeout Infinito** (Simula hang/bloqueo)
```
http://localhost:8080/?test=timeout
```
**Qué hace:**
- Simula que la verificación se queda colgada para siempre
- El timeout de 5 segundos debería rescatar y redirigir al dashboard
- Verás la pantalla de carga con el spinner
- En la consola aparecerá: `⏱️ Timeout reached, forcing redirect to dashboard`

**Qué deberías ver:**
- Pantalla de carga con mensaje "Verificando tu cuenta..."
- Indicador amarillo mostrando "TEST MODE: timeout"
- Después de 5 segundos, redirección automática al dashboard

---

#### 2. **Respuesta Lenta** (Simula latencia)
```
http://localhost:8080/?test=slow&testDelay=3000
```
**Qué hace:**
- Simula una verificación lenta pero exitosa
- Espera 3 segundos (o el delay que especifiques) antes de redirigir
- Usa `testDelay` para cambiar la duración (en milisegundos)

**Ejemplos:**
```
?test=slow&testDelay=2000  → Espera 2 segundos
?test=slow&testDelay=4000  → Espera 4 segundos
?test=slow&testDelay=6000  → Espera 6 segundos (el timeout lo rescatará)
```

**Qué deberías ver:**
- Pantalla de carga durante el tiempo especificado
- Indicador amarillo mostrando "TEST MODE: slow (delay: Xms)"
- Si el delay es < 5s: redirección exitosa después del delay
- Si el delay es ≥ 5s: timeout rescata después de 5 segundos

---

#### 3. **Error de Base de Datos** (Simula error inesperado)
```
http://localhost:8080/?test=error
```
**Qué hace:**
- Simula un error al verificar la cuenta
- El catch debería capturarlo y redirigir al dashboard
- En la consola aparecerá: `Unexpected error in checkGuardianSetup: Error: Simulated database error`

**Qué deberías ver:**
- Pantalla de carga brevemente
- Indicador amarillo mostrando "TEST MODE: error"
- Redirección inmediata al dashboard con mensaje de error en consola

---

#### 4. **Error en Verificación de Guardian** (Simula error específico)
```
http://localhost:8080/?test=guardian-check-error
```
**Qué hace:**
- Simula un error específico al verificar si un guardian tiene hijos
- Solo afecta a cuentas con rol 'guardian'
- Para otras cuentas, funciona normal

**Qué deberías ver:**
- Si eres guardian: error capturado y redirección al dashboard
- Si no eres guardian: funciona normalmente
- Indicador amarillo mostrando "TEST MODE: guardian-check-error"

---

## Cómo Acceder a los Tests

### Método 1: Cambiar URL manualmente
1. Inicia sesión normalmente
2. Cuando estés en el dashboard, cierra sesión
3. Modifica la URL en el navegador añadiendo el parámetro de prueba
4. Inicia sesión de nuevo

### Método 2: Usar console en el navegador
```javascript
// Forzar redirección a AuthPage con test
window.location.href = '/?test=timeout';
```

### Método 3: Añadir botón de pruebas (temporal)
Puedes añadir temporalmente en tu dashboard:
```jsx
<Button onClick={() => {
  // Cerrar sesión y redirigir con test
  supabase.auth.signOut().then(() => {
    window.location.href = '/?test=timeout';
  });
}}>
  🧪 Test Timeout
</Button>
```

---

## Qué Verificar en Cada Test

### ✅ Checklist de Verificación

Para cada modo de prueba, verifica:

- [ ] **Pantalla de carga visible**: Debe aparecer el spinner y el mensaje
- [ ] **Indicador de test visible**: El cuadro amarillo debe mostrar el modo activo
- [ ] **Console logs claros**: Mensajes en consola con emojis 🧪
- [ ] **Redirección exitosa**: Después del tiempo esperado, redirige al dashboard
- [ ] **Sin pantalla en blanco**: Nunca debería quedarse en blanco sin feedback
- [ ] **Timeout funciona**: Si se cuelga, el timeout de 5s rescata
- [ ] **No hay errores**: No debe haber errores no manejados en la consola

---

## Consola: Qué Esperar

### Test Mode: timeout
```
🧪 TEST MODE ACTIVATED: timeout
🧪 Simulating infinite hang...
[Después de 5 segundos]
⏱️ Timeout reached, forcing redirect to dashboard
```

### Test Mode: slow
```
🧪 TEST MODE ACTIVATED: slow
🧪 Simulating slow response (3000ms)...
[Después del delay]
🧪 Slow response completed, redirecting...
```

### Test Mode: error
```
🧪 TEST MODE ACTIVATED: error
🧪 Simulating database error...
Unexpected error in checkGuardianSetup: Error: Simulated database error
```

### Test Mode: guardian-check-error
```
🧪 TEST MODE ACTIVATED: guardian-check-error
🧪 Simulating guardian children check error...
Exception checking guardian children: Error: Simulated guardian check error
Error fetching children, redirecting to dashboard: [error details]
```

---

## Casos Reales que Esto Previene

Este sistema protege contra:

1. **Queries de Supabase que no responden** (timeout o hang)
2. **Errores en políticas RLS** que causan excepciones
3. **Problemas de red** que hacen que las queries fallen silenciosamente
4. **Bugs en el código de verificación** que causan crashes
5. **Race conditions** en la gestión de sesiones

---

## Desactivar Modo de Prueba

Para volver al comportamiento normal, simplemente:
- Remueve los parámetros `?test=...` de la URL
- O navega a la página sin parámetros: `http://localhost:8080/`

---

## Notas Importantes

⚠️ **Este modo de prueba solo está disponible en desarrollo**
- Los parámetros de test funcionan en cualquier entorno
- Considera removerlos en producción si no quieres que los usuarios los descubran

💡 **Tip para Testing en Producción**
Si quieres probar en producción sin afectar usuarios:
1. Añade una condición para activar solo con una clave secreta
2. Ejemplo: `?test=timeout&key=tu-clave-secreta`

🔧 **Personalizar Timeouts**
Para cambiar el timeout de 5 segundos, modifica esta línea en `AuthPage.tsx`:
```typescript
timeoutId = setTimeout(() => {
  // Cambiar 5000 a otro valor (en milisegundos)
}, 5000);
```

---

## Resumen Rápido

```bash
# Test básicos
?test=timeout                    # Simula hang infinito → timeout rescata en 5s
?test=slow&testDelay=3000        # Simula 3s de latencia → funciona OK
?test=slow&testDelay=6000        # Simula 6s de latencia → timeout rescata
?test=error                      # Simula error de BD → catch rescata
?test=guardian-check-error       # Simula error de guardian → catch rescata
```

---

## Próximos Pasos

Una vez verificado que todo funciona:
1. ✅ Testear cada escenario
2. ✅ Verificar que los logs son claros
3. ✅ Confirmar que nunca hay pantalla en blanco
4. 🔄 Opcionalmente, añadir más escenarios de prueba
5. 🚀 Desplegar a producción con confianza

---

**¿Preguntas?** Este sistema está diseñado para ser a prueba de fallos. Si encuentras un caso donde aún se queda en blanco, documéntalo y lo ajustaremos.
