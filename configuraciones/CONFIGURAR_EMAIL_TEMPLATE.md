# 📧 Cómo Configurar la Plantilla de Email en Supabase

## 🎯 Objetivo
Personalizar el email que reciben los usuarios cuando solicitan recuperar su contraseña.

---

## 📋 Pasos para Configurar

### 1. Acceder a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto **PadeLock**
3. En el menú lateral izquierdo, haz click en **Authentication** (icono de candado)
4. Luego haz click en **Email Templates**

### 2. Seleccionar el Template Correcto

En la lista de templates, busca y selecciona:
- **"Change Email Address"** o **"Reset Password"**

(El nombre puede variar según la versión de Supabase, pero es el template para recuperación de contraseña)

### 3. Copiar la Plantilla

1. Abre el archivo `email-template-reset-password.html` que está en la raíz del proyecto
2. **Copia TODO el contenido** del archivo (desde `<!DOCTYPE html>` hasta `</html>`)
3. Pégalo en el editor de Supabase, reemplazando el contenido existente

### 4. Verificar Variables

Asegúrate de que el template contenga estas líneas importantes:

```html
<a href="{{ .ConfirmationURL }}" class="reset-button">
    Restablecer contraseña
</a>
```

Y también:

```html
{{ .ConfirmationURL }}
```

**⚠️ IMPORTANTE:** La variable `{{ .ConfirmationURL }}` es proporcionada por Supabase y contiene:
- La URL completa con el token de recuperación
- El hash con el access_token
- Todos los parámetros necesarios

**NO modifiques** esta variable.

### 5. Guardar los Cambios

1. Haz click en el botón **"Save"** (Guardar) en la parte superior o inferior del editor
2. Espera la confirmación de que se guardó correctamente

---

## 🧪 Probar el Email

### Paso 1: Solicitar Reset
1. Ve a tu aplicación: https://www.padelock.com/forgot-password
2. Ingresa un email válido de prueba
3. Haz click en "Enviar enlace de recuperación"

### Paso 2: Revisar el Email
1. Revisa la bandeja de entrada del email que ingresaste
2. Deberías recibir un email con el nuevo diseño
3. Verifica que:
   - ✅ Tenga el logo "PADELOCK" en el header naranja
   - ✅ Diga "Hola,"
   - ✅ Tenga el texto personalizado
   - ✅ Tenga el botón "Restablecer contraseña" en naranja
   - ✅ Diga "Un saludo, El equipo de Padelock"

### Paso 3: Probar el Enlace
1. Haz click en el botón "Restablecer contraseña" del email
2. Deberías ser redirigido a: https://www.padelock.com/reset-password
3. Deberías poder ingresar una nueva contraseña

---

## 🎨 Personalización (Opcional)

Si quieres modificar el template, puedes cambiar:

### Colores
```css
/* Color principal (naranja) */
background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);

/* Cambiar por otro color, por ejemplo azul: */
background: linear-gradient(135deg, #4a90e2 0%, #5ba3f5 100%);
```

### Textos
Simplemente edita el HTML:

```html
<p class="message">
    Hemos recibido una solicitud para restablecer tu contraseña.
</p>
```

Puedes cambiar a:

```html
<p class="message">
    Recibimos tu solicitud de cambio de contraseña.
</p>
```

### Logo
Si quieres agregar una imagen del logo en lugar de texto:

```html
<!-- Reemplazar -->
<h1 class="logo">PADELOCK</h1>

<!-- Por -->
<img src="URL_DE_TU_LOGO" alt="Padelock" style="height: 60px;">
```

---

## 📧 Vista Previa del Email

El email se verá así:

```
┌──────────────────────────────────────┐
│                                      │
│          PADELOCK                    │
│     (Fondo naranja degradado)        │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  Hola,                               │
│                                      │
│  Hemos recibido una solicitud para   │
│  restablecer tu contraseña.          │
│                                      │
│  Haz clic en el botón de abajo para  │
│  crear una nueva:                    │
│                                      │
│     ┌──────────────────────┐         │
│     │ Restablecer contraseña│         │
│     └──────────────────────┘         │
│                                      │
│  ⏱️ Importante: Este enlace          │
│  expirará en 1 hora por seguridad.   │
│                                      │
│  Si no has solicitado este cambio,   │
│  puedes ignorar este mensaje.        │
│                                      │
│  Un saludo,                          │
│  El equipo de Padelock               │
│                                      │
├──────────────────────────────────────┤
│  Este es un correo automático        │
│  © 2024 Padelock                     │
└──────────────────────────────────────┘
```

---

## ✅ Checklist Final

Después de configurar el template, verifica:

- [ ] Template copiado y pegado en Supabase
- [ ] Guardado correctamente
- [ ] Probado enviando un email de recuperación
- [ ] Email recibido con el nuevo diseño
- [ ] Botón funciona y redirige correctamente
- [ ] Se puede restablecer la contraseña

---

## ❓ Troubleshooting

### Problema: No recibo el email
**Solución:** Revisa la carpeta de spam o espera unos minutos. Los emails de Supabase pueden tardar hasta 5 minutos.

### Problema: El email se ve mal (sin estilos)
**Solución:** Algunos clientes de email bloquean estilos CSS. El email debe verse bien incluso sin estilos gracias al HTML semántico.

### Problema: El enlace no funciona
**Solución:** Asegúrate de que la variable `{{ .ConfirmationURL }}` esté correctamente escrita en el template.

### Problema: Quiero ver cómo se ve antes de enviarlo
**Solución:**
1. Abre el archivo `email-template-reset-password.html` en tu navegador
2. Reemplaza `{{ .ConfirmationURL }}` temporalmente por `#` para previsualizarlo
3. Recuerda volver a poner `{{ .ConfirmationURL }}` antes de subir a Supabase

---

## 📄 Archivos Relacionados

- `email-template-reset-password.html` - Plantilla HTML completa
- `TEMPLATE_EMAIL_SUPABASE.md` - Documentación técnica adicional
- `CONFIGURACION_SUPABASE_PASSWORD_RESET.md` - Guía general de configuración

---

## 💡 Consejos

1. **Prueba siempre** después de hacer cambios en el template
2. **Guarda una copia** del template antes de modificarlo
3. **No elimines** la variable `{{ .ConfirmationURL }}`
4. **Mantén el diseño simple** para compatibilidad con todos los clientes de email
5. **Usa colores de tu marca** para personalizar el email

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.
