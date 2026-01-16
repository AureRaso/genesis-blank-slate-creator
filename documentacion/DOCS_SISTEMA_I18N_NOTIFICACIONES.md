# Sistema de Internacionalización (i18n) para Notificaciones

## Índice
1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Configuración de Idioma por Club](#configuración-de-idioma-por-club)
4. [Recordatorios 24h](#recordatorios-24h)
5. [Notificaciones de Plaza Libre/Ausencia](#notificaciones-de-plaza-libreausencia)
6. [Confirmación de Ausencia (Webhook)](#confirmación-de-ausencia-webhook)
7. [Lista de Espera - Aceptación/Rechazo](#lista-de-espera---aceptaciónrechazo)
8. [Cancelación de Clases](#cancelación-de-clases)
9. [Página de Lista de Espera](#página-de-lista-de-espera)
10. [Plantillas de Meta (WhatsApp Business)](#plantillas-de-meta-whatsapp-business)
11. [Idiomas Soportados](#idiomas-soportados)
12. [Resumen de Archivos Modificados](#resumen-de-archivos-modificados)

---

## Introducción

El sistema de notificaciones de Padelock soporta múltiples idiomas para adaptarse a clubes de diferentes países. Cada club puede configurar su idioma predeterminado, y todas las notificaciones (WhatsApp, email y UI) se envían en ese idioma.

### Idiomas Soportados

| Código | Idioma   | Locale     |
|--------|----------|------------|
| `es`   | Español  | `es-ES`    |
| `en`   | Inglés   | `en-US`    |
| `it`   | Italiano | `it-IT`    |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CONFIGURACIÓN DE IDIOMA                          │
├─────────────────────────────────────────────────────────────────────┤
│  Tabla: clubs                                                        │
│  Campo: default_language (varchar) - valores: 'es', 'en', 'it'      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICACIONES AFECTADAS                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Recordatorios 24h (WhatsApp templates + Email)                  │
│  2. Notificaciones plaza libre/ausencia (WhatsApp grupo)            │
│  3. Confirmación de ausencia (Webhook respuesta)                    │
│  4. Lista de espera - Aceptación/Rechazo (WhatsApp + Email)         │
│  5. Cancelación de clases (WhatsApp templates)                      │
│  6. Página de lista de espera (UI)                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuración de Idioma por Club

### Tabla `clubs`

El idioma se configura en el campo `default_language` de la tabla `clubs`:

```sql
-- Ver idioma de un club
SELECT id, name, default_language FROM clubs WHERE id = 'club-uuid';

-- Cambiar idioma de un club
UPDATE clubs SET default_language = 'it' WHERE id = 'club-uuid';
```

### Valores permitidos
- `es` - Español (predeterminado)
- `en` - Inglés
- `it` - Italiano

---

## Recordatorios 24h

### Descripción
Los recordatorios de 24 horas antes de clase se envían vía WhatsApp usando plantillas de Meta y por email. Ambos canales soportan i18n.

### Edge Function
**Archivo**: `supabase/functions/send-class-reminder-kapso/index.ts`

### Plantillas de Meta por Idioma

| Idioma   | Nombre de Plantilla           |
|----------|-------------------------------|
| Español  | `class_reminder`              |
| Inglés   | `class_reminder_en`           |
| Italiano | `class_reminder_it`           |

### Parámetros de las Plantillas
Todas las plantillas usan los mismos parámetros:
- `nombre_jugador` - Nombre del estudiante
- `nombre_clase` - Nombre de la clase
- `fecha_clase` - Fecha formateada en el idioma del club
- `hora_clase` - Hora de la clase (HH:MM)

### Configuración en el Código

```typescript
// Configuración de plantillas por idioma
const TEMPLATE_CONFIG: Record<string, { name: string; languageCode: string }> = {
  'es': { name: 'class_reminder', languageCode: 'es' },
  'en': { name: 'class_reminder_en', languageCode: 'en' },
  'it': { name: 'class_reminder_it', languageCode: 'it' }
};

// Locales para formateo de fechas
const LOCALE_MAP: Record<string, string> = {
  'es': 'es-ES',
  'en': 'en-US',
  'it': 'it-IT'
};
```

### Flujo de Obtención del Idioma

```typescript
// La query incluye el idioma del club
const { data } = await supabaseClient
  .from('programmed_classes')
  .select(`
    id,
    clubs:club_id (
      name,
      default_language
    )
  `)
  .eq('id', classId)
  .single();

const clubLanguage = data?.clubs?.default_language || 'es';
```

---

## Notificaciones de Plaza Libre/Ausencia

### Descripción
Cuando un entrenador notifica una ausencia o plaza libre, se envía un mensaje WhatsApp al grupo del club en el idioma configurado.

### Archivo Frontend
**Archivo**: `src/hooks/useWhatsAppNotification.ts`

### Traducciones

```typescript
const MESSAGE_TRANSLATIONS: Record<string, {
  absenceTitle: string;
  freeSpotTitle: (slots: number) => string;
  dateLabel: string;
  timeLabel: string;
  trainerLabel: string;
  classLabel: string;
  waitlistCta: string;
  footer: string;
  dateLocale: string;
}> = {
  'es': {
    absenceTitle: '🎾 ¡Plaza en clase de recuperación disponible!',
    freeSpotTitle: (slots) => `🎾 ¡${slots === 1 ? '1 plaza disponible' : `${slots} plazas disponibles`} en clase!`,
    dateLabel: 'Fecha',
    timeLabel: 'Hora',
    trainerLabel: 'Profesor',
    classLabel: 'Clase',
    waitlistCta: '👉 Apúntate a la lista de espera en el siguiente enlace:',
    footer: 'Las plazas se asignan a criterio del profesor.',
    dateLocale: 'es-ES'
  },
  'en': {
    absenceTitle: '🎾 Spot available in make-up class!',
    freeSpotTitle: (slots) => `🎾 ${slots === 1 ? '1 spot available' : `${slots} spots available`} in class!`,
    dateLabel: 'Date',
    timeLabel: 'Time',
    trainerLabel: 'Coach',
    classLabel: 'Class',
    waitlistCta: '👉 Join the waitlist at the following link:',
    footer: 'Spots are assigned at the coach\'s discretion.',
    dateLocale: 'en-US'
  },
  'it': {
    absenceTitle: '🎾 Posto disponibile nella lezione di recupero!',
    freeSpotTitle: (slots) => `🎾 ${slots === 1 ? '1 posto disponibile' : `${slots} posti disponibili`} nella lezione!`,
    dateLabel: 'Data',
    timeLabel: 'Ora',
    trainerLabel: 'Allenatore',
    classLabel: 'Lezione',
    waitlistCta: '👉 Iscriviti alla lista d\'attesa al seguente link:',
    footer: 'I posti vengono assegnati a discrezione dell\'allenatore.',
    dateLocale: 'it-IT'
  }
};
```

### Obtención del Idioma
El idioma se obtiene desde `useTodayAttendance.ts` que incluye `club_language` en los datos de cada clase:

```typescript
// En useTodayAttendance.ts
club_language: classData.clubs?.default_language || 'es'
```

---

## Confirmación de Ausencia (Webhook)

### Descripción
Cuando un jugador confirma su ausencia pulsando el botón del mensaje de recordatorio, el webhook envía una confirmación en el idioma del club.

### Edge Function
**Archivo**: `supabase/functions/whatsapp-webhook-kapso/index.ts`

### Mensajes de Confirmación

```typescript
const CONFIRMATION_MESSAGES: Record<string, string> = {
  'es': '✅ Entendido, {name}. Tu ausencia ha sido confirmada.',
  'en': '✅ Got it, {name}. Your absence has been confirmed.',
  'it': '✅ Capito, {name}. La tua assenza è stata confermata.'
};
```

### Flujo de Obtención del Idioma

```typescript
// La query obtiene el idioma del club a través de la participación
const { data: participation } = await supabaseClient
  .from('class_participants')
  .select(`
    id,
    programmed_classes!inner(
      club_id,
      clubs!inner(
        default_language
      )
    )
  `)
  .eq('id', participationId)
  .single();

const clubLanguage = participation.programmed_classes?.clubs?.default_language || 'es';
```

---

## Lista de Espera - Aceptación/Rechazo

### Descripción
Cuando se acepta o rechaza a un jugador de la lista de espera, se le notifica por WhatsApp y email en el idioma del club.

### Edge Functions

#### WhatsApp: `send-waitlist-whatsapp`
**Archivo**: `supabase/functions/send-waitlist-whatsapp/index.ts`

```typescript
const MESSAGE_TEMPLATES: Record<string, { accepted: string; rejected: string }> = {
  es: {
    accepted: `*¡Ya tienes plaza en el entrenamiento!*

Clase: {className}
Fecha: {date}
Hora: {time}
{clubLine}

¡Nos vemos en la pista!`,
    rejected: `Hola {name}!

El entrenamiento del {date} a las {time} ha quedado completo y no ha sido posible darte plaza esta vez.

Gracias por estar pendiente. *¡La siguiente te esperamos!*`
  },
  en: {
    accepted: `*You have a spot in the training!*

Class: {className}
Date: {date}
Time: {time}
{clubLine}

See you on the court!`,
    rejected: `Hi {name}!

The training on {date} at {time} is now full and we couldn't give you a spot this time.

Thanks for your interest. *We'll be waiting for you next time!*`
  },
  it: {
    accepted: `*Hai un posto nell'allenamento!*

Classe: {className}
Data: {date}
Ora: {time}
{clubLine}

Ci vediamo in campo!`,
    rejected: `Ciao {name}!

L'allenamento del {date} alle {time} è ora al completo e non è stato possibile darti un posto questa volta.

Grazie per l'interesse. *Ti aspettiamo la prossima volta!*`
  }
};
```

#### Email: `send-waitlist-email`
**Archivo**: `supabase/functions/send-waitlist-email/index.ts`

```typescript
const EMAIL_TRANSLATIONS: Record<string, {
  acceptedSubject: string;
  rejectedSubject: string;
  acceptedTitle: string;
  rejectedTitle: string;
  greeting: string;
  acceptedIntro: string;
  rejectedMessage: string;
  acceptedFooter: string;
  rejectedFooter: string;
  autoEmailNote: string;
}> = {
  es: {
    acceptedSubject: 'Ya tienes plaza en el entrenamiento',
    rejectedSubject: 'Entrenamiento completo',
    acceptedTitle: 'Ya tienes plaza',
    rejectedTitle: 'Entrenamiento completo',
    greeting: 'Hola,',
    acceptedIntro: '¡Buenas noticias! Tienes plaza en el entrenamiento:',
    rejectedMessage: 'El entrenamiento del {date} a las {time} ha quedado completo...',
    acceptedFooter: '¡Disfruta del entreno!',
    rejectedFooter: 'Gracias por estar pendiente. ¡La siguiente te esperamos!',
    autoEmailNote: 'Este es un email automático, por favor no respondas a este mensaje.'
  },
  en: {
    acceptedSubject: 'You have a spot in the training',
    rejectedSubject: 'Training is full',
    // ... resto de traducciones
  },
  it: {
    acceptedSubject: 'Hai un posto nell\'allenamento',
    rejectedSubject: 'Allenamento completo',
    // ... resto de traducciones
  }
};
```

---

## Cancelación de Clases

### Descripción
Cuando se cancela una clase, se notifica a todos los participantes vía WhatsApp usando plantillas de Meta en el idioma del club.

### Edge Function
**Archivo**: `supabase/functions/send-class-cancellation-kapso/index.ts`

### Plantillas de Meta por Idioma

| Idioma   | Nombre de Plantilla           |
|----------|-------------------------------|
| Español  | `class_cancellation`          |
| Inglés   | `class_cancelation_en`        |
| Italiano | `class_cancelation_it`        |

> **Nota**: Los nombres de plantilla en inglés e italiano tienen "cancelation" (con una 'l') por decisión de Meta.

### Parámetros de las Plantillas
Todas las plantillas usan los mismos parámetros:
- `nombre_jugador` - Nombre del estudiante
- `club` - Nombre del club
- `fecha_clase` - Fecha formateada en el idioma del club
- `hora_clase` - Hora de la clase (HH:MM)

### Configuración en el Código

```typescript
const TEMPLATE_CONFIG: Record<string, { name: string; languageCode: string }> = {
  'es': { name: 'class_cancellation', languageCode: 'es' },
  'en': { name: 'class_cancelation_en', languageCode: 'en' },
  'it': { name: 'class_cancelation_it', languageCode: 'it' }
};
```

---

## Página de Lista de Espera

### Descripción
La página pública donde los jugadores se apuntan a la lista de espera (`/waitlist/:classId/:date`) muestra la interfaz en el idioma del navegador del usuario.

### Archivo
**Archivo**: `src/pages/WaitlistJoinPage.tsx`

### Implementación
Se usa el contexto de idioma (`LanguageContext`) para formatear las fechas en el locale correcto:

```typescript
const { getDateFnsLocale } = useLanguage();

// Formatear fecha con el locale del usuario
const formattedDate = date
  ? format(new Date(date), "EEEE, d MMMM yyyy", { locale: getDateFnsLocale() })
  : '';
```

### Traducciones UI
Las traducciones de la UI se gestionan con `react-i18next` y están en los archivos de traducción:
- `src/locales/es/translation.json`
- `src/locales/en/translation.json`
- `src/locales/it/translation.json`

Claves de traducción para esta página:
```json
{
  "waitlistJoin": {
    "checking": "Comprobando disponibilidad...",
    "success": {
      "title": "¡Apuntado!",
      "message": "Te hemos añadido a la lista de espera.",
      "redirecting": "Redirigiendo en {count}..."
    },
    "main": {
      "title": "Lista de espera",
      "subtitle": "Apúntate para esta clase",
      "importantTitle": "Importante:",
      "importantText": "Las plazas se asignan a criterio del entrenador."
    },
    // ... más traducciones
  }
}
```

---

## Plantillas de Meta (WhatsApp Business)

### Resumen de Plantillas

| Funcionalidad        | Español              | Inglés                 | Italiano               |
|---------------------|----------------------|------------------------|------------------------|
| Recordatorio 24h    | `class_reminder`     | `class_reminder_en`    | `class_reminder_it`    |
| Cancelación clase   | `class_cancellation` | `class_cancelation_en` | `class_cancelation_it` |

### Gestión de Plantillas
Las plantillas se gestionan en el Business Manager de Meta y deben:
1. Estar aprobadas por Meta
2. Usar los mismos parámetros en todos los idiomas
3. Mantener nombres consistentes con el sufijo de idioma (`_en`, `_it`)

### Configuración en Kapso
Las plantillas se envían a través de Kapso API (wrapper de Meta Cloud API):
- **Base URL**: `https://api.kapso.ai/meta/whatsapp/v24.0`
- **Autenticación**: `X-API-Key` header

---

## Idiomas Soportados

### Español (es)
- **Locale**: `es-ES`
- **Formato fecha**: "lunes, 20 de enero de 2025"
- **Estado**: Idioma predeterminado

### Inglés (en)
- **Locale**: `en-US`
- **Formato fecha**: "Monday, January 20, 2025"
- **Estado**: Completamente soportado

### Italiano (it)
- **Locale**: `it-IT`
- **Formato fecha**: "lunedì 20 gennaio 2025"
- **Estado**: Completamente soportado

---

## Resumen de Archivos Modificados

### Edge Functions (Backend)

| Archivo | Funcionalidad | i18n Implementado |
|---------|---------------|-------------------|
| `send-class-reminder-kapso/index.ts` | Recordatorios 24h WhatsApp | ✅ Plantillas + fechas |
| `send-class-cancellation-kapso/index.ts` | Cancelación de clases | ✅ Plantillas + fechas |
| `send-waitlist-whatsapp/index.ts` | Aceptación/Rechazo WhatsApp | ✅ Mensajes + fechas |
| `send-waitlist-email/index.ts` | Aceptación/Rechazo Email | ✅ Asunto + cuerpo + fechas |
| `whatsapp-webhook-kapso/index.ts` | Confirmación ausencia | ✅ Mensaje confirmación |

### Frontend

| Archivo | Funcionalidad | i18n Implementado |
|---------|---------------|-------------------|
| `src/hooks/useWhatsAppNotification.ts` | Notificación plaza libre | ✅ Mensajes + fechas |
| `src/hooks/useTodayAttendance.ts` | Hook de asistencia | ✅ Incluye `club_language` |
| `src/pages/WaitlistJoinPage.tsx` | Página lista espera | ✅ Formato fechas |

### Archivos de Traducción UI

| Archivo | Idioma |
|---------|--------|
| `src/locales/es/translation.json` | Español |
| `src/locales/en/translation.json` | Inglés |
| `src/locales/it/translation.json` | Italiano |

---

## Patrón de Implementación

Para añadir i18n a una nueva funcionalidad, seguir este patrón:

### 1. Obtener el idioma del club

```typescript
// Desde programmed_classes
const { data } = await supabase
  .from('programmed_classes')
  .select(`clubs:club_id(default_language)`)
  .eq('id', classId)
  .single();

const language = data?.clubs?.default_language || 'es';
```

### 2. Definir traducciones

```typescript
const TRANSLATIONS: Record<string, { message: string }> = {
  'es': { message: 'Mensaje en español' },
  'en': { message: 'Message in English' },
  'it': { message: 'Messaggio in italiano' }
};
```

### 3. Formatear fechas con locale

```typescript
const LOCALE_MAP: Record<string, string> = {
  'es': 'es-ES',
  'en': 'en-US',
  'it': 'it-IT'
};

const locale = LOCALE_MAP[language] || 'es-ES';
const formattedDate = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(date);
```

### 4. Usar traducción con fallback

```typescript
const t = TRANSLATIONS[language] || TRANSLATIONS['es'];
const message = t.message;
```

---

## Troubleshooting

### El mensaje se envía en español aunque el club está configurado en otro idioma

1. Verificar que el campo `default_language` está correctamente configurado:
   ```sql
   SELECT id, name, default_language FROM clubs WHERE id = 'club-uuid';
   ```

2. Verificar los logs de la Edge Function para ver qué idioma se está detectando:
   ```
   ✓ Club: Mi Club (language: it)
   ```

### La plantilla de Meta no se encuentra

1. Verificar que la plantilla existe y está aprobada en Meta Business Manager
2. Verificar que el nombre coincide exactamente (case-sensitive)
3. Verificar que el código de idioma es correcto (`es`, `en`, `it`)

### Las fechas no se formatean correctamente

1. Verificar que el locale está en `LOCALE_MAP`
2. Verificar que se está usando `Intl.DateTimeFormat` con el locale correcto
3. Para fechas sin hora, añadir `'T00:00:00'` para evitar problemas de zona horaria:
   ```typescript
   const date = new Date(dateStr + 'T00:00:00');
   ```
