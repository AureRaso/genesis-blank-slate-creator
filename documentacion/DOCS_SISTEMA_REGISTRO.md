# Sistema de Registro y Autenticación

## Índice
1. [Introducción](#introducción)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Tipos de Usuario](#tipos-de-usuario)
4. [Flujo de Registro Manual (Email/Password)](#flujo-de-registro-manual-emailpassword)
5. [Flujo de Registro Social (Google OAuth)](#flujo-de-registro-social-google-oauth)
6. [Flujo de Registro de Guardian (Padre/Madre)](#flujo-de-registro-de-guardian-padremadre)
7. [Sistema de Teléfono Internacional](#sistema-de-teléfono-internacional)
8. [Modal de Completar Teléfono](#modal-de-completar-teléfono)
9. [Hooks y Componentes](#hooks-y-componentes)
10. [Casos de Uso Comunes](#casos-de-uso-comunes)
11. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de registro y autenticación permite a los usuarios crear cuentas y acceder a PadeLock. Soporta múltiples métodos de autenticación y tipos de usuario:

1. **Registro Manual**: Email y contraseña con todos los datos
2. **Registro Social**: Google OAuth (requiere completar perfil después)
3. **Tipos de Usuario**: Jugador (player) y Guardian (padre/madre)

---

## Arquitectura de Base de Datos

### Tabla: `profiles`

**Propósito**: Almacena información del perfil del usuario autenticado.

**Campos clave**:
```sql
- id: UUID (Primary Key, igual que auth.users.id)
- email: TEXT
- full_name: TEXT
- phone: TEXT
- level: INTEGER (1-10, por defecto 5)
- role: TEXT ('player', 'guardian', 'trainer', 'admin', 'owner')
- club_id: UUID (Foreign Key a clubs)
- avatar_url: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Trigger automático**: `handle_new_user()` - Crea automáticamente un registro en `profiles` cuando se crea un usuario en `auth.users`.

---

### Tabla: `student_enrollments`

**Propósito**: Representa la matrícula de un jugador en el sistema del club.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- email: TEXT
- full_name: TEXT
- phone: TEXT
- level: INTEGER
- club_id: UUID (Foreign Key a clubs)
- trainer_profile_id: UUID (Foreign Key a profiles)
- created_by_profile_id: UUID (Foreign Key a profiles)
- student_profile_id: UUID (Foreign Key a profiles, nullable)
- status: TEXT ('active', 'inactive')
- created_at: TIMESTAMPTZ
```

**Uso**:
- Se crea durante el registro manual automáticamente
- Se crea en `CompleteProfile` para registros de Google OAuth
- Vincula al jugador con su club y entrenador

---

### Tabla: `account_dependents`

**Propósito**: Vincula cuentas de guardians (padres) con sus hijos.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- guardian_profile_id: UUID (Foreign Key a profiles)
- dependent_profile_id: UUID (Foreign Key a profiles)
- relationship: TEXT ('parent', 'legal_guardian')
- created_at: TIMESTAMPTZ
```

**Uso**:
- Se crea cuando un guardian añade un hijo
- Permite a los padres gestionar las clases de sus hijos

---

### Tabla: `lopivi_consents`

**Propósito**: Registra el consentimiento LOPIVI (Protección de la Infancia) para guardians.

**Campos clave**:
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key a auth.users)
- consent_given: BOOLEAN
- ip_address: TEXT
- user_agent: TEXT
- document_version: TEXT
- created_at: TIMESTAMPTZ
```

---

## Tipos de Usuario

### 1. Player (Jugador)

**Características**:
- Usuario que participa en clases de pádel
- Necesita: email, contraseña, nombre, teléfono, código de club
- Nivel por defecto: 5 (intermedio)
- Se crea automáticamente `student_enrollment`

**Flujo post-registro**:
```
Registro → Dashboard (si perfil completo)
         → Complete Profile (si falta club_id o level)
```

### 2. Guardian (Padre/Madre)

**Características**:
- Usuario que gestiona cuentas de hijos menores
- Necesita: email, contraseña, nombre, teléfono, código de club
- Debe aceptar Protocolo LOPIVI
- Nivel por defecto: 1 (no participa en clases)

**Flujo post-registro**:
```
Registro → Guardian Setup (añadir hijos)
         → Dashboard
```

---

## Flujo de Registro Manual (Email/Password)

### Vista General

**Página**: `/auth`
**Componente**: `AuthPage.tsx`
**Tab**: "Registrarse"

### Campos del Formulario

| Campo | Tipo | Validación | Obligatorio |
|-------|------|------------|-------------|
| Tipo de usuario | Radio (player/guardian) | - | Sí |
| Nombre y Apellidos | Text | - | Sí |
| Teléfono | PhoneInput | País + dígitos | Sí |
| Email | Email | Formato válido | Sí |
| Confirmar Email | Email | Debe coincidir | Sí |
| Contraseña | Password | Mín. 6 caracteres | Sí |
| Confirmar Contraseña | Password | Debe coincidir | Sí |
| Código de Club | ClubCodeInput | 3 letras válidas | Sí |
| Términos y Condiciones | Checkbox | Debe aceptar | Sí |
| LOPIVI (solo guardian) | Checkbox | Debe aceptar | Sí (guardian) |

### Flujo de Datos

```
[Usuario completa formulario]
       ↓
[Validaciones en cliente]
  - Emails coinciden
  - Contraseñas coinciden
  - Código de club válido
  - LOPIVI aceptado (si guardian)
       ↓
[AuthContext.signUp()]
       ↓
[Supabase Auth signUp]
  userData: {
    full_name,
    phone,
    club_id,
    level: 5 (player) / 1 (guardian),
    role: 'player' | 'guardian'
  }
       ↓
[Trigger: handle_new_user()]
  - Crea registro en profiles
  - Crea registro en student_enrollments
       ↓
[Si guardian: Guardar consentimiento LOPIVI]
       ↓
[Redirección automática]
  - Player → /dashboard
  - Guardian → /guardian/setup
```

### Código Clave - `handleSignUp()`

```typescript
// AuthPage.tsx - línea 230
const handleSignUp = async (e: React.FormEvent) => {
  // Validaciones...

  // Nivel por defecto según tipo de usuario
  const numLevel = userType === 'player' ? 5 : 1;

  // Llamar a signUp del contexto
  const { error, data } = await signUp(
    email,
    password,
    fullName,
    phone,
    selectedClubId,
    numLevel,
    userType
  );

  // Si es guardian, guardar consentimiento LOPIVI
  if (userType === 'guardian' && lopiviAccepted && data?.user) {
    await supabase.from('lopivi_consents').insert({
      user_id: data.user.id,
      consent_given: true,
      ip_address: window.location.hostname,
      user_agent: navigator.userAgent,
      document_version: 'v1.0'
    });
  }
};
```

### Código Clave - `AuthContext.signUp()`

```typescript
// AuthContext.tsx - línea 329
const signUp = async (
  email: string,
  password: string,
  fullName: string,
  phone: string,
  clubId?: string,
  level?: number,
  role: 'player' | 'guardian' = 'player'
) => {
  const userData = {
    full_name: fullName,
    phone: phone,
    club_id: clubId,
    level: level,
    role: role
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: userData
    }
  });

  return { error };
};
```

---

## Flujo de Registro Social (Google OAuth)

### Vista General

Google OAuth permite crear cuenta/iniciar sesión con un clic, pero requiere completar datos adicionales después.

### Flujo de Datos

```
[Usuario hace clic en "Continuar con Google"]
       ↓
[AuthContext.signInWithGoogle()]
       ↓
[Redirección a Google]
  - Usuario autoriza acceso
       ↓
[Callback: /auth/callback]
  - Supabase procesa tokens
       ↓
[AuthCallback.tsx]
  - Verifica si perfil está completo
       ↓
[¿Tiene club_id y level?]
  - NO → /complete-profile
  - SÍ → /dashboard
```

### Código Clave - `signInWithGoogle()`

```typescript
// AuthContext.tsx - línea 308
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      // Metadata por defecto para nuevos usuarios
      data: {
        level: 5,
        role: 'player'
      }
    }
  });
  return { error };
};
```

### Página: Complete Profile

**Ruta**: `/complete-profile`
**Componente**: `CompleteProfile.tsx`

**Propósito**: Recoger datos faltantes después de Google OAuth.

**Campos**:
| Campo | Descripción |
|-------|-------------|
| Info de usuario | Muestra nombre/email de Google (solo lectura) |
| Teléfono | PhoneInput con selector de país |
| Nivel | Automático: 5 (informativo) |
| Código de Club | 3 letras del club |

**Flujo**:
```
[Usuario completa formulario]
       ↓
[Validar teléfono y código de club]
       ↓
[UPDATE profiles]
  - club_id
  - level: 5
  - phone
       ↓
[¿Existe student_enrollment?]
  - NO → Buscar trainer del club
       → INSERT student_enrollments
  - SÍ → Skip
       ↓
[Redirect → /dashboard]
```

### Código Clave - `CompleteProfile.handleSubmit()`

```typescript
// CompleteProfile.tsx - línea 69
const handleSubmit = async (e: React.FormEvent) => {
  const numLevel = 5;

  // 1. Update profile
  await supabase.from('profiles').update({
    club_id: selectedClubId,
    level: numLevel,
    phone: phone,
    updated_at: new Date().toISOString()
  }).eq('id', user!.id);

  // 2. Check if enrollment exists
  const { data: existingEnrollment } = await supabase
    .from('student_enrollments')
    .select('id')
    .eq('email', user!.email!)
    .maybeSingle();

  // 3. Create enrollment if needed
  if (!existingEnrollment) {
    // Find trainer for club
    const { data: trainerClubs } = await supabase
      .from('trainer_clubs')
      .select('trainer_profile_id')
      .eq('club_id', selectedClubId)
      .limit(1);

    let trainerId = trainerClubs?.[0]?.trainer_profile_id;

    // Fallback: find trainer in profiles
    if (!trainerId) {
      const { data: trainers } = await supabase
        .from('profiles')
        .select('id')
        .eq('club_id', selectedClubId)
        .eq('role', 'trainer')
        .limit(1);
      trainerId = trainers?.[0]?.id;
    }

    // Create enrollment
    await supabase.from('student_enrollments').insert({
      trainer_profile_id: trainerId,
      created_by_profile_id: user!.id,
      email: user!.email!,
      full_name: user!.user_metadata?.full_name || user!.email!,
      phone: phone,
      level: numLevel,
      club_id: selectedClubId,
      status: 'active'
    });
  }

  window.location.href = "/dashboard";
};
```

---

## Flujo de Registro de Guardian (Padre/Madre)

### Vista General

Los guardians (padres/madres) registran primero su cuenta y luego añaden perfiles de sus hijos.

### Diferencias con Registro de Player

| Aspecto | Player | Guardian |
|---------|--------|----------|
| Nivel por defecto | 5 | 1 |
| LOPIVI requerido | No | Sí |
| Post-registro | Dashboard | Guardian Setup |
| Student enrollment | Para sí mismo | Para cada hijo |

### Flujo Completo

```
[Registro como Guardian]
       ↓
[Aceptar LOPIVI]
       ↓
[Guardar consentimiento en lopivi_consents]
       ↓
[Redirección → /guardian/setup]
       ↓
[GuardianSetupPage]
  - Ver hijos añadidos (inicialmente vacío)
  - Botón "Añadir Hijo/a"
       ↓
[AddChildModal]
  - Nombre del hijo
  - Fecha de nacimiento
  - Código de club
  - Nivel (opcional)
       ↓
[useGuardianChildren.addChild()]
  - Crear profile para el hijo (role: 'player')
  - Crear student_enrollment
  - Crear account_dependents (vincular hijo-padre)
       ↓
[Repetir para más hijos o "No añadir más hijos"]
       ↓
[Redirección → /dashboard]
```

### Página: Guardian Setup

**Ruta**: `/guardian/setup`
**Componente**: `GuardianSetupPage.tsx`

**Funcionalidades**:
- Listar hijos ya añadidos
- Añadir nuevos hijos
- Omitir y continuar al dashboard

### Código Clave - `GuardianSetupPage`

```typescript
// GuardianSetupPage.tsx
const GuardianSetupPage = () => {
  const { children, addChild, isAddingChild } = useGuardianChildren();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  const handleAddChild = (data: any) => {
    addChild(data, {
      onSuccess: () => {
        setIsAddChildModalOpen(false);
        // Recargar para mantener sesión del guardian
        window.location.reload();
      }
    });
  };

  const handleFinishSetup = () => {
    window.location.href = '/dashboard';
  };

  // ...render
};
```

### Redirección Automática en AuthPage

```typescript
// AuthPage.tsx - useEffect para redirección
const checkGuardianSetup = async () => {
  if (user && profile) {
    if (profile.role === 'guardian') {
      // Verificar si tiene hijos
      const { data: children } = await supabase
        .from('account_dependents')
        .select('dependent_profile_id')
        .eq('guardian_profile_id', user.id);

      if (!children || children.length === 0) {
        navigate("/guardian/setup");
        return;
      }
    }
    navigate("/dashboard");
  }
};
```

---

## Sistema de Teléfono Internacional

### Componente: `PhoneInput`

**Archivo**: `src/components/PhoneInput.tsx`

**Características**:
- Selector de país integrado en el input
- Validación específica por país
- Almacenamiento diferencial (España sin prefijo, resto con prefijo)

### Países Soportados (38 países)

| Región | Países |
|--------|--------|
| Europa Occidental | España, Francia, Reino Unido, Portugal, Alemania, Italia, Países Bajos, Bélgica, Suiza, Austria, Irlanda |
| Europa del Este | Polonia, Rumanía, República Checa, Hungría, Ucrania, Grecia |
| Nórdicos | Suecia, Noruega, Dinamarca, Finlandia |
| América del Norte | Estados Unidos, Canadá, México |
| América del Sur | Argentina, Brasil, Chile, Colombia, Perú, Venezuela, Uruguay |
| Asia | China, Japón, India |
| Oceanía | Australia, Nueva Zelanda |
| África | Sudáfrica, Marruecos |

### Configuración por País

```typescript
const COUNTRIES = [
  {
    code: "ES",
    name: "España",
    flag: "🇪🇸",
    prefix: "+34",
    minDigits: 9,
    maxDigits: 9,
    startsWithPattern: /^[67]/  // Solo España: debe empezar por 6 o 7
  },
  {
    code: "FR",
    name: "Francia",
    flag: "🇫🇷",
    prefix: "+33",
    minDigits: 9,
    maxDigits: 9
  },
  // ...más países
];
```

### Lógica de Almacenamiento

```typescript
const formatPhoneForStorage = (phoneNumber: string, country: Country): string => {
  const digits = phoneNumber.replace(/\D/g, '');

  // Para España: guardar SIN prefijo
  if (country.code === "ES") {
    return digits; // Ej: "620573524"
  }

  // Para cualquier otro país: guardar CON prefijo
  return country.prefix + digits; // Ej: "+33612345678"
};
```

### UI del Componente

```
┌────────┬────────────────────────┐
│ +34 ▼  │ 612345678              │
└────────┴────────────────────────┘
Introduce tu número sin el prefijo +34
```

Al hacer clic en el prefijo, se despliega lista completa:
```
🇪🇸 España (+34)
🇫🇷 Francia (+33)
🇬🇧 Reino Unido (+44)
🇺🇦 Ucrania (+380)
...
```

---

## Modal de Completar Teléfono

### Componente: `PhoneRequiredModal`

**Archivo**: `src/components/PhoneRequiredModal.tsx`

**Propósito**: Modal bloqueante que aparece para usuarios existentes que no tienen teléfono válido.

### Condiciones para Mostrar

```typescript
const needsPhoneUpdate = !currentPhone || currentPhone === '' || currentPhone === '000000000';
const showModal = needsPhoneUpdate && !phoneWasUpdated;
```

### Características

- **Bloqueante**: No se puede cerrar sin completar
- **Consentimiento WhatsApp**: Obligatorio aceptar
- **Actualiza ambas tablas**: `student_enrollments` y `profiles`

### Integración en PlayerDashboard

```typescript
// PlayerDashboard.tsx
{enrollment && profile?.email && (
  <PhoneRequiredModal
    studentEnrollmentId={enrollment.id}
    currentPhone={enrollment.phone}
    studentEmail={profile.email}
    onPhoneUpdated={handlePhoneUpdated}
  />
)}
```

---

## Hooks y Componentes

### Contexto de Autenticación

**Archivo**: `src/contexts/AuthContext.tsx`

| Función | Propósito |
|---------|-----------|
| `signIn(email, password)` | Login con email/password |
| `signInWithGoogle()` | Login/registro con Google |
| `signUp(email, password, ...)` | Registro manual |
| `signOut()` | Cerrar sesión |
| `retryAuth()` | Reintentar carga de perfil |

| Estado | Descripción |
|--------|-------------|
| `user` | Usuario de Supabase Auth |
| `profile` | Perfil de la tabla profiles |
| `loading` | Cargando autenticación |
| `authError` | Error de autenticación |
| `isAdmin/isPlayer/isTrainer/isGuardian` | Roles del usuario |

### Componentes Principales

| Componente | Ruta | Propósito |
|------------|------|-----------|
| `AuthPage.tsx` | `/auth` | Login y registro |
| `AuthCallback.tsx` | `/auth/callback` | Callback de OAuth |
| `CompleteProfile.tsx` | `/complete-profile` | Completar perfil Google |
| `GuardianSetupPage.tsx` | `/guardian/setup` | Añadir hijos |
| `PhoneInput.tsx` | - | Input de teléfono internacional |
| `PhoneRequiredModal.tsx` | - | Modal bloqueante de teléfono |
| `ClubCodeInput.tsx` | - | Input de código de club |
| `AddChildModal.tsx` | - | Modal para añadir hijo |
| `LopiviModal.tsx` | - | Modal de consentimiento LOPIVI |

---

## Casos de Uso Comunes

### Caso 1: Jugador se registra manualmente

**Escenario**: María quiere registrarse como jugadora en el club "ABC".

**Pasos**:
1. María accede a `/auth`
2. Selecciona tab "Registrarse"
3. Selecciona "Soy jugador/a"
4. Completa: nombre, teléfono (+34 612345678), email, contraseña
5. Introduce código de club: ABC
6. Acepta términos y condiciones
7. Clic en "Crear Cuenta"

**Resultado**:
- ✅ `auth.users` - Nuevo usuario creado
- ✅ `profiles` - Nuevo perfil con role='player', level=5
- ✅ `student_enrollments` - Nueva matrícula vinculada al club
- ✅ Redirección a `/dashboard`

---

### Caso 2: Jugador se registra con Google

**Escenario**: Juan usa Google para registrarse.

**Pasos**:
1. Juan accede a `/auth`
2. Clic en "Continuar con Google"
3. Autoriza en Google
4. Redirigido a `/complete-profile`
5. Completa: teléfono, código de club
6. Clic en "Completar Perfil"

**Resultado**:
- ✅ `auth.users` - Usuario creado por Google
- ✅ `profiles` - Perfil actualizado con club_id, level, phone
- ✅ `student_enrollments` - Nueva matrícula creada
- ✅ Redirección a `/dashboard`

---

### Caso 3: Padre registra cuenta y añade hijos

**Escenario**: Pedro es padre de dos niños que juegan al pádel.

**Pasos**:
1. Pedro accede a `/auth`
2. Selecciona "Soy padre/madre"
3. Completa datos personales
4. Acepta LOPIVI
5. Crea cuenta
6. Redirigido a `/guardian/setup`
7. Clic en "Añadir Hijo/a"
8. Completa datos del primer hijo
9. Repite para el segundo hijo
10. Clic en "No añadir más hijos"

**Resultado**:
- ✅ `profiles` (Pedro) - role='guardian', level=1
- ✅ `lopivi_consents` - Consentimiento registrado
- ✅ `profiles` (Hijo 1) - role='player'
- ✅ `profiles` (Hijo 2) - role='player'
- ✅ `student_enrollments` - Una por cada hijo
- ✅ `account_dependents` - Dos registros vinculando hijos a Pedro
- ✅ Redirección a `/dashboard`

---

### Caso 4: Usuario existente sin teléfono

**Escenario**: Ana se registró antes de implementar el teléfono obligatorio.

**Flujo**:
1. Ana inicia sesión
2. `PlayerDashboard` detecta `phone = null`
3. Se muestra `PhoneRequiredModal`
4. Ana no puede usar la app hasta completar
5. Selecciona país e introduce teléfono
6. Acepta comunicaciones WhatsApp
7. Clic en "Guardar y continuar"

**Resultado**:
- ✅ `student_enrollments.phone` actualizado
- ✅ `profiles.phone` actualizado
- ✅ Modal se cierra
- ✅ Usuario puede usar la app normalmente

---

## Troubleshooting

### Problema 1: Usuario de Google no puede completar perfil

**Síntomas**:
- Usuario inicia con Google
- Error al guardar en `/complete-profile`

**Diagnóstico**:
```sql
-- Verificar que existe el profile
SELECT * FROM profiles WHERE id = 'USER_ID';

-- Verificar permisos RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Causas posibles**:
1. Trigger `handle_new_user()` no se ejecutó
2. RLS policies bloquean UPDATE

**Solución**:
1. Verificar que el trigger existe y está activo
2. Crear profile manualmente si falta:
   ```sql
   INSERT INTO profiles (id, email, role, level)
   VALUES ('USER_ID', 'email@example.com', 'player', 5);
   ```

---

### Problema 2: Guardian no puede añadir hijos

**Síntomas**:
- Guardian accede a `/guardian/setup`
- Error al añadir hijo

**Diagnóstico**:
```sql
-- Verificar rol del guardian
SELECT role FROM profiles WHERE id = 'GUARDIAN_ID';

-- Verificar que no existe el hijo
SELECT * FROM profiles WHERE email = 'hijo@email.com';
```

**Causas posibles**:
1. Email del hijo ya existe en el sistema
2. RLS policies bloquean INSERT
3. Código de club inválido

**Solución**:
1. Verificar que el email del hijo no está en uso
2. Revisar logs de consola para error específico

---

### Problema 3: Teléfono no se valida correctamente

**Síntomas**:
- Usuario introduce teléfono válido
- Sistema rechaza como inválido

**Diagnóstico**:
- Verificar país seleccionado
- Verificar número de dígitos
- Para España: verificar que empieza por 6 o 7

**Causas posibles**:
1. País incorrecto seleccionado
2. Número no cumple validación específica del país
3. Caracteres no numéricos

**Solución**:
1. Verificar configuración del país en `COUNTRIES`
2. Asegurar que `startsWithPattern` es correcto (solo España)

---

### Problema 4: Redirección incorrecta después de login

**Síntomas**:
- Usuario hace login
- No redirige correctamente

**Diagnóstico**:
```javascript
// Verificar en consola del navegador
console.log('Profile:', profile);
console.log('Role:', profile?.role);
console.log('Club ID:', profile?.club_id);
console.log('Level:', profile?.level);
```

**Causas posibles**:
1. Perfil incompleto (falta club_id o level)
2. Rol no reconocido
3. Cache de sesión corrupto

**Solución**:
1. Verificar que `profile.club_id` y `profile.level` existen
2. Limpiar localStorage y volver a iniciar sesión
3. Verificar lógica de redirección en `AuthPage.tsx`

---

## Archivos de Referencia

### Páginas
- `src/pages/AuthPage.tsx` - Login y registro
- `src/pages/AuthCallback.tsx` - Callback OAuth
- `src/pages/CompleteProfile.tsx` - Completar perfil Google
- `src/pages/GuardianSetupPage.tsx` - Setup de guardian

### Componentes
- `src/components/PhoneInput.tsx` - Input teléfono internacional
- `src/components/PhoneRequiredModal.tsx` - Modal teléfono obligatorio
- `src/components/ClubCodeInput.tsx` - Input código club
- `src/components/AddChildModal.tsx` - Modal añadir hijo
- `src/components/LopiviModal.tsx` - Modal LOPIVI

### Contexto
- `src/contexts/AuthContext.tsx` - Contexto de autenticación

### Hooks
- `src/hooks/useGuardianChildren.ts` - Gestión de hijos
- `src/hooks/useCurrentUserEnrollment.ts` - Matrícula del usuario actual

---

## Diagrama de Flujo Completo

### Registro Manual - Player

```
[Usuario en /auth]
       ↓
[Selecciona "Soy jugador/a"]
       ↓
[Completa formulario]
       ↓
[AuthContext.signUp()]
       ↓
[Supabase.auth.signUp()]
       ↓
[Trigger: handle_new_user()]
   ├── INSERT profiles
   └── INSERT student_enrollments
       ↓
[onAuthStateChange detecta nuevo usuario]
       ↓
[fetchProfile()]
       ↓
[AuthPage useEffect]
   ├── ¿club_id && level? → /dashboard
   └── else → /complete-profile
```

### Registro Social - Google

```
[Usuario en /auth]
       ↓
[Clic "Continuar con Google"]
       ↓
[signInWithGoogle()]
       ↓
[Redirección a Google]
       ↓
[Usuario autoriza]
       ↓
[Callback: /auth/callback]
       ↓
[Supabase procesa tokens]
       ↓
[AuthCallback.tsx]
   ├── Usuario nuevo → profile sin club_id
   └── Usuario existente → profile con datos
       ↓
[¿club_id && level?]
   ├── NO → /complete-profile
   └── SÍ → /dashboard
```

### Registro Guardian

```
[Usuario en /auth]
       ↓
[Selecciona "Soy padre/madre"]
       ↓
[Acepta LOPIVI]
       ↓
[AuthContext.signUp(role='guardian')]
       ↓
[INSERT lopivi_consents]
       ↓
[AuthPage useEffect]
       ↓
[checkGuardianSetup()]
   └── ¿Tiene hijos?
       ├── NO → /guardian/setup
       └── SÍ → /dashboard
       ↓
[GuardianSetupPage]
       ↓
[addChild() por cada hijo]
   ├── INSERT profiles (hijo)
   ├── INSERT student_enrollments
   └── INSERT account_dependents
       ↓
[Clic "No añadir más hijos"]
       ↓
[/dashboard]
```

---

**Última actualización**: 2025-12-05
**Mantenedor**: Equipo de desarrollo
**Versión**: 1.0
