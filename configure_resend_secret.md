# Configurar Resend API Key para Contact Form

## Paso 1: Obtener tu Resend API Key

1. Ve a https://resend.com/api-keys
2. Crea una nueva API key o usa una existente
3. Copia la key (empieza con `re_`)

## Paso 2: Configurar el Secret en Supabase

Hay dos formas de hacerlo:

### Opción A: Desde el Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/settings/functions
2. En la sección "Function Secrets", haz clic en "Add secret"
3. Nombre: `RESEND_API_KEY`
4. Valor: Tu API key de Resend (la que copiaste en el paso 1)
5. Guarda los cambios

### Opción B: Desde la CLI

```bash
npx supabase secrets set RESEND_API_KEY=tu_api_key_aqui
```

## Paso 3: Verificar

Una vez configurado, el formulario de contacto en `/landing` enviará emails automáticamente a `infopadelock@gmail.com` cuando alguien lo complete.

## Probar el formulario

1. Ve a http://localhost:8080/landing
2. Desplázate hasta el formulario de contacto
3. Rellena los campos requeridos (Nombre y Email)
4. Haz clic en "Solicitar Demo Gratuita"
5. Deberías recibir un email en infopadelock@gmail.com

## Solución de problemas

Si no recibes emails:

1. Verifica que la API key esté configurada correctamente en Supabase
2. Revisa los logs de la Edge Function:
   ```bash
   npx supabase functions logs send-contact-email
   ```
3. Asegúrate de que tu cuenta de Resend esté activa y verificada
4. Si usas el plan gratuito de Resend, solo puedes enviar a emails verificados

## Nota sobre Resend en desarrollo

En el plan gratuito de Resend, solo puedes enviar emails a direcciones verificadas. Para producción, necesitarás:
1. Verificar tu dominio en Resend
2. Cambiar el `from` en la Edge Function de `onboarding@resend.dev` a tu dominio verificado
