# CAMBIOS IMPLEMENTADOS - 29 Diciembre 2025
## Prevención de Ban de WhatsApp

---

## RESUMEN DE CAMBIOS

**Fecha:** 29 diciembre 2025
**Objetivo:** Evitar ban de WhatsApp con nueva eSIM mediante escalado gradual
**Estado:** ✅ IMPLEMENTADO Y DEPLOYED

---

## CAMBIOS REALIZADOS

### 1. DELAY ENTRE MENSAJES: 1s → 5s

**Archivo:** `send-attendance-reminders/index.ts` (línea 388)

**Antes:**
```typescript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo
```

**Después:**
```typescript
await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos
```

**Impacto:**
- Velocidad: 60 msg/min → 12 msg/min
- Tiempo para 60 mensajes: 1 min → 5 minutos
- Seguridad: 🔴 Baja → 🟢🟢🟢 Máxima

---

### 2. CLUBS HABILITADOS: 6 → 4

**Archivos modificados:**
- `send-attendance-reminders/index.ts` (líneas 17-25)
- `send-waitlist-whatsapp/index.ts` (líneas 22-31)

**Clubs ACTIVOS (4):**
- ✅ La Red 21 Galisport
- ✅ Escuela Pádel Fuente Viña
- ✅ Wild Padel Indoor
- ✅ Hespérides Padel

**Clubs DESHABILITADOS temporalmente (2):**
- ❌ Gali (se activará semana 3)
- ❌ SVQ Academy (se activará semana 2)

**Código:**
```typescript
// Club IDs with WhatsApp reminders enabled
// GRADUAL ROLLOUT: Starting with 4 clubs to avoid ban (29 Dec 2025)
const WHATSAPP_ENABLED_CLUBS = [
  // 'cc0a5265-99c5-4b99-a479-5334280d0c6d', // Gali - DISABLED: Will enable week 3
  'bbc10821-1c94-4b62-97ac-2fde0708cefd', // La Red 21 Galisport
  // '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy - DISABLED: Will enable week 2
  'df335578-b68b-4d3f-83e1-d5d7ff16d23c', // Escuela Pádel Fuente Viña
  'a994e74e-0a7f-4721-8c0f-e23100a01614', // Wild Padel Indoor
  '7b6f49ae-d496-407b-bca1-f5f1e9370610', // Hespérides Padel
];
```

---

## VOLUMEN ESPERADO

### Con 4 clubs activos:
- **Mensajes/día:** ~60 mensajes
- **Pico máximo:** ~60 mensajes en una ejecución (clases concentradas)
- **Tiempo de envío:** 60 × 5s = 300 segundos = 5 minutos
- **Mensajes/hora:** 12 mensajes/hora (MUY SEGURO)

---

## PLAN DE ESCALADO

### Semana 1 (30 dic - 5 ene):
- ✅ **4 clubs** (La Red 21, Fuente Viña, Wild Padel, Hespérides)
- ✅ **Delay: 5 segundos**
- ✅ **Volumen: ~60 msg/día**

### Semana 2 (6-12 ene):
- 📅 **Descomentar SVQ Academy** (5 clubs total)
- 📅 **Delay: 5 segundos** (mantener)
- 📅 **Volumen: ~75 msg/día** (+25%)

**Acción requerida:**
```typescript
// Descomentar esta línea:
'09e8aa4e-69fa-4432-aedb-e7f831b3ebcc', // SVQ Academy
```

### Semana 3 (13-19 ene):
- 📅 **Descomentar Gali** (6 clubs total)
- 📅 **Reducir delay a 3 segundos**
- 📅 **Volumen: ~90 msg/día** (+20%)

**Acciones requeridas:**
```typescript
// Descomentar esta línea:
'cc0a5265-99c5-4b99-a479-5334280d0c6d', // Gali

// Cambiar delay:
await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos
```

### Semana 4+ (20 ene en adelante):
- 📅 **Reducir delay a 2 segundos** (opcional, si todo va bien)
- 📅 **Sistema estable**

---

## FUNCIONES DEPLOYADAS

✅ `send-attendance-reminders` - Deployed con delay 5s y 4 clubs
✅ `send-waitlist-whatsapp` - Deployed con 4 clubs

**Dashboard:**
https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/functions

---

## PRÓXIMOS PASOS

### HOY (30 diciembre):
1. ✅ Cambios implementados
2. ✅ Funciones deployed
3. ⏳ **Comprar nueva eSIM**
4. ⏳ **Activar WhatsApp en nueva eSIM**
5. ⏳ **Conectar a Whapi.cloud**
6. ⏳ **Actualizar WHAPI_TOKEN en Supabase**
7. ⏳ **Test manual: enviar 1 mensaje de prueba**

### Semana 2 (6 enero):
1. Verificar que todo funciona bien durante semana 1
2. Descomentar SVQ Academy
3. Deploy funciones
4. Monitorear logs

### Semana 3 (13 enero):
1. Verificar que todo funciona bien durante semana 2
2. Descomentar Gali
3. Reducir delay a 3 segundos
4. Deploy funciones
5. Monitorear logs

---

## MONITOREO

### Qué vigilar DIARIAMENTE:

1. **Logs de Supabase:**
   - Ver: https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/logs/edge-logs
   - Buscar: "WhatsApp interactive message sent successfully"
   - Alertas: Errores 401, 403, 429

2. **Panel Whapi.cloud:**
   - Estado del canal: Conectado ✅
   - Mensajes enviados vs fallidos
   - Warnings

3. **Señales de alarma 🚨:**
   - Error 401 "need channel authorization" → PARAR TODO
   - Error 429 "rate limit" → Investigar
   - Tasa de fallo > 5% → Revisar

---

## COMPARACIÓN ANTES/DESPUÉS

| Métrica | Antes (Ban) | Ahora | Mejora |
|---------|------------|-------|--------|
| **Delay** | 1 segundo | 5 segundos | 5x más lento |
| **Clubs** | 6 clubs | 4 clubs | -33% volumen |
| **Msg/min** | 60 | 12 | 5x más lento |
| **Msg/hora** | 3,600 | 720 | 5x más lento |
| **Volumen diario** | ~90 | ~60 | -33% |
| **Riesgo de ban** | 🔴 Alto | 🟢 Muy bajo | ✅ |

---

## ARCHIVOS MODIFICADOS

1. ✅ `supabase/functions/send-attendance-reminders/index.ts`
   - Línea 17-25: Clubs comentados
   - Línea 388: Delay 1s → 5s

2. ✅ `supabase/functions/send-waitlist-whatsapp/index.ts`
   - Línea 22-31: Clubs comentados

---

## CONTACTO PARA DUDAS

- Ver auditoría completa: `INFORME-AUDITORIA-BAN-WHATSAPP.md`
- Ver estudio de costos: `ESTUDIO-COSTOS-WHATSAPP-API.md`
- SQL de análisis: `auditoria-whatsapp-ban.sql`

---

**Implementado por:** Claude Code
**Fecha:** 29 diciembre 2025, 21:00h
**Estado:** ✅ LISTO PARA NUEVA eSIM
