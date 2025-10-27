# Plan: Sistema de Códigos de Club para Registro de Jugadores

## Análisis del flujo actual

### Estado actual:
1. **AuthPage.tsx**: Los jugadores seleccionan su club desde un dropdown (`ClubSelector`)
2. **ClubSelector.tsx**: Muestra todos los clubes activos (filtrado por "Hespérides" actualmente)
3. **Tabla clubs**: NO tiene columna para código de club
4. **Validación**: Requiere `selectedClubId` antes de permitir el registro

### Problema:
- Los jugadores ven una lista de clubes y pueden seleccionar cualquiera
- No hay validación de que realmente pertenezcan a ese club
- El profesor debe compartir manualmente el nombre del club

## Propuesta: Sistema de Códigos de Club

### Objetivo:
Reemplazar el selector visual de clubes por un input donde el jugador ingresa un **código de 3 letras** que el profesor le proporciona.

---

## FASES DEL PLAN

### **FASE 1: Modificación de Base de Datos**

#### 1.1 Agregar columna `club_code` a la tabla `clubs`

**Archivo**: Nueva migración SQL

```sql
-- Agregar columna club_code (máximo 3 letras, único, uppercase)
ALTER TABLE public.clubs
ADD COLUMN club_code VARCHAR(3) UNIQUE;

-- Crear constraint para validar formato (solo letras mayúsculas)
ALTER TABLE public.clubs
ADD CONSTRAINT club_code_format CHECK (
  club_code IS NULL OR
  (club_code ~ '^[A-Z]{3}$')
);

-- Crear índice para búsquedas rápidas por código
CREATE INDEX idx_clubs_club_code ON public.clubs(club_code);

-- Hacer que club_code sea NOT NULL después de asignar códigos
-- (Esto se hará en FASE 2 después de asignar códigos manualmente)
```

**Resultado esperado**:
- Nueva columna `club_code` en tabla `clubs`
- Solo acepta 3 letras mayúsculas (A-Z)
- Es única en toda la tabla
- Permite NULL temporalmente

---

### **FASE 2: Asignación Manual de Códigos a Clubes Existentes**

#### 2.1 Generar códigos sugeridos para clubes existentes

**Script SQL de consulta**:
```sql
-- Ver clubes existentes sin código
SELECT
  id,
  name,
  address,
  UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3)) as suggested_code
FROM clubs
WHERE club_code IS NULL
ORDER BY name;
```

#### 2.2 Asignar códigos manualmente

**Opción A - Manual por cada club**:
```sql
-- Ejemplo para club "Hespérides"
UPDATE clubs
SET club_code = 'HES'
WHERE name ILIKE '%hespérides%';

-- Ejemplo para club "Pádel Málaga"
UPDATE clubs
SET club_code = 'PAM'
WHERE name ILIKE '%pádel málaga%';
```

**Opción B - Script automático** (si tienes muchos clubes):
```sql
-- Este script genera códigos automáticos basados en el nombre
-- CUIDADO: Puede generar duplicados, revisar antes de ejecutar
UPDATE clubs
SET club_code = UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
WHERE club_code IS NULL;
```

#### 2.3 Hacer club_code obligatorio

**Después de asignar todos los códigos**:
```sql
-- Verificar que no haya clubes sin código
SELECT COUNT(*) FROM clubs WHERE club_code IS NULL;

-- Si resultado = 0, hacer club_code NOT NULL
ALTER TABLE public.clubs
ALTER COLUMN club_code SET NOT NULL;
```

**Resultado esperado**:
- Todos los clubes tienen un código único de 3 letras
- `club_code` es obligatorio (NOT NULL)
- Ejemplos: "HES" (Hespérides), "PAM" (Pádel Málaga), "TEN" (Tennis Club)

---

### **FASE 3: Modificación del Frontend - Componente de Input**

#### 3.1 Crear nuevo componente `ClubCodeInput.tsx`

**Ubicación**: `src/components/ClubCodeInput.tsx`

**Funcionalidad**:
```typescript
interface ClubCodeInputProps {
  value: string;
  onValueChange: (code: string, clubId: string | null) => void;
  error?: string;
  required?: boolean;
}

// Características:
// - Input de 3 caracteres máximo
// - Convierte automáticamente a mayúsculas
// - Valida en tiempo real contra BD
// - Muestra nombre del club encontrado
// - Muestra error si código no existe
```

