# 🔍 Análisis del Problema: Pantalla en Blanco al Añadir Hijo

## Usuario Afectado
**ID:** `a1dce7a0-2b7d-4651-89f7-4157cdeb152e`

---

## 📋 Descripción del Problema

El usuario es un **guardian** que:
1. Inicia sesión correctamente
2. Navega a "Mis Hijos" (`/dashboard/my-children`)
3. Hace clic en "Añadir Hijo/a"
4. Rellena el formulario (nombre y nivel)
5. **AL GUARDAR**: La página se queda en blanco

---

## 🔄 Flujo Actual del Código

### 1. **Usuario hace clic en "Añadir Hijo/a"** ([MyChildrenPage.tsx:15-27](src/pages/MyChildrenPage.tsx#L15-L27))

```typescript
const handleAddChild = (data: any) => {
  addChild(data, {
    onSuccess: () => {
      setIsAddChildModalOpen(false);
      console.log('🔄 Reloading page to restore guardian session...');
      window.location.reload(); // ← AQUÍ SE RECARGA LA PÁGINA
    }
  });
};
```

### 2. **Se ejecuta la mutación `addChild`** ([useGuardianChildren.ts:125-251](src/hooks/useGuardianChildren.ts#L125-L251))

El hook hace lo siguiente:

**a) Guarda la sesión del guardian** (línea 143):
```typescript
const { data: { session: guardianSession } } = await supabase.auth.getSession();
```

**b) Crea el usuario hijo con `signUp()`** (línea 170):
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: childEmail,
  password: tempPassword,
  options: {
    data: {
      full_name: childData.fullName,
      club_id: profile.club_id,
      level: childData.level,
      role: 'player'
    }
  }
});
```

⚠️ **PROBLEMA POTENCIAL #1**: `signUp()` automáticamente cambia la sesión al nuevo usuario creado.

**c) Espera a que se cree el perfil** (línea 196):
```typescript
await new Promise(resolve => setTimeout(resolve, 250));
```

**d) Restaura la sesión del guardian** (línea 214):
```typescript
const { error: sessionError } = await supabase.auth.setSession({
  access_token: guardianSession.access_token,
  refresh_token: guardianSession.refresh_token
});
```

**e) Crea la relación en `account_dependents`** (línea 230):
```typescript
const { data: relationship, error: relationshipError } = await supabase
  .from('account_dependents')
  .insert({
    guardian_profile_id: guardianId,
    dependent_profile_id: newProfile.id,
    relationship_type: 'child',
    birth_date: null
  });
```

### 3. **Se ejecuta `onSuccess`** ([MyChildrenPage.tsx:17-25](src/pages/MyChildrenPage.tsx#L17-L25))

```typescript
onSuccess: () => {
  setIsAddChildModalOpen(false);
  console.log('🔄 Reloading page to restore guardian session...');
  window.location.reload(); // ← LA PÁGINA SE RECARGA AQUÍ
}
```

### 4. **La página se recarga** → **AuthPage se ejecuta**

Cuando se recarga la página, el router detecta que hay un usuario autenticado y ejecuta el `useEffect` de AuthPage (líneas 46-125).

### 5. **AuthPage verifica la cuenta** ([AuthPage.tsx:64-141](src/pages/AuthPage.tsx#L64-L141))

```typescript
const checkGuardianSetup = async () => {
  if (user && profile) {
    setIsVerifyingAccount(true); // ← MUESTRA PANTALLA DE CARGA

    // Safety timeout de 5 segundos
    timeoutId = setTimeout(() => {
      if (!hasRedirected) {
        console.warn('⏱️ Timeout reached, forcing redirect to dashboard');
        safeRedirect("/dashboard");
      }
    }, 5000);

    try {
      if (profile.role === 'guardian') {
        // Verifica si tiene hijos
        const { data: children, error: childrenError } = await supabase
          .from('account_dependents')
          .select('dependent_profile_id, guardian_profile_id')
          .eq('guardian_profile_id', user.id);

        if (childrenError) {
          console.error('Error fetching children, redirecting to dashboard:', childrenError);
          safeRedirect("/dashboard");
          return;
        }

        if (!children || children.length === 0) {
          safeRedirect("/guardian/setup");
          return;
        } else {
          safeRedirect("/dashboard"); // ← DEBERÍA REDIRIGIR AQUÍ
          return;
        }
      }
    } catch (error) {
      console.error('Exception checking guardian children:', error);
      safeRedirect("/dashboard");
      return;
    }
  }
};
```

---

## 🐛 **HIPÓTESIS DEL PROBLEMA**

### **Escenario 1: Sesión Incorrecta Después de `window.location.reload()`**

Después de llamar a `window.location.reload()`, es posible que:

1. La sesión en **Supabase Auth** sigue siendo la del **hijo recién creado** (no del guardian)
2. Cuando `AuthPage` se ejecuta, lee `user` y `profile` del contexto
3. El contexto lee la sesión de Supabase
4. **La sesión que lee es la del hijo, no del guardian** ❌

**Por qué ocurre esto:**
- `setSession()` restaura la sesión, PERO
- `window.location.reload()` reinicia completamente la aplicación
- Al reiniciarse, `AuthContext` lee la sesión de localStorage/cookies
- Si `signUp()` guardó la sesión del hijo en localStorage, esa es la que se lee

### **Escenario 2: Query RLS Falla al Verificar Children**

Cuando AuthPage intenta verificar si el guardian tiene hijos:

```typescript
const { data: children, error: childrenError } = await supabase
  .from('account_dependents')
  .select('dependent_profile_id, guardian_profile_id')
  .eq('guardian_profile_id', user.id); // ← user.id podría ser el ID del hijo
