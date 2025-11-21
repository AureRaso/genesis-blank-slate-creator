# Send Test WhatsApp Message

Edge Function para enviar mensajes de prueba de WhatsApp a usuarios individuales basándose en su email.

## Descripción

Esta función busca un usuario por su email en `auth.users`, extrae su número de teléfono del `user_metadata.phone`, lo formatea correctamente para Whapi y envía un mensaje de prueba.

## Setup

### Variables de Entorno Requeridas

```bash
# Ya deberían estar configuradas si usas las otras funciones de WhatsApp
WHAPI_TOKEN=tu_token_de_whapi
WHAPI_ENDPOINT=https://gate.whapi.cloud (opcional)
```

### Deploy

```bash
npx supabase functions deploy send-test-whatsapp
```

## Uso

### Desde cURL

```bash
curl -X POST \
  https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-test-whatsapp \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_OR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "mark20@gmail.com",
    "message": "¡Hola! Este es un mensaje de prueba personalizado"
  }'
```

### Desde el Frontend (React)

```typescript
const sendTestWhatsApp = async (userEmail: string) => {
  const { data, error } = await supabase.functions.invoke('send-test-whatsapp', {
    body: {
      userEmail: userEmail,
      message: '¡Mensaje de prueba personalizado!' // Opcional
    }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Mensaje enviado:', data);
};

// Uso
sendTestWhatsApp('mark20@gmail.com');
```

## Request Body

```typescript
{
  userEmail: string;    // Email del usuario registrado (requerido)
  message?: string;     // Mensaje personalizado (opcional)
}
```

Si no se proporciona `message`, se enviará un mensaje de prueba por defecto.

## Response

### Éxito (200)

```json
{
  "success": true,
  "messageId": "whapi_message_id",
  "userEmail": "mark20@gmail.com",
  "phone": "+34612345678",
  "formattedPhone": "34612345678@s.whatsapp.net",
  "message": "Contenido del mensaje enviado",
  "data": { /* Respuesta completa de Whapi */ }
}
```

### Error (400)

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## Formato de Números de Teléfono

La función acepta números en varios formatos y los convierte automáticamente al formato de Whapi:

- Input: `+34 612 345 678` → Output: `34612345678@s.whatsapp.net`
- Input: `612345678` → Output: `612345678@s.whatsapp.net`
- Input: `34612345678` → Output: `34612345678@s.whatsapp.net`

## Notas Importantes

1. **El usuario debe existir en `auth.users`** con el email proporcionado
2. **El usuario debe tener el campo `phone` en su `user_metadata`**
3. **El número debe estar registrado en WhatsApp** para que el mensaje llegue
4. **Rate limiting**: Ten en cuenta los límites de Whapi para evitar baneos

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `User not found` | Email no existe en auth.users | Verificar que el usuario esté registrado |
| `No phone number found` | user_metadata.phone está vacío | Asegurarse de que el usuario haya completado su perfil |
| `Whapi API error: 404` | Número no válido o no registrado en WhatsApp | Verificar el número de teléfono |
| `No authorization header` | Falta el token de autenticación | Incluir header Authorization |

## Testing Local

```bash
# Servir la función localmente
npx supabase functions serve send-test-whatsapp

# Probar con curl
curl -X POST http://localhost:54321/functions/v1/send-test-whatsapp \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "mark20@gmail.com"}'
```
