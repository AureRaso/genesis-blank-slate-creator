# Configuración de Stripe para Pagos de Clubes

Esta guía te ayudará a configurar Stripe para gestionar las suscripciones mensuales de los clubes.

## 📋 Requisitos Previos

- Cuenta de Stripe (crear en https://stripe.com)
- Acceso a Supabase CLI
- Permisos de administrador en tu proyecto

---

## 🚀 Paso 1: Configurar Stripe

### 1.1 Crear una cuenta en Stripe

1. Ve a https://stripe.com
2. Crea una cuenta o inicia sesión
3. Activa el **modo de pruebas** (test mode) en el dashboard

### 1.2 Crear un Producto de Suscripción

1. En el dashboard de Stripe, ve a **Productos** → **Crear producto**
2. Configura el producto:
   - **Nombre**: "Mensualidad Club PadeLock" (o el nombre que prefieras)
   - **Descripción**: "Suscripción mensual para acceso completo a PadeLock"
   - **Modelo de precios**: Recurrente
   - **Intervalo de facturación**: Mensual
   - **Precio**: Define el precio base (por ejemplo, €49.99)

3. **IMPORTANTE**: Guarda el **Price ID** que se genera (algo como `price_xxxxxxxxxxxxx`)

### 1.3 Obtener las Claves API

1. Ve a **Desarrolladores** → **Claves API**
2. Copia las siguientes claves:
   - **Publishable key** (comienza con `pk_test_...`)
   - **Secret key** (comienza con `sk_test_...`)

⚠️ **IMPORTANTE**: Nunca compartas tu Secret key públicamente.

---

## 🔧 Paso 2: Configurar Variables de Entorno

### 2.1 Variables de Entorno en Supabase

Accede a tu proyecto de Supabase:

1. Ve a **Settings** → **Edge Functions** → **Secrets**
2. Agrega las siguientes variables:

```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
```

### 2.2 Variables de Entorno en tu Proyecto Local

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxx
```

---

## 📊 Paso 3: Aplicar la Migración de Base de Datos

Ejecuta la migración para crear la tabla `club_subscriptions`:

```bash
# Si usas Supabase CLI local
supabase db push

# O aplica directamente en Supabase Dashboard
# Ve a SQL Editor y ejecuta el archivo:
# supabase/migrations/create_club_subscriptions.sql
```

---

## 🔗 Paso 4: Configurar Webhooks de Stripe

Los webhooks permiten que Stripe notifique a tu aplicación cuando ocurren eventos (pagos, cancelaciones, etc.).

### 4.1 Desplegar las Edge Functions

```bash
# Desplegar la función de crear checkout
npx supabase functions deploy create-stripe-checkout

# Desplegar la función de webhook
npx supabase functions deploy stripe-webhook

# Desplegar la función de cancelar suscripción
npx supabase functions deploy cancel-stripe-subscription
```

### 4.2 Configurar el Webhook en Stripe

1. En el dashboard de Stripe, ve a **Desarrolladores** → **Webhooks**
2. Click en **Agregar endpoint**
3. Configura el endpoint:
   - **URL del endpoint**: `https://[tu-proyecto-id].supabase.co/functions/v1/stripe-webhook`
   - **Descripción**: "Webhook para PadeLock Club Subscriptions"
   - **Eventos a escuchar**:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

4. **IMPORTANTE**: Copia el **Signing secret** (comienza con `whsec_...`)

### 4.3 Agregar el Webhook Secret

Agrega el webhook secret a las variables de entorno de Supabase:

1. Ve a **Settings** → **Edge Functions** → **Secrets**
2. Agrega:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
```

---

## 🧪 Paso 5: Probar el Sistema

### 5.1 Tarjetas de Prueba de Stripe

Para probar el sistema en modo test, usa estas tarjetas:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago rechazado**: `4000 0000 0000 0002`
- **Requiere autenticación 3D Secure**: `4000 0025 0000 3155`

Detalles adicionales para las pruebas:
- **Fecha de vencimiento**: Cualquier fecha futura
- **CVC**: Cualquier 3 dígitos
- **Código postal**: Cualquier código postal válido

### 5.2 Flujo de Prueba

1. Inicia sesión como administrador de un club
2. Ve a la sección "Pago" en el sidebar
3. Click en "Proceder al Pago"
4. Completa el formulario de Stripe con una tarjeta de prueba
5. Verifica que:
   - Seas redirigido correctamente después del pago
   - La suscripción aparezca como "Activa" en la página de pagos
   - Los datos se guarden correctamente en `club_subscriptions`

---

## 🔄 Paso 6: Ir a Producción

Cuando estés listo para producción:

### 6.1 Activar Modo Producción en Stripe

1. En el dashboard de Stripe, cambia de **Test mode** a **Production mode**
2. Ve a **Desarrolladores** → **Claves API**
3. Copia las nuevas claves (ahora comenzarán con `pk_live_...` y `sk_live_...`)

### 6.2 Actualizar Variables de Entorno

Actualiza todas las variables de entorno con las claves de producción:

**En Supabase:**
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx (el ID del producto en producción)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx (crear nuevo webhook para producción)
```

**En tu proyecto:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxx
```

### 6.3 Crear Webhook de Producción

Repite el Paso 4.2 pero con la URL de producción y obtén un nuevo webhook secret.

---

## 💰 Configurar Precios Personalizados por Club

Si quieres cobrar diferentes cantidades a diferentes clubes:

### Opción 1: Crear Múltiples Productos en Stripe

1. Crea un producto diferente para cada nivel de precio
2. Guarda cada `price_id` en tu base de datos
3. Modifica la función `create-stripe-checkout` para seleccionar el precio correcto según el club

### Opción 2: Usar Precios Personalizados (Custom Pricing)

Puedes crear precios bajo demanda usando la API de Stripe dentro de la Edge Function.

---

## 📝 Gestión de Suscripciones

### Ver todas las suscripciones

```sql
SELECT
  cs.*,
  c.name as club_name
FROM club_subscriptions cs
JOIN clubs c ON c.id = cs.club_id
ORDER BY cs.created_at DESC;
```

### Cancelar una suscripción

Los administradores de clubes pueden cancelar su suscripción directamente desde la página de **Pago** en el dashboard:

1. Ve a **Dashboard** → **Pago**
2. Si tienes una suscripción activa, verás el botón **Cancelar Suscripción**
3. La suscripción se cancelará al final del período actual (no inmediatamente)
4. El club mantendrá acceso hasta que finalice el período pagado

#### Cancelar manualmente (solo administradores del sistema)

Desde el dashboard de Stripe o mediante SQL:

```sql
UPDATE club_subscriptions
SET
  status = 'canceled',
  cancel_at_period_end = true,
  canceled_at = NOW()
WHERE id = '[subscription_id]';
```

**Nota**: Es mejor cancelar desde Stripe directamente para mantener la sincronización correcta.

---

## 🐛 Solución de Problemas

### Error: "STRIPE_MONTHLY_PRICE_ID no está configurada"

- Verifica que hayas agregado el Price ID en las variables de entorno de Supabase
- Reinicia las Edge Functions si es necesario

### Los webhooks no se reciben

1. Verifica la URL del webhook en Stripe
2. Confirma que el webhook secret esté configurado correctamente
3. Revisa los logs en Supabase: **Functions** → **Logs**
4. Usa la herramienta de testing de webhooks en Stripe

### La suscripción no aparece como activa

1. Revisa los logs de la función `stripe-webhook`
2. Verifica que los eventos estén configurados correctamente en Stripe
3. Comprueba que la tabla `club_subscriptions` tenga los permisos RLS correctos

---

## 📞 Soporte

Si tienes problemas con la integración:

1. Revisa los logs de las Edge Functions en Supabase
2. Consulta la documentación de Stripe: https://stripe.com/docs
3. Verifica los webhooks en el dashboard de Stripe para ver si se están enviando correctamente

---

## 🔒 Seguridad

- ✅ Nunca expongas las claves secretas en el frontend
- ✅ Usa HTTPS en producción
- ✅ Valida todos los webhooks con la firma de Stripe
- ✅ Implementa RLS (Row Level Security) en Supabase
- ✅ Registra y monitorea todos los eventos de pago

---

## ✅ Checklist de Implementación

- [ ] Cuenta de Stripe creada
- [ ] Producto de suscripción creado en Stripe
- [ ] Price ID guardado
- [ ] Claves API obtenidas
- [ ] Variables de entorno configuradas en Supabase
- [ ] Variables de entorno configuradas localmente
- [ ] Migración de base de datos aplicada
- [ ] Edge Functions desplegadas
- [ ] Webhook configurado en Stripe
- [ ] Webhook secret agregado a variables de entorno
- [ ] Sistema probado con tarjetas de prueba
- [ ] Flujo de pago validado
- [ ] Webhooks funcionando correctamente
- [ ] Listo para producción

---

**¡Configuración completada! 🎉**

Ahora los administradores de clubes pueden gestionar sus suscripciones mensuales desde la sección "Pago" del dashboard.
