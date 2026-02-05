# Sistema de Tarifas y Pagos

## Índice
1. [Introducción](#introducción)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Tipos de Tarifas](#tipos-de-tarifas)
4. [Asignación de Tarifas a Alumnos](#asignación-de-tarifas-a-alumnos)
5. [Generación Automática de Pagos](#generación-automática-de-pagos)
6. [Flujo de Estados de Pagos](#flujo-de-estados-de-pagos)
7. [Hooks y Componentes](#hooks-y-componentes)
8. [Casos de Uso Comunes](#casos-de-uso-comunes)
9. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de tarifas y pagos permite gestionar el cobro mensual a los alumnos de forma automatizada. El sistema soporta dos tipos de tarifas:

1. **Tarifa Fija** (`fija`): Precio fijo mensual independiente del número de clases
2. **Tarifa Por Clase** (`por_clase`): Precio multiplicado por el número de clases del mes

El sistema genera pagos automáticamente cada mes mediante un cron job que se ejecuta diariamente.

---

## Arquitectura de Base de Datos

### Tabla: `payment_rates`

**Propósito**: Define las tarifas configurables por club.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- club_id: UUID (Foreign Key a clubs)
- name: VARCHAR(100) -- Nombre de la tarifa
- description: TEXT -- Descripción opcional

-- Tipo y precio
- rate_type: VARCHAR(20) -- 'fija' | 'por_clase'
- periodicity: VARCHAR(20) -- 'mensual' | 'trimestral' | 'semestral' | 'anual'
- fixed_price: DECIMAL(10,2) -- Para tipo 'fija'
- price_per_class: DECIMAL(10,2) -- Para tipo 'por_clase'

-- Configuración de facturación
- billing_day: INTEGER (1-28) -- Día del mes en que se genera el pago
- due_days: INTEGER DEFAULT 30 -- Días hasta vencimiento
- grace_days: INTEGER DEFAULT 7 -- Días antes del vencimiento para recordatorio

- is_active: BOOLEAN DEFAULT true
- created_at, updated_at: TIMESTAMPTZ
```

**Constraint de validación**:
```sql
CONSTRAINT valid_pricing CHECK (
  (rate_type = 'fija' AND fixed_price IS NOT NULL AND fixed_price > 0) OR
  (rate_type = 'por_clase' AND price_per_class IS NOT NULL AND price_per_class > 0)
)
```

---

### Tabla: `student_rate_assignments`

**Propósito**: Asigna tarifas a alumnos con un periodo de vigencia.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- student_enrollment_id: UUID (Foreign Key a student_enrollments)
- payment_rate_id: UUID (Foreign Key a payment_rates)

-- Periodo de asignación
- start_date: DATE -- Fecha desde la que aplica
- end_date: DATE -- Fecha hasta (NULL = indefinido)

-- Estado
- status: VARCHAR(20) -- 'activa' | 'pausada' | 'finalizada'

- created_at, updated_at: TIMESTAMPTZ
```

**Estados de asignación**:
| Estado | Descripción |
|--------|-------------|
| `activa` | Generando pagos normalmente |
| `pausada` | Temporalmente sin generar pagos |
| `finalizada` | Terminada, no genera más pagos |

---

### Tabla: `student_payments`

**Propósito**: Pagos generados para los alumnos.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- club_id: UUID (Foreign Key a clubs)
- student_enrollment_id: UUID (Foreign Key a student_enrollments)

-- Relación con tarifa
- payment_rate_id: UUID (nullable, Foreign Key a payment_rates)
- rate_assignment_id: UUID (nullable, Foreign Key a student_rate_assignments)

-- Detalles del pago
- concept: VARCHAR(200) -- Ej: "Tarifa Mensual - 03/2026"
- description: TEXT
- amount: DECIMAL(10,2) -- Importe total

-- Para tarifas por_clase
- classes_count: INTEGER -- Número de clases incluidas
- period_start: DATE -- Inicio del periodo
- period_end: DATE -- Fin del periodo

-- Fechas
- issue_date: DATE -- Fecha de emisión
- due_date: DATE -- Fecha de vencimiento

-- Estado
- status: VARCHAR(20) -- 'pendiente' | 'en_revision' | 'pagado'

-- Método de pago
- payment_method: VARCHAR(20) -- 'efectivo' | 'tarjeta' | 'bizum'

-- Flags
- is_extra_payment: BOOLEAN DEFAULT false -- Pago manual vs automático

-- Tracking
- student_marked_paid_at: TIMESTAMPTZ
- admin_verified_at: TIMESTAMPTZ
- reminder_sent_at: TIMESTAMPTZ

-- Notas
- student_notes: TEXT
- admin_notes: TEXT

- created_at, updated_at: TIMESTAMPTZ
```

---

### Tabla: `payment_generation_logs`

**Propósito**: Auditoría de las ejecuciones de generación automática.

**Campos clave**:
```sql
- id: UUID (Primary Key)

-- Contexto de ejecución
- executed_at: TIMESTAMPTZ DEFAULT NOW()
- billing_day: INTEGER (1-28)
- target_month: INTEGER (1-12)
- target_year: INTEGER

-- Resultados
- total_assignments_processed: INTEGER
- payments_generated: INTEGER
- payments_skipped: INTEGER
- errors_count: INTEGER

-- Detalles (JSONB)
- details: JSONB -- Array con info de cada pago generado/saltado
- errors: JSONB -- Array con errores encontrados

-- Metadata
- execution_time_ms: INTEGER
- triggered_by: VARCHAR(50) -- 'cron' | 'manual' | 'test'
```

**Ejemplo de `details`**:
```json
[
  {
    "assignment_id": "uuid",
    "student_name": "Carlos García",
    "status": "generated",
    "payment_id": "uuid",
    "rate_type": "por_clase",
    "classes_count": 4
  },
  {
    "assignment_id": "uuid",
    "student_name": "María López",
    "status": "skipped",
    "reason": "payment_exists",
    "existing_payment_id": "uuid"
  }
]
```

---

## Tipos de Tarifas

### Tarifa Fija (`fija`)

- Precio fijo mensual
- No depende del número de clases
- Ideal para cuotas mensuales estándar

**Ejemplo**: Cuota mensual de 50€/mes

### Tarifa Por Clase (`por_clase`)

- Precio por cada clase asistida
- Se calcula: `precio_por_clase × número_de_clases`
- El cron cuenta las clases programadas del mes

**Ejemplo**: 7€/clase × 4 clases = 28€

---

## Asignación de Tarifas a Alumnos

### Crear asignación

```typescript
// Hook: useStudentRateAssignments
const { mutate: createAssignment } = useCreateRateAssignment();

createAssignment({
  student_enrollment_id: "uuid-del-alumno",
  payment_rate_id: "uuid-de-la-tarifa",
  start_date: "2026-02-01",
  end_date: null, // indefinido
  status: "activa"
});
```

### Estados de asignación

| Estado | Genera pagos | Uso |
|--------|--------------|-----|
| `activa` | ✅ Sí | Funcionamiento normal |
| `pausada` | ❌ No | Baja temporal (vacaciones, lesión) |
| `finalizada` | ❌ No | Baja definitiva |

---

## Generación Automática de Pagos

### Cron Job

El sistema utiliza `pg_cron` para ejecutar la generación automáticamente.

**Configuración**:
```sql
SELECT cron.schedule(
  'generate-monthly-payments',
  '5 0 * * *',  -- Diario a las 00:05 UTC
  $$SELECT trigger_monthly_payment_generation()$$
);
```

### Flujo de ejecución

1. **Trigger diario** (00:05 UTC)
2. **Determinar billing_day** = día actual del mes
3. **Buscar asignaciones activas** con ese `billing_day`
4. **Para cada asignación**:
   - Verificar si ya existe pago para el periodo → Skip si existe
   - Si es `por_clase`: contar clases del mes → Skip si 0 clases
   - Generar pago con importe calculado
5. **Registrar log** con resultados

### Función principal

```sql
auto_generate_monthly_payments(
  p_billing_day INTEGER,        -- Día de facturación (1-28)
  p_target_month INTEGER,       -- Mes objetivo (NULL = actual)
  p_target_year INTEGER,        -- Año objetivo (NULL = actual)
  p_triggered_by VARCHAR,       -- 'cron' | 'manual' | 'test'
  p_club_id UUID                -- Filtro opcional por club
)
RETURNS JSONB
```

**Retorno**:
```json
{
  "success": true,
  "log_id": "uuid",
  "billing_day": 1,
  "target_period": "2026-03",
  "total_processed": 10,
  "generated": 8,
  "skipped": 2,
  "errors": 0,
  "execution_time_ms": 150
}
```

### Razones de skip

| Razón | Descripción |
|-------|-------------|
| `payment_exists` | Ya existe un pago para ese periodo |
| `no_classes_in_period` | Tarifa por_clase sin clases en el mes |

### Idempotencia

El sistema es **idempotente**: ejecutarlo múltiples veces no crea duplicados.

```sql
-- Verificación antes de crear
SELECT id INTO v_existing_payment_id
FROM student_payments
WHERE rate_assignment_id = v_assignment.assignment_id
  AND period_start = v_period_start
  AND period_end = v_period_end
LIMIT 1;

IF v_existing_payment_id IS NOT NULL THEN
  -- Skip - ya existe
END IF;
```

---

## Flujo de Estados de Pagos

```
┌──────────────┐    Alumno marca     ┌──────────────┐    Admin verifica   ┌──────────────┐
│  pendiente   │ ──── "He pagado" ──►│  en_revision │ ──── pago real ────►│    pagado    │
└──────────────┘                     └──────────────┘                     └──────────────┘
```

### Estados

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Pago generado, esperando acción del alumno |
| `en_revision` | Alumno marcó como pagado, admin debe verificar |
| `pagado` | Admin confirmó el pago |

---

## Hooks y Componentes

### Hooks principales

| Hook | Propósito |
|------|-----------|
| `usePaymentRates` | CRUD de tarifas |
| `useStudentRateAssignments` | CRUD de asignaciones |
| `useStudentPayments` | CRUD de pagos |
| `usePaymentGenerationLogs` | Ver logs de generación |
| `useManualPaymentGeneration` | Ejecutar generación manual |
| `useGenerateAllBillingDays` | Generar para todos los billing_days |

### Componentes principales

| Componente | Propósito |
|------------|-----------|
| `PaymentRatesManager` | Gestión de tarifas del club |
| `StudentRateAssignment` | Asignar tarifas a alumnos |
| `PaymentControlTable` | Ver y gestionar pagos |
| `PaymentGenerationLogsDialog` | Ver historial de generación |

---

## Casos de Uso Comunes

### 1. Crear una nueva tarifa

```typescript
const { mutate: createRate } = useCreatePaymentRate();

createRate({
  club_id: "uuid-club",
  name: "Cuota Mensual Adultos",
  rate_type: "fija",
  periodicity: "mensual",
  fixed_price: 50.00,
  billing_day: 1, // Genera pagos el día 1 de cada mes
  due_days: 30
});
```

### 2. Asignar tarifa a alumno

```typescript
const { mutate: assignRate } = useCreateRateAssignment();

assignRate({
  student_enrollment_id: "uuid-alumno",
  payment_rate_id: "uuid-tarifa",
  start_date: "2026-03-01",
  status: "activa"
});
```

### 3. Ejecutar generación manual

```typescript
const { mutate: generate } = useManualPaymentGeneration();

// Generar para billing_day=1, marzo 2026
generate({
  billingDay: 1,
  targetMonth: 3,
  targetYear: 2026
});
```

### 4. Ver logs de generación

```typescript
const { data: logs } = usePaymentGenerationLogs(20);

// logs contiene últimas 20 ejecuciones con detalles
```

### 5. Pausar temporalmente una asignación

```typescript
const { mutate: updateAssignment } = useUpdateRateAssignment();

updateAssignment({
  id: "uuid-asignacion",
  status: "pausada"
});
```

---

## Troubleshooting

### Los pagos no se generan automáticamente

1. **Verificar que el cron está activo**:
```sql
SELECT * FROM cron.job WHERE jobname = 'generate-monthly-payments';
```

2. **Verificar billing_day de las tarifas**:
```sql
SELECT name, billing_day FROM payment_rates WHERE is_active = true;
```

3. **Verificar asignaciones activas**:
```sql
SELECT * FROM student_rate_assignments WHERE status = 'activa';
```

### Pagos saltados por "no_classes_in_period"

Para tarifas `por_clase`, verificar que el alumno tiene clases programadas:

```sql
SELECT se.full_name, COUNT(pc.id) as clases
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.class_id
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE cp.status = 'active'
  AND pc.is_active = true
  AND pc.start_date >= '2026-03-01'
  AND pc.start_date <= '2026-03-31'
GROUP BY se.full_name;
```

### Pagos saltados por "payment_exists"

Es el comportamiento esperado - el sistema es idempotente. Verificar:

```sql
SELECT * FROM student_payments
WHERE period_start = '2026-03-01'
  AND rate_assignment_id = 'uuid-asignacion';
```

### Ver historial de ejecuciones del cron

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-monthly-payments')
ORDER BY start_time DESC
LIMIT 10;
```

### Ejecutar generación manual para pruebas

```sql
-- Para un club específico
SELECT auto_generate_monthly_payments(
  1,      -- billing_day
  3,      -- marzo
  2026,   -- año
  'test', -- triggered_by
  'uuid-club'  -- filtrar por club
);

-- Ver resultado
SELECT * FROM payment_generation_logs ORDER BY executed_at DESC LIMIT 1;
```

---

## Archivos Relacionados

### Migraciones SQL
- `supabase/migrations/20250119000000_payment_system_v2.sql` - Tablas base
- `supabase/migrations/20260205000000_auto_payment_generation.sql` - Sistema automático
- `supabase/migrations/20260205100000_create_payment_generation_cron.sql` - Cron job
- `supabase/migrations/20260205200000_add_club_filter_to_auto_generate.sql` - Filtro por club

### Edge Functions
- `supabase/functions/generate-monthly-payments/index.ts` - Función HTTP alternativa

### Hooks
- `src/hooks/usePaymentRates.ts`
- `src/hooks/useStudentPayments.ts`
- `src/hooks/usePaymentGenerationLogs.ts`

### Componentes
- `src/components/payments/PaymentRatesManager.tsx`
- `src/components/payments/PaymentControlTable.tsx`
- `src/components/payments/PaymentGenerationLogsDialog.tsx`

### Páginas
- `src/pages/AdminPaymentControlPage.tsx`