**Componente visual**:
```tsx
<div className="space-y-3">
  <Label>Código de Club *</Label>
  <Input
    maxLength={3}
    value={clubCode}
    onChange={handleChange}  // Auto-uppercase y validación
    placeholder="Ej: HES"
  />
  {isValidating && <span>Verificando...</span>}
  {clubFound && <span className="text-green-600">✓ {clubFound.name}</span>}
  {error && <span className="text-red-600">{error}</span>}
</div>
```

**Lógica de validación**:
```typescript
const validateClubCode = async (code: string) => {
  if (code.length !== 3) return;

  // Buscar club por código
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('club_code', code.toUpperCase())
    .eq('status', 'active')
    .single();

  if (data) {
    setClubFound(data);
    onValueChange(code, data.id);  // Pasa el club_id al padre
  } else {
    setError('Código de club no válido');
    onValueChange(code, null);
  }
};
```

**Resultado esperado**:
- Input limpio y simple de 3 caracteres
- Validación en tiempo real
- Feedback visual inmediato
- Pasa club_id al componente padre

---

#### 3.2 Reemplazar ClubSelector por ClubCodeInput en AuthPage

**Archivo**: `src/pages/AuthPage.tsx`

**Cambios**:

1. **Importar nuevo componente**:
```typescript
// ANTES:
import ClubSelector from "@/components/ClubSelector";

// DESPUÉS:
import ClubCodeInput from "@/components/ClubCodeInput";
```

2. **Modificar estado**:
```typescript
// ANTES:
const [selectedClubId, setSelectedClubId] = useState("");

// DESPUÉS:
const [clubCode, setClubCode] = useState("");
const [selectedClubId, setSelectedClubId] = useState("");
// (clubCode para el input, selectedClubId para el ID real)
```

3. **Reemplazar en JSX** (línea ~760):
```tsx
{/* ANTES: */}
<ClubSelector
  value={selectedClubId}
  onValueChange={setSelectedClubId}
  label="Club"
  placeholder="Selecciona tu club"
  required
  error={clubError}
/>

{/* DESPUÉS: */}
<ClubCodeInput
  value={clubCode}
  onValueChange={(code, clubId) => {
    setClubCode(code);
    setSelectedClubId(clubId || "");
    if (clubError) setClubError("");
  }}
  error={clubError}
  required
/>
```

4. **Actualizar validación** (línea ~297):
```typescript
// ANTES:
if (!selectedClubId) {
  setClubError("Debes seleccionar un club para completar el registro");
  toast({ ... });
  return;
}

// DESPUÉS:
if (!selectedClubId) {
  setClubError("Debes ingresar un código de club válido");
  toast({
    title: "Error",
    description: "El código de club ingresado no es válido.",
    variant: "destructive"
  });
  return;
}
```

**Resultado esperado**:
- AuthPage usa ClubCodeInput en lugar de ClubSelector
- Misma funcionalidad de validación
- Mejor UX para el jugador

---

### **FASE 4: Actualización del Mensaje de Inscripción del Profesor**

#### 4.1 Modificar formulario de creación de estudiantes

**Archivo**: `src/components/StudentEnrollmentForm.tsx` (si existe)

**Agregar campo de información**:
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4 className="font-semibold text-blue-900 mb-2">
    Código de tu club: <span className="text-2xl font-mono">{trainerClub?.club_code}</span>
  </h4>
  <p className="text-sm text-blue-700">
    Comparte este código con tus alumnos para que puedan registrarse.
  </p>
  <button
    onClick={() => copyToClipboard(trainerClub?.club_code)}
    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
  >
    📋 Copiar código
  </button>
</div>
```

#### 4.2 Actualizar plantilla de mensaje WhatsApp/Email

**Ejemplo de mensaje sugerido**:
```
¡Bienvenido/a a [NOMBRE_CLUB]! 🎾

Para completar tu inscripción en PadeLock:

1. Ve a: https://padelock.app/signup
2. Ingresa el código del club: **HES**
3. Completa tus datos

