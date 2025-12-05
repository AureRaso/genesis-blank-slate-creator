# Sistema de Creación de Clases

## Índice
1. [Introducción](#introducción)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Método 1: Creación de Clases Programadas (Individual)](#método-1-creación-de-clases-programadas-individual)
4. [Método 2: Creación Masiva (Bulk)](#método-2-creación-masiva-bulk)
5. [Edge Function: create-programmed-classes](#edge-function-create-programmed-classes)
6. [Diferencias entre Métodos](#diferencias-entre-métodos)
7. [Casos de Uso](#casos-de-uso)
8. [Troubleshooting](#troubleshooting)
9. [Historial de Cambios](#historial-de-cambios)

---

## Introducción

El sistema PadeLock ofrece **dos métodos** para crear clases:

1. **Creación Programada (Individual)**: Crea clases con recurrencia (semanal, quincenal) generando **un registro individual por cada fecha** en `programmed_classes`.
2. **Creación Masiva (Bulk)**: Permite crear múltiples clases de una vez para fechas específicas.

Ambos métodos utilizan el **Edge Function** `create-programmed-classes` en el backend, pero con comportamientos distintos.

---

## Arquitectura de Base de Datos

### Tabla: `programmed_classes`

Almacena las clases programadas.

```sql
CREATE TABLE programmed_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level_from INTEGER,
  level_to INTEGER,
  custom_level TEXT,
  duration_minutes INTEGER NOT NULL,
  start_time TIME NOT NULL,
  days_of_week TEXT[] NOT NULL,           -- Ej: ['lunes', 'miercoles']
  start_date DATE NOT NULL,               -- Fecha individual de la clase
  end_date DATE NOT NULL,                 -- Igual a start_date en sistema actual
  recurrence_type TEXT NOT NULL,          -- 'weekly', 'biweekly', 'monthly'
  trainer_profile_id UUID REFERENCES profiles(id),
  club_id UUID REFERENCES clubs(id),
  court_number INTEGER,
  monthly_price DECIMAL,
  max_participants INTEGER DEFAULT 8,
  is_open BOOLEAN DEFAULT false,
  group_id UUID REFERENCES groups(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Cambio importante** (Diciembre 2024):
- **Antes**: Se creaba 1 registro con `start_date` y `end_date` como rango (modelo de recurrencia).
- **Ahora**: Se crean N registros individuales con `start_date = end_date` (modelo individual).

### Tabla: `class_participants`

Almacena los participantes de cada clase.

```sql
CREATE TABLE class_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES programmed_classes(id) ON DELETE CASCADE,
  student_enrollment_id UUID REFERENCES student_enrollments(id),
  status TEXT DEFAULT 'active',
  absence_confirmed BOOLEAN DEFAULT false,
  absence_reason TEXT,
  absence_confirmed_at TIMESTAMPTZ,
  attendance_confirmed_for_date DATE,
  attendance_confirmed_at TIMESTAMPTZ,
  confirmed_by_trainer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Método 1: Creación de Clases Programadas (Individual)

### Flujo de Usuario

1. Usuario accede a **"Programar Clase"** desde el menú.
2. Rellena el formulario:
   - Nombre de la clase
   - Nivel (desde/hasta o custom)
   - Duración (minutos)
   - Hora de inicio
   - **Días de la semana** (lunes, martes, etc.)
   - **Fecha de inicio** y **fecha de fin** (rango de recurrencia)
   - Tipo de recurrencia (semanal, quincenal, mensual)
   - Entrenador
   - Club y pista
   - Precio mensual
   - Máximo participantes
   - ¿Clase abierta?
   - Grupo o estudiantes seleccionados
3. Pulsa **"Crear Clase"**.

### Proceso Técnico

#### Frontend (React)

**Archivo**: `src/pages/CreateProgrammedClassPage.tsx` (o similar)

```typescript
const handleSubmit = async (data: CreateClassData) => {
  const response = await supabase.functions.invoke('create-programmed-classes', {
    body: {
      name: data.name,
      level_from: data.levelFrom,
      level_to: data.levelTo,
      custom_level: data.customLevel,
      duration_minutes: data.durationMinutes,
      start_time: data.startTime,
      days_of_week: data.daysOfWeek,  // ['lunes', 'miercoles']
      start_date: data.startDate,     // '2024-12-05'
      end_date: data.endDate,         // '2024-12-31'
      recurrence_type: data.recurrenceType,  // 'weekly'
      trainer_profile_id: data.trainerId,
      club_id: data.clubId,
      court_number: data.courtNumber,
      monthly_price: data.monthlyPrice,
      max_participants: data.maxParticipants,
      is_open: data.isOpen,
      group_id: data.groupId,
      selected_students: data.selectedStudents,
    }
  });

  if (response.error) {
    toast.error('Error al crear clase');
  } else {
    toast.success(`${response.data.total_classes} clases creadas`);
  }
};
```

#### Backend (Edge Function)

**Archivo**: `supabase/functions/create-programmed-classes/index.ts`

El Edge Function:

1. **Autentica** al usuario.
2. **Genera todas las fechas** según la recurrencia usando `generateClassDates()`.
3. **Crea un registro individual** en `programmed_classes` por cada fecha.
4. **Añade participantes** a `class_participants` para cada clase creada.

**Código simplificado**:

```typescript
const classDates = generateClassDates(classData);
console.log(`Generated ${classDates.length} class dates`);

const createdClassIds: string[] = [];

for (const classDate of classDates) {
  // Crear clase individual
  const { data: createdClass, error: classError } = await supabase
    .from("programmed_classes")
    .insert([{
      name: classData.name,
      level_from: classData.level_from,
      level_to: classData.level_to,
      custom_level: classData.custom_level,
      duration_minutes: classData.duration_minutes,
      start_time: classData.start_time,
      days_of_week: classData.days_of_week,
      start_date: classDate,      // Fecha individual
      end_date: classDate,        // Mismo que start_date
      recurrence_type: classData.recurrence_type,
      trainer_profile_id: classData.trainer_profile_id,
      club_id: classData.club_id,
      court_number: classData.court_number,
      monthly_price: classData.monthly_price || 0,
      max_participants: classData.max_participants || 8,
      is_open: classData.is_open ?? false,
      group_id: classData.group_id,
      created_by: user.id
    }])
    .select()
    .single();

  if (classError) throw classError;

  createdClassIds.push(createdClass.id);

  // Añadir participantes
  if (classData.selected_students && classData.selected_students.length > 0) {
    const participantsData = classData.selected_students.map(studentId => ({
      class_id: createdClass.id,
      student_enrollment_id: studentId,
      status: 'active'
    }));

    const { error: participantsError } = await supabase
      .from("class_participants")
      .insert(participantsData);

    if (participantsError) throw participantsError;
  }
}

return {
  success: true,
  class_ids: createdClassIds,
  total_classes: createdClassIds.length
};
```

### Función: `generateClassDates()`

Genera todas las fechas de las clases según los días de la semana y tipo de recurrencia.

```typescript
function generateClassDates(classData: CreateClassData): string[] {
  const dates: string[] = [];

  // Parsear fechas en timezone local (evitar problemas UTC)
  const [startYear, startMonth, startDay] = classData.start_date.split('-').map(Number);
  const [endYear, endMonth, endDay] = classData.end_date.split('-').map(Number);

  const startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
  const endDate = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);

  const dayMap: Record<string, number> = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  };

  classData.days_of_week.forEach(day => {
    const targetDay = dayMap[day];
    let currentDate = new Date(startDate);

    // Encontrar primera ocurrencia del día objetivo
    while (currentDate.getDay() !== targetDay && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Determinar intervalo según recurrencia
    const intervalDays = classData.recurrence_type === 'weekly' ? 7 :
                        classData.recurrence_type === 'biweekly' ? 14 : 30;

    // Generar fechas
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
  });

  return dates.sort();
}
```

**Ejemplo**:

- **Input**:
  - `days_of_week`: `['lunes', 'miercoles']`
  - `start_date`: `'2024-12-02'` (lunes)
  - `end_date`: `'2024-12-31'`
  - `recurrence_type`: `'weekly'`

- **Output**:
  ```javascript
  [
    '2024-12-02',  // Lunes
    '2024-12-04',  // Miércoles
    '2024-12-09',  // Lunes
    '2024-12-11',  // Miércoles
    '2024-12-16',  // Lunes
    '2024-12-18',  // Miércoles
    '2024-12-23',  // Lunes
    '2024-12-25',  // Miércoles
    '2024-12-30',  // Lunes
  ]
  ```

### Resultado en Base de Datos

Si se crean clases para **Viernes del 5 al 13 de diciembre** (2 fechas):

```sql
SELECT id, name, start_date, end_date, days_of_week
FROM programmed_classes
WHERE name = 'Viernes - Pista 1'
ORDER BY start_date;
```

**Resultado**:

| id | name | start_date | end_date | days_of_week |
|----|------|------------|----------|--------------|
| uuid-1 | Viernes - Pista 1 | 2024-12-06 | 2024-12-06 | {viernes} |
| uuid-2 | Viernes - Pista 1 | 2024-12-13 | 2024-12-13 | {viernes} |

**2 registros** individuales, no 1 con rango.

---

## Método 2: Creación Masiva (Bulk)

### Flujo de Usuario

1. Usuario accede a **"Creación Masiva"** (o similar).
2. Puede importar un archivo CSV o introducir múltiples clases manualmente.
3. El sistema envía todas las clases en **una sola llamada** al Edge Function.

### Proceso Técnico

**Diferencia clave**: En vez de enviar días de la semana + rango de fechas, se envía una **lista explícita de fechas**.

```typescript
const bulkClassesData = [
  {
    name: 'Clase A',
    start_date: '2024-12-05',
    end_date: '2024-12-05',
    days_of_week: ['jueves'],
    recurrence_type: 'weekly',
    // ... otros campos
  },
  {
    name: 'Clase B',
    start_date: '2024-12-06',
    end_date: '2024-12-06',
    days_of_week: ['viernes'],
    recurrence_type: 'weekly',
    // ... otros campos
  },
];

// Llamar Edge Function por cada clase
for (const classData of bulkClassesData) {
  await supabase.functions.invoke('create-programmed-classes', { body: classData });
}
```

El Edge Function funciona **exactamente igual**, pero como `start_date = end_date`, `generateClassDates()` devuelve solo **1 fecha**.

---

## Edge Function: create-programmed-classes

### Ubicación

`supabase/functions/create-programmed-classes/index.ts`

### Responsabilidades

1. **Autenticación**: Verificar token del usuario.
2. **Generación de fechas**: Usar `generateClassDates()` para calcular todas las fechas de las clases.
3. **Creación de clases**: Insertar **un registro por fecha** en `programmed_classes`.
4. **Creación de participantes**: Insertar participantes en `class_participants` para cada clase.
5. **Respuesta**: Devolver IDs de clases creadas y total.

### Parámetros de Entrada

```typescript
interface CreateClassData {
  name: string;
  level_from?: number;
  level_to?: number;
  custom_level?: string;
  duration_minutes: number;
  start_time: string;              // '19:00:00'
  days_of_week: string[];          // ['lunes', 'miercoles']
  start_date: string;              // '2024-12-05'
  end_date: string;                // '2024-12-31'
  recurrence_type: string;         // 'weekly', 'biweekly', 'monthly'
  trainer_profile_id: string;
  club_id: string;
  court_number: number;
  monthly_price: number;
  max_participants: number;
  is_open?: boolean;
  group_id?: string;
  selected_students?: string[];    // Array de student_enrollment_id
}
```

### Respuesta Exitosa

```json
{
  "success": true,
  "class_ids": [
    "uuid-class-1",
    "uuid-class-2",
    "uuid-class-3"
  ],
  "total_classes": 3,
  "total_dates": 3
}
```

### Manejo de Errores

```typescript
try {
  // ... lógica
} catch (error) {
  console.error('Error in create-programmed-classes function:', error);
  return new Response(
    JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

### Deployment

```bash
npx supabase functions deploy create-programmed-classes
```

---

## Diferencias entre Métodos

### Sistema Antiguo vs Nuevo

| Aspecto | Sistema Antiguo (Recurrencia) | Sistema Nuevo (Individual) |
|---------|-------------------------------|----------------------------|
| **Registros en DB** | 1 registro con rango de fechas | N registros (1 por fecha) |
| **start_date** | Inicio del rango | Fecha específica de la clase |
| **end_date** | Fin del rango | Igual a start_date |
| **Consulta SQL** | Requiere calcular fechas dinámicamente | Consulta directa por fecha |
| **Participantes** | 1 registro por clase-estudiante | 1 registro por clase-estudiante |
| **Modificación** | Afecta toda la serie | Afecta solo esa clase |
| **Cancelación** | Difícil cancelar 1 clase específica | Fácil: eliminar ese registro |

### Creación Programada vs Masiva

| Aspecto | Programada | Masiva |
|---------|-----------|--------|
| **Input usuario** | Días de semana + rango | Fechas específicas |
| **Llamadas API** | 1 llamada | N llamadas (1 por clase) |
| **Generación fechas** | Automática (generateClassDates) | Manual (frontend) |
| **Casos de uso** | Clases regulares semanales | Importar desde CSV, eventos únicos |

---

## Casos de Uso

### Caso 1: Clase Regular Semanal

**Escenario**: Crear una clase de lunes y miércoles de 19:00 a 20:30 durante todo diciembre.

**Datos**:
```javascript
{
  name: "Clase Avanzados",
  days_of_week: ['lunes', 'miercoles'],
  start_date: '2024-12-02',
  end_date: '2024-12-31',
  recurrence_type: 'weekly',
  start_time: '19:00:00',
  duration_minutes: 90,
  // ... otros campos
}
```

**Resultado**:
- 9 clases creadas (4 lunes + 5 miércoles).
- Cada una tiene `start_date = end_date` con la fecha específica.

### Caso 2: Clase Quincenal

**Escenario**: Clase de viernes cada 2 semanas.

**Datos**:
```javascript
{
  name: "Clase Principiantes",
  days_of_week: ['viernes'],
  start_date: '2024-12-06',
  end_date: '2024-12-31',
  recurrence_type: 'biweekly',
  // ...
}
```

**Resultado**:
- 2 clases: 6 de diciembre y 20 de diciembre.

### Caso 3: Importación Masiva desde CSV

**Escenario**: Importar 50 clases desde un CSV con fechas específicas.

**Proceso**:
1. Frontend parsea CSV.
2. Por cada fila, crea un objeto con `start_date = end_date = fecha_csv`.
3. Llama al Edge Function 50 veces (o agrupa en batch).

---

## Troubleshooting

### Problema 1: Solo se crea 1 clase en vez de varias

**Síntoma**:
```sql
SELECT COUNT(*) FROM programmed_classes WHERE name = 'Mi Clase';
-- Resultado: 1 (esperaba 8)
```

**Causas posibles**:
1. **Sistema antiguo todavía activo**: El Edge Function no está actualizado.
2. **Error en generateClassDates()**: No genera las fechas correctamente.
3. **Error en el loop del Edge Function**: Se detiene después de la primera iteración.

**Solución**:
1. Verificar que el Edge Function esté deployado:
   ```bash
   npx supabase functions deploy create-programmed-classes
   ```

2. Revisar logs del Edge Function:
   ```bash
   npx supabase functions logs create-programmed-classes
   ```

3. Verificar que `generateClassDates()` devuelve múltiples fechas:
   ```typescript
   const dates = generateClassDates(classData);
   console.log('Generated dates:', dates);
   ```

### Problema 2: Fechas con día incorrecto (timezone issue)

**Síntoma**:
- Clase creada para jueves 4 diciembre.
- Jugador ve "miércoles 4 diciembre".

**Causa**:
Parseo de fecha como UTC en vez de timezone local.

**Solución**:
Usar construcción de fecha con timezone local:

```typescript
// ❌ MAL
const date = new Date('2024-12-04');  // Parsea como UTC

// ✅ BIEN
const [year, month, day] = '2024-12-04'.split('-').map(Number);
const date = new Date(year, month - 1, day, 12, 0, 0);  // Local timezone
```

### Problema 3: Participantes no se añaden

**Síntoma**:
- Clases creadas correctamente.
- Tabla `class_participants` vacía.

**Causa**:
- `selected_students` está vacío.
- `group_id` no tiene miembros activos.

**Debugging**:

```sql
-- Verificar que la clase existe
SELECT * FROM programmed_classes WHERE id = 'uuid-clase';

-- Verificar participantes
SELECT * FROM class_participants WHERE class_id = 'uuid-clase';

-- Si usas group_id, verificar miembros
SELECT * FROM group_members WHERE group_id = 'uuid-grupo' AND is_active = true;
```

**Solución**:
1. Asegúrate de que `selected_students` o `group_id` están correctamente poblados.
2. Verifica que los `student_enrollment_id` existen y están activos.

### Problema 4: Error de autenticación

**Síntoma**:
```json
{ "error": "Unauthorized" }
```

**Causa**:
Token de autenticación no válido o expirado.

**Solución**:
Verificar que se envía el header correcto:

```typescript
const { data, error } = await supabase.functions.invoke('create-programmed-classes', {
  body: classData,
  // El token se envía automáticamente por el cliente de Supabase
});
```

Si usas fetch manual:

```typescript
fetch('https://tu-proyecto.supabase.co/functions/v1/create-programmed-classes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(classData),
});
```

### Problema 5: Límite de clases alcanzado

**Síntoma**:
Solo se crean las primeras 10 clases de 20.

**Causa**:
Timeout o límite de ejecución del Edge Function.

**Solución**:
1. Dividir la creación en batches más pequeños.
2. Aumentar el timeout si es posible.
3. Crear clases de forma asíncrona y notificar al usuario cuando termine.

---

## Historial de Cambios

### Diciembre 2024 - Migración de Recurrencia a Individual

**Cambio**: De 1 registro con rango a N registros individuales.

**Motivación**:
- Simplificar consultas SQL (no calcular fechas dinámicamente).
- Facilitar cancelación/modificación de clases individuales.
- Consistencia con sistema de creación masiva.
- Mejor rendimiento en queries de asistencia.

**Archivos modificados**:
- `supabase/functions/create-programmed-classes/index.ts`

**Cambios específicos**:

**Antes**:
```typescript
const { data: createdClass } = await supabase
  .from("programmed_classes")
  .insert([{
    name: classData.name,
    start_date: classData.start_date,  // '2024-12-05'
    end_date: classData.end_date,      // '2024-12-31'
    // ...
  }])
  .select()
  .single();
```

**Después**:
```typescript
for (const classDate of classDates) {
  const { data: createdClass } = await supabase
    .from("programmed_classes")
    .insert([{
      name: classData.name,
      start_date: classDate,      // '2024-12-05'
      end_date: classDate,        // '2024-12-05'
      // ...
    }])
    .select()
    .single();

  createdClassIds.push(createdClass.id);

  // Añadir participantes para esta clase específica
  // ...
}
```

**Impacto**:
- Queries de asistencia más simples.
- No requiere cambios en frontend (transparente).
- Posible aumento en número de registros en DB (no significativo).

**Migración de datos**:
No fue necesario migrar datos existentes, ya que el cambio se aplicó a nuevas clases.

---

## Ver También

- [Sistema de Asistencias](./DOCS_SISTEMA_ASISTENCIAS.md)
- [Migraciones SQL](../migrations/README.md)
- [Configuraciones](../configuraciones/README.md)

---

**Última actualización**: 2025-12-05
**Autor**: Equipo de desarrollo
**Versión**: 2.0 (Individual Classes System)