```

Si `user.id` es el ID del **hijo** (no del guardian):
- La query busca hijos del hijo (no tiene sentido)
- Retorna 0 resultados
- El código piensa que es un guardian sin hijos
- Redirige a `/guardian/setup`
- PERO el usuario ya no es guardian, es player (rol del hijo)
- Esto causa conflictos y pantalla en blanco

### **Escenario 3: Race Condition en `setSession()`**

Es posible que:
1. `setSession()` se llame (línea 214 del hook)
2. `onSuccess` se ejecute inmediatamente
3. `window.location.reload()` se ejecute **ANTES** de que `setSession()` se propague a localStorage
4. Al recargar, lee la sesión vieja (del hijo)

---

## 🔬 **EVIDENCIAS A BUSCAR**

Para confirmar cuál escenario está ocurriendo, necesitamos ver los logs del usuario:

### **En el navegador del usuario (Console):**

1. **Después de hacer clic en "Añadir Hijo":**
   ```
   🔍 Adding child: { fullName: "...", level: ... }
   🔍 Current user: <email> ID: <guardian_id>
   💾 Guardian session saved: <guardian_email>
   ✅ Created auth user: <child_id>
   ✅ Created child profile: <child_name>
   ✅ Guardian session restored
   ✅ Created relationship successfully - ready to reload
   🔄 Reloading page to restore guardian session...
   ```

2. **Después del reload (cuando se queda en blanco):**
   - ¿Qué user.id está logueado?
   - ¿Qué rol tiene el profile?
   - ¿Qué error aparece en la query de children?

### **En la base de datos:**

Ejecutar los queries del archivo `investigate_user_blank_screen.sql` para ver:
1. ¿El usuario tiene rol `guardian`?
2. ¿Tiene hijos registrados en `account_dependents`?
3. ¿Se creó correctamente el hijo?
4. ¿La relación guardian-hijo existe?

---

## 🎯 **POSIBLES SOLUCIONES** (NO IMPLEMENTAR AÚN)

### **Solución 1: No usar `window.location.reload()`**

En lugar de recargar toda la página, invalidar solo las queries necesarias:

```typescript
onSuccess: () => {
  setIsAddChildModalOpen(false);
  // No recargar, solo invalidar las queries
  queryClient.invalidateQueries({ queryKey: ['guardian-children'] });
  queryClient.refetchQueries({ queryKey: ['guardian-children'] });
}
```

**Problema:** La sesión del usuario sigue siendo la del hijo en Supabase Auth.

### **Solución 2: Asegurar que `setSession()` se complete antes de reload**

```typescript
// Después de setSession
await new Promise(resolve => setTimeout(resolve, 500)); // Esperar más tiempo
console.log('✅ Verified guardian session is active');
const { data: { user: currentUser } } = await supabase.auth.getUser();
console.log('🔍 Current user after restore:', currentUser?.email);