¡Nos vemos en la pista! 🏆
```

**Resultado esperado**:
- Profesores tienen fácil acceso al código del club
- Pueden copiar y pegar en mensajes
- Instrucciones claras para los jugadores

---

### **FASE 5: Migración de Datos Existentes (Opcional)**

#### 5.1 Verificar jugadores sin club asignado

```sql
-- Jugadores con club_id NULL
SELECT id, full_name, email, created_at
FROM profiles
WHERE role = 'player' AND club_id IS NULL;
```

#### 5.2 Actualizar automáticamente si es posible

```sql
-- Si sabes que todos los jugadores son de Hespérides:
UPDATE profiles
SET club_id = (SELECT id FROM clubs WHERE club_code = 'HES')
WHERE role = 'player' AND club_id IS NULL;
```

**Resultado esperado**:
- Jugadores existentes tienen club asignado
- No hay datos huérfanos

---

### **FASE 6: Actualización del ClubSelector para Admins** (Opcional)

Si los **admins/trainers** aún necesitan ver la lista de clubes en otras partes de la app:

- **Mantener** `ClubSelector.tsx` para uso interno
- **Crear** `ClubCodeInput.tsx` solo para registro público
- **Separar** flujos:
  - Registro público → ClubCodeInput
  - Panel admin → ClubSelector

**Resultado esperado**:
- Doble componente: uno para público, otro para admins
- Flexibilidad en diferentes contextos

---

## RESUMEN DE ARCHIVOS A CREAR/MODIFICAR

### Nuevos archivos:
1. **Migración SQL**: `supabase/migrations/[timestamp]_add_club_code.sql`
2. **Componente**: `src/components/ClubCodeInput.tsx`
3. **Asignación de códigos**: `assign_club_codes.sql` (temporal)

### Archivos a modificar:
1. **src/pages/AuthPage.tsx** - Reemplazar ClubSelector por ClubCodeInput
2. **src/components/StudentEnrollmentForm.tsx** - Mostrar código del club
3. **(Opcional)** Mantener `src/components/ClubSelector.tsx` para uso admin

### Archivos a mantener sin cambios:
- `src/contexts/AuthContext.tsx` - La lógica de signUp sigue igual
- `supabase/migrations/[clubs_table].sql` - Solo se agrega columna, no se modifica estructura

---

## VENTAJAS DEL NUEVO SISTEMA

### Para Jugadores:
- ✅ Más simple: solo 3 letras en lugar de buscar en dropdown
- ✅ Más rápido: menos clics
- ✅ Más claro: el profesor les da el código directamente

### Para Profesores:
- ✅ Control: solo quienes tienen el código pueden inscribirse
- ✅ Seguridad: evita inscripciones en clubes incorrectos
- ✅ Fácil de compartir: 3 letras por WhatsApp/Email

### Para Administradores:
- ✅ Códigos únicos y memorables por club
- ✅ Fácil de gestionar
- ✅ Escalable: funciona con 1 o 100 clubes

---

## RIESGOS Y CONSIDERACIONES

### 1. **Códigos duplicados**
- **Riesgo**: Dos clubes con nombres similares → mismo código sugerido
- **Solución**: Validación UNIQUE en BD + revisión manual en FASE 2

### 2. **Clubes sin código**
- **Riesgo**: Clubes creados antes de la migración
- **Solución**: Script de asignación masiva en FASE 2

### 3. **Usuarios confundidos**
- **Riesgo**: Jugadores no entienden qué es el "código"
- **Solución**: Instrucciones claras en el formulario + placeholder de ejemplo

### 4. **Cambio de código**
- **Riesgo**: ¿Qué pasa si un club quiere cambiar su código?
- **Solución**: Permitir edición solo por admin, notificar a todos los jugadores

---

## ORDEN DE EJECUCIÓN RECOMENDADO

### Paso 1: Base de Datos (FASE 1)
✅ Crear migración con columna `club_code`
✅ Ejecutar en Supabase

### Paso 2: Asignación de Códigos (FASE 2)
✅ Generar códigos sugeridos
✅ Asignar manualmente o automáticamente
✅ Hacer columna NOT NULL

### Paso 3: Frontend - Componente (FASE 3.1)
✅ Crear `ClubCodeInput.tsx`
✅ Probar validación en tiempo real

### Paso 4: Frontend - Integración (FASE 3.2)
✅ Reemplazar en `AuthPage.tsx`
✅ Probar flujo completo de registro

### Paso 5: UX para Profesores (FASE 4)
✅ Actualizar formularios de inscripción
✅ Crear plantillas de mensaje

### Paso 6: Testing y Limpieza
✅ Probar registro con código válido
✅ Probar registro con código inválido
✅ Verificar mensajes de error
✅ Limpiar código antiguo (opcional)

---

## CHECKLIST FINAL

Antes de considerar completado:

- [ ] Migración ejecutada en Supabase ✅
- [ ] Todos los clubes tienen código único ✅
- [ ] `ClubCodeInput.tsx` creado y funcional ✅
- [ ] `AuthPage.tsx` actualizado ✅
- [ ] Validación funciona correctamente ✅
- [ ] Mensajes de error son claros ✅
- [ ] Profesores saben cómo obtener el código ✅
- [ ] Testing completo realizado ✅
- [ ] Documentación actualizada ✅

---

## SIGUIENTE PASO

¿Quieres que proceda con la **FASE 1** (crear la migración SQL)?
