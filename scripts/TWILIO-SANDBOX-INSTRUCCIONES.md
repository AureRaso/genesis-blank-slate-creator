# Instrucciones para Probar Twilio WhatsApp Sandbox

## Paso 1: Unirse al Sandbox (OBLIGATORIO)

Antes de poder recibir mensajes de prueba, tu número de WhatsApp debe "unirse" al sandbox de Twilio.

### Desde tu teléfono (+34662632906):

1. Abre WhatsApp
2. Envía un mensaje al número **+1 415 523 8886**
3. El mensaje debe ser: `join <palabra-clave>`

> **Nota**: La palabra clave específica la encuentras en tu consola de Twilio:
> https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

Ejemplo típico: `join healthy-cat` (la palabra varía por cuenta)

### Respuesta esperada:

Recibirás un mensaje de confirmación:
```
Twilio Sandbox: ✓ You are all set! The sandbox is now active...
```

---

## Paso 2: Ejecutar el Script de Prueba

### Opción A: PowerShell (Recomendado en Windows)

```powershell
cd c:\Users\sefac\Documents\Sergio\Proyectos\genesis-blank-slate-creator
.\scripts\test-twilio-sandbox.ps1
```

### Opción B: Git Bash / WSL

```bash
cd /c/Users/sefac/Documents/Sergio/Proyectos/genesis-blank-slate-creator
bash scripts/test-twilio-sandbox.sh
```

---

## Paso 3: Verificar Resultado

### Si funciona correctamente:

```
✅ Mensaje enviado correctamente!
SID del mensaje: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Estado: queued
```

Y recibirás en WhatsApp:
```
Your appointment is coming up on 30/12 at 18:00.
If you need to change it, please reply back and let us know.
```

### Si hay error:

| Error | Causa | Solución |
|-------|-------|----------|
| 400 | No unido al sandbox | Envía "join <palabra>" primero |
| 401 | Credenciales mal | Verifica Account SID y Auth Token |
| 403 | Número no autorizado | El sandbox solo acepta números unidos |
| 21608 | Número no en sandbox | Envía "join <palabra>" al sandbox |

---

## Paso 4: Siguiente Paso (después de verificar)

Una vez que el mensaje de prueba funcione, podemos:

1. **Crear una Edge Function de prueba** para Twilio
2. **Comparar lado a lado** con Whapi.cloud
3. **Evaluar si vale la pena** migrar a Twilio

---

## Archivos Creados

```
scripts/
├── test-twilio-sandbox.ps1    # Script PowerShell (Windows)
├── test-twilio-sandbox.sh     # Script Bash (Linux/Mac/WSL)
└── TWILIO-SANDBOX-INSTRUCCIONES.md  # Este archivo

.env.twilio                    # Credenciales (NO commitear)
.env.twilio.example            # Template sin credenciales
```

---

## Notas Importantes

- **El sandbox es solo para pruebas**: límite de mensajes y requiere opt-in manual
- **Para producción**: necesitas WhatsApp Business API aprobada (~2-4 semanas)
- **Costo sandbox**: GRATIS
- **Costo producción**: ~$0.005-0.05 por mensaje + $15/mes base

---

## Encontrar tu Palabra Clave del Sandbox

1. Ve a https://console.twilio.com
2. Navega a: Messaging → Try it out → Send a WhatsApp message
3. Verás algo como: "Send `join <tu-palabra>` to +1 415 523 8886"