// Verificar que la sesión es correcta antes de continuar
if (currentUser?.id !== guardianId) {
  throw new Error('Failed to restore guardian session');
}
```

### **Solución 3: Usar Admin API en lugar de `signUp()`**

En lugar de usar `signUp()` (que cambia la sesión), usar el Admin API de Supabase (via Edge Function) para crear usuarios sin afectar la sesión actual.

**Ventaja:** No cambia la sesión del guardian.
**Desventaja:** Requiere implementar una Edge Function.

### **Solución 4: Redirigir explícitamente después de reload**

En lugar de confiar en que AuthPage redirija correctamente, forzar la redirección:

```typescript
onSuccess: () => {
  setIsAddChildModalOpen(false);
  // Guardar en localStorage que debe ir a my-children después del reload
  localStorage.setItem('redirectAfterReload', '/dashboard/my-children');
  console.log('🔄 Reloading page to restore guardian session...');
  window.location.reload();
}
```

Y en AuthPage, después de verificar la sesión:
```typescript
const redirectPath = localStorage.getItem('redirectAfterReload');
if (redirectPath) {
  localStorage.removeItem('redirectAfterReload');
  safeRedirect(redirectPath);
  return;
}
```

---

## 📊 **QUERY PARA INVESTIGAR EN SUPABASE**

Ejecutar esto en el SQL Editor de Supabase para ver el estado del usuario:

```sql
-- Ver información del usuario
SELECT
  'User Info' as type,
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE u.id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'

UNION ALL

-- Ver perfil
SELECT
  'Profile' as type,
  p.id,
  p.full_name as email,
  p.role as created_at,
  p.club_id::text as last_sign_in_at
FROM profiles p
WHERE p.id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'

UNION ALL

-- Ver hijos
SELECT
  'Children' as type,
  ad.dependent_profile_id as id,
  p.full_name as email,
  p.role as created_at,
  ad.created_at::text as last_sign_in_at
FROM account_dependents ad
LEFT JOIN profiles p ON p.id = ad.dependent_profile_id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';
```

---

## 🚨 **PRÓXIMOS PASOS**

1. **NO HACER CAMBIOS** todavía
2. **Ejecutar los queries SQL** para ver el estado del usuario
3. **Pedir al usuario que comparta los logs de consola** cuando reproduce el problema
4. **Ver si el timeout de 5 segundos se activa** (si se activa, significa que AuthPage se está ejecutando pero no puede redirigir)
5. **Verificar qué sesión está activa** después del reload

---

## 💡 **INFORMACIÓN ADICIONAL**

### ¿Por qué usamos `window.location.reload()`?

Originalmente se implementó porque:
- `setSession()` cambia la sesión en Supabase
- PERO el `AuthContext` de React no se actualiza automáticamente
- Se necesitaba forzar la reinicialización completa de la app
- El reload garantiza que todo se reinicie con la sesión correcta

### ¿Por qué hay un safety timeout de 5 segundos?

Se añadió para prevenir exactamente este problema:
- Si algo falla en la verificación de la cuenta
- El usuario no se quede con pantalla en blanco para siempre
- Después de 5 segundos, fuerza la redirección al dashboard

Si el usuario está viendo pantalla en blanco **por más de 5 segundos**, significa que:
- O el timeout no se está ejecutando (bug en el código)
- O algo está impidiendo que el código llegue al timeout
- O la página no se está recargando correctamente

---

## 📝 **CONCLUSIÓN**

El problema más probable es que **la sesión no se está restaurando correctamente antes del reload**, o que **el reload está leyendo la sesión incorrecta de localStorage**.

**Para confirmar:** Necesitamos ver los logs de consola del usuario cuando reproduce el problema.
**Para resolver:** Probablemente necesitemos implementar una de las soluciones propuestas arriba, pero primero debemos confirmar cuál es la causa exacta.
