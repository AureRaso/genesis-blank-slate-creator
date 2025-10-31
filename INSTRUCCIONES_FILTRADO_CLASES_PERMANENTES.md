# Filtrado de Clases Permanentes en Confirmación Diaria

## Problema Identificado

Cuando un jugador se inscribía en una clase permanente a través de "Clases Disponibles", esta clase aparecía en la pestaña "Mis clases" donde se pide confirmar asistencia diariamente.

**Esto no tiene sentido** porque:
- Las clases permanentes son inscripciones continuas/recurrentes
- No requieren confirmación diaria de asistencia
- El jugador ya está comprometido a asistir regularmente
- Solo las clases puntuales o específicas deberían requerir confirmación

---

## Solución Implementada

### Cambio en el Hook `useTodayClassAttendance`

**Archivo:** [src/hooks/useTodayClassAttendance.ts](src/hooks/useTodayClassAttendance.ts#L220-L222)

**Modificación:**
```typescript
const { data: programmedClasses, error: errorClasses } = await supabase
  .from('programmed_classes')
  .select(`
    id,
    name,
    start_time,
    duration_minutes,
    days_of_week,
    start_date,
    end_date,
    trainer_profile_id,
    club_id,
    is_open  // ← Campo agregado
  `)
  .in('id', classIds)
  .eq('is_active', true)
  .or('is_open.eq.false,is_open.is.null'); // ← Filtro agregado
```

**Lógica del filtro:**
- Solo muestra clases donde `is_open = false` O `is_open IS NULL`
- **Excluye** clases donde `is_open = true`

---

## ¿Qué significa cada valor de `is_open`?

| Valor | Significado | ¿Aparece en "Mis clases"? | Uso |
|-------|-------------|---------------------------|-----|
| `true` | Clase abierta para inscripción pública permanente | ❌ NO | Clases permanentes donde los jugadores se inscriben por su cuenta |
| `false` | Clase cerrada, solo inscripción manual por admin | ✅ SÍ | Clases privadas/grupales con confirmación diaria |
| `null` | Clase sin configuración de inscripción abierta | ✅ SÍ | Clases antiguas o sin configurar |

---

## Flujo Completo del Sistema

### Caso 1: Clase Permanente (is_open = true)

1. **Admin abre la clase** para inscripción pública
2. **Jugador solicita inscripción** desde "Clases Disponibles"
3. **Admin acepta** la solicitud
4. **Resultado:**
   - ✅ El jugador queda inscrito permanentemente
   - ❌ La clase NO aparece en "Mis clases" (confirmación diaria)
   - ✅ El jugador simplemente asiste según el horario recurrente

### Caso 2: Clase Privada/Grupal (is_open = false)

1. **Admin crea una clase privada** (is_open = false)
2. **Admin añade jugadores manualmente** desde el formulario
3. **Resultado:**
   - ✅ La clase SÍ aparece en "Mis clases" (confirmación diaria)
   - ✅ Los jugadores pueden confirmar/cancelar asistencia día a día
   - 📱 Se envían recordatorios por WhatsApp si no confirman

---

## Diferencias Entre Tipos de Clases

### Clases Permanentes (is_open = true)
- **Inscripción:** Por solicitud del jugador
- **Asistencia:** Automática/recurrente
- **Confirmación diaria:** ❌ NO requerida
- **Cancelación:** Darse de baja de la clase completa
- **Ejemplo:** Clases de tenis semanales, entrenamientos regulares

### Clases Privadas/Grupales (is_open = false)
- **Inscripción:** Manual por admin/profesor
- **Asistencia:** Requiere confirmación cada día/sesión
- **Confirmación diaria:** ✅ Requerida
- **Cancelación:** Por sesión individual
- **Ejemplo:** Clases particulares, sesiones específicas

---

## Ventajas de Esta Implementación

1. ✅ **Lógica coherente:** Clases permanentes no requieren confirmación diaria
2. ✅ **Menos fricción:** Jugadores no tienen que confirmar clases recurrentes
3. ✅ **Mejor UX:** "Mis clases" solo muestra lo que realmente necesita confirmación
4. ✅ **Automatización:** Inscripción permanente = compromiso automático
5. ✅ **Sin confusión:** Separación clara entre tipos de clases

---

## Comportamiento Esperado

### En "Mis clases" (TodayClassesConfirmation):
- Solo aparecen clases donde `is_open = false` o `is_open IS NULL`
- Son clases que requieren confirmación diaria
- El jugador puede confirmar asistencia o ausencia

### En "Clases disponibles" (ClassBooking):
- Aparecen clases donde `is_open = true`
- El jugador puede solicitar inscripción permanente
- Una vez inscrito, asiste automáticamente según el horario

---

## Código Modificado

### Archivo: `src/hooks/useTodayClassAttendance.ts`

**Líneas 206-222:**
- Agregado campo `is_open` en el SELECT
- Agregado filtro `.or('is_open.eq.false,is_open.is.null')`

**Comentario en código:**
```typescript
.or('is_open.eq.false,is_open.is.null'); // Solo mostrar clases NO abiertas para inscripción pública
```

---

## Testing Recomendado

1. **Crear una clase con `is_open = true`:**
   - Inscribir un jugador via "Clases Disponibles"
   - Verificar que NO aparece en "Mis clases"

2. **Crear una clase con `is_open = false`:**
   - Añadir un jugador manualmente desde el formulario
   - Verificar que SÍ aparece en "Mis clases"

3. **Clase antigua sin `is_open` (null):**
   - Verificar que SÍ aparece en "Mis clases" (backwards compatibility)

---

## Estado del Proyecto

✅ **Implementación completa**
- Filtro aplicado en `useTodayClassAttendance`
- Clases permanentes excluidas de confirmación diaria
- Separación lógica entre tipos de clases

🎯 **Resultado:**
Los jugadores inscritos en clases permanentes ya no necesitan confirmar asistencia diariamente. Solo aparecen en "Mis clases" las clases que realmente requieren confirmación.
