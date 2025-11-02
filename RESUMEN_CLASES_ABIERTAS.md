# Resumen: Sistema de Clases Abiertas

## Cambios Implementados

### 1. **Configuración de is_open por Defecto**

#### Script SQL - [actualizar_is_open_false.sql](actualizar_is_open_false.sql)
- Actualiza todas las clases existentes con `is_open = false`
- Queries de verificación antes y después
- Contador de clases abiertas/cerradas

**Aplicar en Supabase:**
```sql
UPDATE programmed_classes
SET is_open = false
WHERE is_open IS NULL OR is_open = true;
```

---

### 2. **Validación en Formularios**

#### ScheduledClassForm.tsx (Creación de Clases)
**Cambios:**
- **Línea 62**: Default `is_open = false`
- **Líneas 1061-1116**: Validación basada en plazas disponibles
  ```typescript
  const availableSpots = maxParticipants - selectedStudents.length;
  const hasSpots = availableSpots > 0;
  ```

**Comportamiento:**
- Switch desactivado por defecto
- Solo se puede activar si hay plazas disponibles
- Mensajes dinámicos:
  - ⚠️ "No hay plazas disponibles (X/Y ocupadas)"
  - ✓ "X plazas disponibles"

#### EditClassModal.tsx (Edición de Clases)
**Cambios:**
- **Línea 13**: Import `useClassParticipants`
- **Línea 50**: Hook para obtener participantes
- **Línea 62**: Default `is_open = false`
- **Líneas 69-73**: Cálculo de plazas en tiempo real
- **Líneas 282-323**: UI con validación

**Comportamiento:**
- Consulta participantes activos al abrir modal
- Calcula: `plazas = max_participants - participantes_activos`
- Si no hay plazas: switch deshabilitado + toast de error
- Actualización en tiempo real

---

### 3. **ClassBooking (Jugadores)**

#### Modificado: [ClassBooking.tsx](src/components/ClassBooking.tsx)
**Cambios previos (de sesión anterior):**
- Usa `useAvailableProgrammedClasses` en lugar de `useClassSlots`
- Filtra clases con `is_open = true` del club del jugador
- Muestra información de clases programadas (no slots individuales)

