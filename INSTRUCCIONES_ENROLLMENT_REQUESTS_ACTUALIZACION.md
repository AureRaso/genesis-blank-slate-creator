# Sistema de Solicitudes de Inscripción - Actualización

## Resumen de Mejoras

Se ha mejorado el sistema de solicitudes de inscripción para que los jugadores puedan ver el estado de sus solicitudes en tiempo real y no puedan duplicar solicitudes.

---

## 🎯 Funcionalidades Implementadas

### 1. **Bloqueo de Botón de Solicitud**

**Ubicación:** [src/components/ClassBooking.tsx](src/components/ClassBooking.tsx)

**Comportamiento:**
- El botón "Solicitar Inscripción" se **deshabilita** automáticamente cuando:
  - Ya existe una solicitud **pendiente** para esa clase
  - Ya existe una solicitud **aceptada** para esa clase (ya está inscrito)
  - No hay plazas disponibles

**Estados del botón:**
- `"Solicitar Inscripción"` - Normal (clase disponible, sin solicitudes previas)
- `"Solicitud Pendiente"` - Deshabilitado (solicitud en revisión)
- `"Ya Inscrito"` - Deshabilitado (solicitud aceptada)
- `"Sin plazas"` - Deshabilitado (clase llena)

### 2. **Indicadores de Estado en Clases Disponibles**

**Ubicación:** [src/components/ClassBooking.tsx](src/components/ClassBooking.tsx) (líneas 160-193)

Cada clase muestra un **banner de estado** cuando existe una solicitud:

#### Estado Pendiente (Azul)
```
🔄 Solicitud pendiente
El entrenador revisará tu solicitud pronto
```

#### Estado Aceptado (Verde)
```
✅ Solicitud aceptada
Ya estás inscrito en esta clase
```

#### Estado Rechazado (Rojo)
```
❌ Solicitud rechazada
[Motivo del rechazo si existe]
```

### 3. **Nueva Pestaña "Mis Solicitudes"**

**Ubicación:** [src/components/PlayerClassesTabs.tsx](src/components/PlayerClassesTabs.tsx)

Se ha agregado una tercera pestaña en la vista del jugador:

```
[ Mis clases ] [ Clases disponibles ] [ Mis solicitudes ]
```

**Componente:** [src/components/MyEnrollmentRequests.tsx](src/components/MyEnrollmentRequests.tsx)

**Características:**
- Lista todas las solicitudes del jugador (pendientes, aceptadas, rechazadas, canceladas)
- Muestra información de cada solicitud:
  - Nombre de la clase
  - Horario y días
  - Fecha de solicitud
  - Estado actual
  - Notas enviadas
  - Motivo de rechazo (si aplica)
- Permite **cancelar solicitudes pendientes**

---

## 📋 Información Mostrada en "Mis Solicitudes"

### Para Solicitudes Pendientes:
- ⏳ Badge azul "Pendiente"
- Fecha y hora de solicitud
- Notas enviadas por el jugador
- Botón para cancelar la solicitud

### Para Solicitudes Aceptadas:
- ✅ Badge verde "Aceptada"
- Fecha de aceptación
- Confirmación de inscripción

### Para Solicitudes Rechazadas:
- ❌ Badge rojo "Rechazada"
- Motivo del rechazo (si lo proporcionó el entrenador)
- Fecha de rechazo

### Para Solicitudes Canceladas:
- ⚪ Badge gris "Cancelada"
- Registro histórico de la cancelación

---

## 🔄 Flujo Completo del Sistema

### Desde la Vista del Jugador:

1. **Solicitar Inscripción:**
   - Navegar a "Clases disponibles"
   - Hacer clic en "Solicitar Inscripción"
   - Opcionalmente agregar notas sobre experiencia/objetivos
   - Confirmar solicitud
   - ✅ El botón se deshabilita automáticamente
   - ✅ Aparece banner azul "Solicitud pendiente"

2. **Ver Estado de Solicitudes:**
   - Ir a pestaña "Mis solicitudes"
   - Ver todas las solicitudes con su estado actualizado
   - Cancelar solicitudes pendientes si es necesario

