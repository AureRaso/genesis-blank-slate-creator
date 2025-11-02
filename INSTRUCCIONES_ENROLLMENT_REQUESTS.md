# Sistema de Solicitudes de Inscripción - Instrucciones

## 🔧 Error Arreglado
✅ **hasSpots is not defined** - Resuelto en OpenClassesTab.tsx

## 🆕 Nueva Funcionalidad Implementada

### Sistema de Lista de Espera para Inscripciones

Los jugadores ahora pueden solicitar inscripción en clases abiertas. El profesor/admin puede aceptar o rechazar las solicitudes.

---

## 📋 Pasos para Aplicar

### 1. Aplicar Migración en Supabase

Ejecuta el siguiente script en **Supabase Dashboard → SQL Editor**:

```sql
-- Copiar y pegar todo el contenido de:
-- supabase/migrations/20251031_200000_create_class_enrollment_requests.sql
```

O directamente:

```sql
CREATE TABLE IF NOT EXISTS class_enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programmed_class_id UUID NOT NULL REFERENCES programmed_classes(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(programmed_class_id, student_profile_id)
);

CREATE INDEX idx_enrollment_requests_class ON class_enrollment_requests(programmed_class_id, status);
CREATE INDEX idx_enrollment_requests_student ON class_enrollment_requests(student_profile_id, status);
CREATE INDEX idx_enrollment_requests_pending ON class_enrollment_requests(status, requested_at) WHERE status = 'pending';

-- Ver archivo completo para RLS policies
```

### 2. Verificar Tabla Creada

```sql
SELECT * FROM class_enrollment_requests LIMIT 1;
```

---

## 🎯 Flujo Completo

### Para Jugadores:

1. **Ver Clases Disponibles**
   - Dashboard → Tab "Clases Disponibles"
   - Lista de clases con `is_open = true`

2. **Solicitar Inscripción**
   - Click en "Solicitar Inscripción"
   - Modal de confirmación con:
     - Información de la clase
     - Campo "Información adicional" (opcional)
   - Click en "Solicitar Inscripción"
   - Toast de confirmación
   - Solicitud queda en estado `pending`

3. **Ver Estado de Solicitudes**
   - (Pendiente implementar: Dashboard de jugador con sus solicitudes)

### Para Admin/Profesor:

1. **Ver Solicitudes Pendientes**
   - (Siguiente paso: Tab en OpenClassesTab)
   - Lista de todas las solicitudes `pending`
   - Información del alumno
   - Notas del alumno

2. **Aceptar Solicitud**
   - Click en "Aceptar"
   - Sistema crea `student_enrollment` si no existe
   - Sistema agrega alumno como `class_participant`
   - Solicitud pasa a `accepted`
   - Toast de confirmación

3. **Rechazar Solicitud**
   - Click en "Rechazar"
   - Modal para motivo (opcional)
   - Solicitud pasa a `rejected`
   - Toast de confirmación

---

## 📁 Archivos Creados/Modificados

### Nuevos:
1. ✅ `supabase/migrations/20251031_200000_create_class_enrollment_requests.sql`
2. ✅ `src/hooks/useEnrollmentRequests.ts`

### Modificados:
1. ✅ `src/components/OpenClassesTab.tsx` - Error `hasSpots` arreglado
2. ✅ `src/components/ClassBooking.tsx` - Sistema de solicitud implementado

---

## 🔍 Verificación

### Probar como Jugador:
1. Login como jugador
2. Ir a "Clases Disponibles"
3. Click en "Solicitar Inscripción"
4. Llenar campo opcional
5. Enviar solicitud
6. Ver toast de confirmación

### Verificar en Base de Datos:
```sql
SELECT
  er.*,
  pc.name as class_name,
  p.full_name as student_name
FROM class_enrollment_requests er
JOIN programmed_classes pc ON pc.id = er.programmed_class_id
JOIN profiles p ON p.id = er.student_profile_id
ORDER BY er.requested_at DESC;
```

---

## ⏭️ Próximos Pasos

### 1. Gestión de Solicitudes en OpenClassesTab
Agregar una sección/tab para que admin/profesor pueda:
- Ver lista de solicitudes pendientes
- Aceptar solicitudes
- Rechazar solicitudes con motivo

### 2. Dashboard de Jugador
Crear sección donde el jugador vea:
- Sus solicitudes pendientes
- Solicitudes aceptadas
- Solicitudes rechazadas (con motivo)
- Opción de cancelar solicitudes pendientes

---

## 🎉 Estado Actual

✅ Tabla creada
✅ Hooks implementados
✅ UI de jugador completa
✅ Validaciones en su lugar
⏳ Pendiente: UI de admin para gestionar solicitudes

El jugador ya puede enviar solicitudes de inscripción. Solo falta implementar la parte del admin/profesor para gestionarlas.