**Hook:** [useProgrammedClasses.ts:348-409](src/hooks/useProgrammedClasses.ts#L348-L409)
```typescript
export const useAvailableProgrammedClasses = () => {
  // Filtra por:
  // - is_active = true
  // - is_open = true
  // - club_id del jugador
}
```

---

### 4. **Nueva Tab "Clases Abiertas" para Admin/Profesor**

#### Nuevo Componente: [OpenClassesTab.tsx](src/components/OpenClassesTab.tsx)
**Funcionalidad:**
- Lista todas las clases programadas del club
- Switch para abrir/cerrar cada clase
- Validación de plazas disponibles en tiempo real
- Información detallada:
  - Nombre de la clase
  - Horario y días
  - Entrenador
  - Participantes actuales / Máximo
  - Plazas disponibles
  - Estado (Abierta/Cerrada)
  - Nivel
  - Precio mensual

**Toggle de is_open:**
```typescript
const handleToggleOpen = async (classId, currentStatus, availableSpots) => {
  if (!currentStatus && availableSpots <= 0) {
    // No permite abrir si no hay plazas
    toast({ title: "No se puede abrir la clase", variant: "destructive" });
    return;
  }

  await updateClass.mutateAsync({
    id: classId,
    data: { is_open: !currentStatus }
  });
};
```

#### TodayAttendancePage.tsx Modificado
**Cambios:**
- **Línea 20**: Import de componentes `Tabs`
- **Línea 21**: Import de icono `LockOpen`
- **Línea 27**: Import de `OpenClassesTab`
- **Línea 307**: Título cambiado a "Gestión de Clases"
- **Líneas 328-338**: Sistema de tabs
- **Línea 895**: Cierre de TabsContent de asistencia
- **Líneas 897-900**: Nueva tab "Clases Abiertas"

**Estructura de Tabs:**
```tsx
<Tabs defaultValue="attendance">
  <TabsList>
    <TabsTrigger value="attendance">
      <CheckCircle2 /> Asistencia Hoy
    </TabsTrigger>
    <TabsTrigger value="open-classes">
      <LockOpen /> Clases Abiertas
    </TabsTrigger>
  </TabsList>

  <TabsContent value="attendance">
    {/* Contenido existente de asistencia */}
  </TabsContent>

  <TabsContent value="open-classes">
    <OpenClassesTab />
  </TabsContent>
</Tabs>
```

---

## Flujo Completo del Sistema

### Para Admin/Profesor:

1. **Crear Clase** (ScheduledClassForm)
   - Clase se crea con `is_open = false` por defecto
   - Si hay plazas disponibles, puede activar switch
   - Si no hay plazas, switch deshabilitado

2. **Gestionar Clases Abiertas** (Tab en TodayAttendancePage)
   - Navegar a "Gestión de Clases" → Tab "Clases Abiertas"
   - Ver lista de todas las clases del club
   - Ver estado (Abierta/Cerrada) y plazas disponibles
   - Toggle switch para abrir/cerrar
   - Sistema valida automáticamente plazas

3. **Editar Clase** (EditClassModal)
   - Al editar, puede cambiar estado `is_open`
   - Validación en tiempo real de plazas
   - No permite abrir si está completa

### Para Jugadores:

1. **Ver Clases Disponibles** (ClassBooking)
   - Navegar a Dashboard → Tab "Clases Disponibles"
   - Solo ve clases con `is_open = true` de su club
   - Puede solicitar inscripción (funcionalidad pendiente)

---

## Base de Datos

### Tabla: `programmed_classes`
```sql
ALTER TABLE programmed_classes
ADD COLUMN is_open BOOLEAN DEFAULT false NOT NULL;

-- Índice para optimizar consultas
CREATE INDEX idx_programmed_classes_is_open
ON programmed_classes(is_open)
WHERE is_open = true AND is_active = true;
```

### Query de Verificación:
```sql
SELECT
  id,
  name,
  is_open,
  is_active,
  max_participants,
  (SELECT COUNT(*) FROM class_participants cp
   WHERE cp.class_id = pc.id AND cp.status = 'active') as active_participants
FROM programmed_classes pc
WHERE is_active = true
ORDER BY created_at DESC;
```

---

## Archivos Modificados

### Nuevos:
1. `src/components/OpenClassesTab.tsx` - Componente principal de gestión
2. `actualizar_is_open_false.sql` - Script de actualización
3. `INSTRUCCIONES_IS_OPEN_FALSE.md` - Guía de implementación
4. `RESUMEN_CLASES_ABIERTAS.md` - Este documento

### Modificados:
1. `src/components/ScheduledClassForm.tsx` - Validación en creación
2. `src/components/calendar/EditClassModal.tsx` - Validación en edición
3. `src/pages/TodayAttendancePage.tsx` - Sistema de tabs
4. `src/hooks/useProgrammedClasses.ts` - Hook `useAvailableProgrammedClasses`
5. `src/components/ClassBooking.tsx` - Adaptado para clases programadas

---

## Instrucciones de Aplicación

### 1. Aplicar Migración (Si no lo has hecho)
```sql
-- En Supabase Dashboard → SQL Editor
ALTER TABLE programmed_classes
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT false NOT NULL;
```

### 2. Actualizar Clases Existentes
```sql
-- Ejecutar actualizar_is_open_false.sql
UPDATE programmed_classes
SET is_open = false
WHERE is_open IS NULL OR is_open = true;
```

### 3. Verificar Implementación

**Como Admin/Profesor:**
1. Ir a "Gestión de Clases"
2. Ver tab "Clases Abiertas" (nueva)
3. Verificar lista de clases con toggle
4. Intentar abrir clase completa → debe mostrar error
5. Abrir clase con plazas → debe funcionar

**Como Jugador:**
1. Ir a Dashboard → "Clases Disponibles"
2. Solo deben aparecer clases con `is_open = true`
3. Filtradas por club del jugador

---

## Ventajas del Sistema

1. **Control Granular**: Admin/profesor decide qué clases publicar
2. **Validación Automática**: No se puede abrir clase sin plazas
3. **Tiempo Real**: Cálculo automático de plazas disponibles
4. **UX Mejorado**: Interfaz clara con indicadores visuales
5. **Seguridad**: Solo usuarios del club ven sus clases

---

## Notas Importantes

⚠️ **Todas las clases existentes se marcarán como cerradas**
- Es intencional para evitar exposición accidental
- Admin debe revisar y abrir clases manualmente
- Garantiza control sobre qué se publica

✅ **Validación Automática**
- Sistema previene errores humanos
- No permite abrir clase completa
- Mensajes claros para el usuario

📊 **Métricas en Tab**
- Contador de clases abiertas
- Estado visual por clase
- Información completa a simple vista

---

## Troubleshooting

### Problema: No aparece tab "Clases Abiertas"
**Solución**: Verificar que el usuario sea admin o profesor

### Problema: No se puede abrir clase
**Solución**: Verificar plazas disponibles. Si está completa, no se puede abrir.

### Problema: Jugador no ve clases
**Solución**:
1. Verificar que hay clases con `is_open = true`
2. Verificar que pertenecen al club del jugador
3. Verificar que `is_active = true`

### Problema: Switch deshabilitado en formulario
**Solución**: Es normal si no hay plazas disponibles. Ajustar `max_participants` o eliminar participantes.