3. **Actualización en Tiempo Real:**
   - Cuando el profesor acepta/rechaza una solicitud:
     - El estado se actualiza **automáticamente** en "Clases disponibles"
     - El estado se actualiza **automáticamente** en "Mis solicitudes"
     - El botón cambia según el nuevo estado

### Desde la Vista del Profesor/Admin:

1. **Ver Solicitudes:**
   - Ir a "Asistencia Hoy" → pestaña "Clases Abiertas"
   - Cada clase abierta muestra solicitudes pendientes en una sección desplegable

2. **Aceptar Solicitud:**
   - Clic en "Aceptar"
   - Se crea automáticamente:
     - `student_enrollment` (si no existe)
     - `class_participant` con estado 'active'
   - La solicitud cambia a estado 'accepted'
   - ✅ El jugador ve el cambio inmediatamente

3. **Rechazar Solicitud:**
   - Clic en "Rechazar"
   - Opcionalmente agregar motivo de rechazo
   - La solicitud cambia a estado 'rejected'
   - ❌ El jugador ve el motivo del rechazo

---

## 🎨 Componentes Actualizados

### 1. `ClassBooking.tsx`
- Importa `useMyEnrollmentRequests` para obtener solicitudes del jugador
- Función `getRequestStatus(classId)` para verificar estado por clase
- Banner de estado condicional según el estado de la solicitud
- Lógica de deshabilitación del botón mejorada

### 2. `MyEnrollmentRequests.tsx` (NUEVO)
- Componente completo para gestión de solicitudes
- Cards con colores según estado
- Botón de cancelación para solicitudes pendientes
- Información detallada de cada solicitud

### 3. `PlayerClassesTabs.tsx`
- Agregada tercera pestaña "Mis solicitudes"
- Grid cambiado de 2 a 3 columnas
- Icono FileText para la nueva pestaña

---

## 🔧 Hooks Utilizados

### `useMyEnrollmentRequests()`
- Obtiene todas las solicitudes del jugador autenticado
- Se actualiza automáticamente cuando cambia el estado
- Filtrado por `student_profile_id`

### `useCancelEnrollmentRequest()`
- Permite al jugador cancelar sus solicitudes pendientes
- Actualiza el estado a 'cancelled'
- Invalida las queries para refrescar la UI

---

## 📱 Experiencia de Usuario

### Antes:
- ❌ El jugador podía enviar múltiples solicitudes para la misma clase
- ❌ No sabía si su solicitud fue aceptada o rechazada
- ❌ Tenía que preguntar al profesor por el estado

### Ahora:
- ✅ No puede duplicar solicitudes (botón bloqueado)
- ✅ Ve el estado en tiempo real en "Clases disponibles"
- ✅ Tiene una vista dedicada con todas sus solicitudes
- ✅ Puede cancelar solicitudes pendientes
- ✅ Ve motivos de rechazo si los hay

---

## 🎯 Ventajas del Sistema

1. **Prevención de Duplicados:** Imposible enviar múltiples solicitudes
2. **Transparencia:** Estado siempre visible para el jugador
3. **Comunicación:** Motivos de rechazo claros
4. **Control:** Jugador puede cancelar solicitudes pendientes
5. **Actualización Automática:** React Query invalida las queries automáticamente
6. **UX Mejorada:** Colores, iconos y mensajes claros

---

## ✅ Estado del Proyecto

Todos los componentes están implementados y funcionando:

- ✅ Bloqueo de botón según estado de solicitud
- ✅ Indicadores visuales en cada clase
- ✅ Nueva pestaña "Mis Solicitudes"
- ✅ Componente `MyEnrollmentRequests` completo
- ✅ Cancelación de solicitudes pendientes
- ✅ Actualización en tiempo real

## 🚀 Próximos Pasos

1. Aplicar la migración si aún no se ha hecho:
   ```sql
   -- Ejecutar en Supabase SQL Editor
   -- Archivo: supabase/migrations/20251031_200000_create_class_enrollment_requests.sql
   ```

2. Probar el flujo completo:
   - Como jugador: Solicitar inscripción
   - Como profesor: Aceptar/rechazar desde "Clases Abiertas"
   - Como jugador: Ver actualización en "Mis solicitudes"

3. Verificar que los estados se actualizan correctamente en todas las vistas
