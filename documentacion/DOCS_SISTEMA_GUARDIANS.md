# Sistema de Guardians (Padres/Tutores)

## Índice
1. [Introducción](#introducción)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Flujo de Registro de Guardian](#flujo-de-registro-de-guardian)
4. [Gestión de Hijos/Dependientes](#gestión-de-hijosdependientes)
5. [Guardian como Alumno](#guardian-como-alumno)
6. [Sistema de Asistencia para Guardians](#sistema-de-asistencia-para-guardians)
7. [Políticas RLS](#políticas-rls)
8. [Hooks y Componentes](#hooks-y-componentes)
9. [Casos de Uso](#casos-de-uso)

---

## Introducción

El sistema de Guardians permite a padres y tutores gestionar los perfiles de sus hijos menores de edad. Un guardian puede:

- Crear perfiles de estudiante para sus hijos
- Ver las clases y horarios de sus hijos
- Marcar asistencia/ausencia en nombre de sus hijos
- Opcionalmente, crear su propio perfil de alumno si también participa en clases

### Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `player` | Jugador/alumno independiente |
| `guardian` | Padre/tutor que gestiona hijos |
| `trainer` | Profesor/entrenador |
| `admin` | Administrador del club |
| `superadmin` | Super administrador |

---

## Arquitectura de Base de Datos

### Tabla: `account_dependents`

**Propósito**: Relaciona guardians con sus dependientes (hijos).

```sql
CREATE TABLE account_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_profile_id UUID NOT NULL REFERENCES profiles(id),
  dependent_profile_id UUID NOT NULL REFERENCES profiles(id),
  relationship_type TEXT DEFAULT 'child',
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(guardian_profile_id, dependent_profile_id)
);
```

**Campos**:
- `guardian_profile_id`: ID del perfil del guardian (padre/tutor)
- `dependent_profile_id`: ID del perfil del hijo/dependiente
- `relationship_type`: Tipo de relación (por defecto 'child')
- `birth_date`: Fecha de nacimiento del dependiente

### Tabla: `profiles`

Los guardians tienen `role = 'guardian'` en la tabla profiles. Sus hijos tienen `role = 'player'`.

---

## Flujo de Registro de Guardian

### 1. Registro Inicial

Cuando un usuario se registra como guardian:

1. Se crea el usuario en `auth.users`
2. El trigger `handle_new_user` crea el perfil con `role = 'guardian'`
3. Se redirige a `GuardianSetupPage` para añadir hijos

### 2. Página de Setup (`GuardianSetupPage.tsx`)

```
/dashboard/guardian-setup
```

En esta página el guardian:
1. Ingresa el código del club
2. Ingresa el nombre del primer hijo
3. Se crea el perfil del hijo con email temporal

### 3. Creación de Perfil de Hijo

El proceso de creación genera:

```typescript
// Email temporal para el hijo
const childEmail = `child.${normalizedName}.${timestamp}@temp.padelock.com`;

// Para guardian creando su propio perfil
const guardianEmail = `guardian.${normalizedName}.${timestamp}@temp.padelock.com`;
```

**Flujo en `useGuardianChildren.ts`**:

1. Guardar sesión del guardian
2. Crear usuario con `supabase.auth.signUp()`
3. Esperar creación de perfil (trigger)
4. Restaurar sesión del guardian
5. Crear relación en `account_dependents`

---

## Gestión de Hijos/Dependientes

### Página Mis Hijos (`MyChildrenPage.tsx`)

```
/dashboard/my-children
```

Permite:
- Ver lista de hijos registrados
- Añadir nuevos hijos
- Editar nombre y nivel de hijos existentes

### Hook: `useGuardianChildren`

```typescript
const {
  children,        // Lista de hijos
  isLoading,
  addChild,        // Añadir hijo
  isAddingChild,
  editChild,       // Editar hijo
  removeChild,     // Eliminar relación
} = useGuardianChildren();
```

### Modal de Añadir Hijo (`AddChildModal.tsx`)

Dos modos:
- `setup`: Primera vez, requiere código de club
- `add`: Añadir hijo adicional, usa club del guardian

---

## Guardian como Alumno

### Problema Original

Algunos guardians también son alumnos en las clases. Inicialmente se intentó crear perfiles separados, pero esto generaba usuarios con emails temporales inaccesibles.

### Solución Implementada

El guardian puede crear un "perfil de alumno" para sí mismo que funciona como un dependiente más, pero con su propio nombre.

### Detección Automática

```typescript
// En useGuardianChildren.ts
const isSelfProfile = childData.fullName.toLowerCase().trim() ===
  guardianProfile?.full_name?.toLowerCase().trim();

// Prefijo diferente para distinguir
const emailPrefix = isSelfProfile ? 'guardian' : 'child';
```

### Ubicación de la Opción

1. **Sidebar Desktop** (`AppSidebar.tsx`):
   - Opción "¿Eres alumno?" en color naranja
   - Solo visible si `isGuardian && !hasSelfProfile`

2. **Menú Mobile** (`AppLayout.tsx`):
   - En el dropdown del perfil (esquina superior derecha)
   - Solo visible en móvil para guardians sin perfil propio

### Modal (`AddSelfAsStudentModal.tsx`)

Muestra:
- Nombre del guardian que se convertirá en perfil de alumno
- Botón de confirmación con colores de la marca (playtomic-orange)

### Verificación de Perfil Existente

```typescript
const hasSelfProfile = isGuardian && children.some(child =>
  child.full_name.toLowerCase().trim() === profile?.full_name?.toLowerCase().trim()
);
```

---

## Sistema de Asistencia para Guardians

### Problema

Los guardians no podían marcar asistencia/ausencia para sus hijos porque las políticas RLS solo permitían:
- Estudiantes: Marcar su propia asistencia
- Trainers: Marcar asistencia de sus clases
- Admins: Marcar cualquier asistencia

### Solución: Políticas RLS para Guardians

Archivo: `20260109100000_add_guardian_policies_to_attendance_confirmations.sql`

```sql
-- SELECT: Ver registros de asistencia de dependientes
CREATE POLICY "Guardians can view dependent attendance records"
  ON class_attendance_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guardian'
    )
    AND
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      JOIN account_dependents ad ON ad.dependent_profile_id = se.student_profile_id
      WHERE ad.guardian_profile_id = auth.uid()
    )
  );

-- UPDATE: Modificar registros de asistencia de dependientes
CREATE POLICY "Guardians can update dependent attendance records"
  ON class_attendance_confirmations FOR UPDATE
  USING (
    -- Misma lógica que SELECT
  );

-- INSERT: Crear registros de asistencia para dependientes
CREATE POLICY "Guardians can insert dependent attendance records"
  ON class_attendance_confirmations FOR INSERT
  WITH CHECK (
    -- Misma lógica que SELECT
  );
```

### Características de las Políticas

1. **Aislamiento por rol**: Solo aplican a usuarios con `role = 'guardian'`
2. **No afectan otros roles**: Son políticas adicionales, no modifican las existentes
3. **Verificación de relación**: Usan `account_dependents` para validar parentesco

### Migración para Historial

Archivo: `20260109000000_add_guardian_to_attendance_history.sql`

```sql
-- Añadir 'guardian' al CHECK constraint de attendance_history
ALTER TABLE attendance_history
ADD CONSTRAINT attendance_history_changed_by_role_check
CHECK (changed_by_role IN ('player', 'trainer', 'admin', 'superadmin', 'guardian', 'system'));
```

---

## Políticas RLS

### Tabla: `account_dependents`

```sql
-- Guardians pueden ver sus propios dependientes
CREATE POLICY "Guardians can view own dependents"
  ON account_dependents FOR SELECT
  USING (guardian_profile_id = auth.uid());

-- Guardians pueden insertar dependientes
CREATE POLICY "Guardians can insert dependents"
  ON account_dependents FOR INSERT
  WITH CHECK (guardian_profile_id = auth.uid());

-- Guardians pueden eliminar sus dependientes
CREATE POLICY "Guardians can delete own dependents"
  ON account_dependents FOR DELETE
  USING (guardian_profile_id = auth.uid());
```

### Tabla: `class_attendance_confirmations`

Ver sección [Sistema de Asistencia para Guardians](#sistema-de-asistencia-para-guardians).

---

## Hooks y Componentes

### Hooks

| Hook | Archivo | Propósito |
|------|---------|-----------|
| `useGuardianChildren` | `src/hooks/useGuardianChildren.ts` | CRUD de hijos |
| `useConfirmAbsence` | `src/hooks/useAttendanceConfirmations.ts` | Marcar ausencia |
| `useConfirmAttendance` | `src/hooks/useAttendanceConfirmations.ts` | Confirmar asistencia |

### Componentes

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| `GuardianSetupPage` | `src/pages/GuardianSetupPage.tsx` | Setup inicial |
| `MyChildrenPage` | `src/pages/MyChildrenPage.tsx` | Gestión de hijos |
| `AddChildModal` | `src/components/AddChildModal.tsx` | Modal añadir hijo |
| `AddSelfAsStudentModal` | `src/components/AddSelfAsStudentModal.tsx` | Modal guardian como alumno |
| `GuardianPlayerSidebar` | `src/components/AppSidebar.tsx` | Sidebar para guardians |

### Traducciones

```json
// es.json
{
  "sidebar": {
    "areYouStudent": "¿Eres alumno?",
    "myChildren": "Mis Hijos",
    "profiles": "Perfiles"
  }
}

// en.json
{
  "sidebar": {
    "areYouStudent": "Are you a student?",
    "myChildren": "My Children",
    "profiles": "Profiles"
  }
}

// it.json
{
  "sidebar": {
    "areYouStudent": "Sei un alunno?",
    "myChildren": "I miei figli",
    "profiles": "Profili"
  }
}
```

---

## Casos de Uso

### Caso 1: Guardian registra a su primer hijo

1. Guardian se registra en la app
2. Completa `GuardianSetupPage`:
   - Ingresa código del club
   - Ingresa nombre del hijo
3. Sistema crea perfil del hijo con email temporal
4. Se crea relación en `account_dependents`
5. Guardian ve dashboard con clases del hijo

### Caso 2: Guardian añade segundo hijo

1. Guardian va a "Mis Hijos"
2. Pulsa "Añadir Hijo"
3. Solo ingresa nombre (club se hereda)
4. Sistema crea nuevo perfil y relación

### Caso 3: Guardian también es alumno

1. Guardian ve opción "¿Eres alumno?" en sidebar/menú
2. Pulsa y confirma en modal
3. Sistema crea perfil con prefijo `guardian.` en email
4. La opción desaparece del menú
5. Guardian puede gestionar su propia asistencia

### Caso 4: Guardian marca ausencia de hijo

1. Guardian abre dashboard
2. Ve clases de sus hijos
3. Pulsa en una clase para marcar ausencia
4. Sistema usa política RLS de guardian
5. Se actualiza `class_participants` y `class_attendance_confirmations`
6. Historial registra `changed_by_role = 'guardian'`

---

## Troubleshooting

### Error: "The result contains 0 rows" al marcar asistencia

**Causa**: Faltan políticas RLS para guardians en `class_attendance_confirmations`.

**Solución**: Aplicar migración `20260109100000_add_guardian_policies_to_attendance_confirmations.sql`.

### Guardian no ve opción "¿Eres alumno?"

**Causa**: Ya tiene un perfil de alumno creado con su mismo nombre.

**Verificación**:
```typescript
const hasSelfProfile = children.some(child =>
  child.full_name.toLowerCase().trim() === profile?.full_name?.toLowerCase().trim()
);
```

### Error al crear hijo: "Solo los usuarios con rol guardian pueden añadir hijos"

**Causa**: El usuario no tiene `role = 'guardian'` en profiles.

**Verificación SQL**:
```sql
SELECT id, role FROM profiles WHERE id = 'user-id';
```

### Hijo no aparece en lista tras creación

**Causa**: La relación en `account_dependents` no se creó correctamente.

**Verificación SQL**:
```sql
SELECT * FROM account_dependents
WHERE guardian_profile_id = 'guardian-id';
```
