# Fix - Error al Registrar Nuevos Usuarios

## Problema

Error al registrar usuarios nuevos:
```
AuthApiError: Database error saving new user
```

## Causa

La RLS policy `"Only admins can insert profiles"` en la tabla `profiles` estaba bloqueando que el trigger `handle_new_user()` pudiera insertar el perfil del nuevo usuario.

**Explicación técnica:**
- Cuando un usuario se registra, el trigger `handle_new_user()` intenta crear un registro en `profiles`
- El trigger se ejecuta en el contexto del nuevo usuario (no es admin todavía)
- La policy antigua requería ser admin para insertar en `profiles`
- Resultado: El INSERT fallaba → Error 500

## Solución

Nueva migración que permite la inserción de perfiles durante el registro:

**Archivo:** `supabase/migrations/20251102000000_fix_profiles_insert_policy.sql`

**Cambios:**
1. Elimina policy antigua: `"Only admins can insert profiles"`
2. Crea nueva policy: `"Allow profile creation during signup"`
3. Nueva lógica:
   - ✅ Admins pueden insertar cualquier perfil
   - ✅ Usuarios pueden insertar SU PROPIO perfil (auth.uid() = id)
   - ❌ Usuarios NO pueden insertar perfiles de otros

## Cómo Aplicar

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Click en **SQL Editor** en el menú lateral
3. Copia y pega el contenido de: `supabase/migrations/20251102000000_fix_profiles_insert_policy.sql`
4. Click en **Run** / **Ejecutar**
5. Verifica que salga: "Success. No rows returned"

### Opción 2: Supabase CLI

```bash
npx supabase db push
```

## Verificación

Después de aplicar la migración, prueba registrar un nuevo usuario:

1. Ve a la página de registro
2. Completa el formulario:
   - Email: test@example.com
   - Nombre: Test User
   - Nivel: 1
   - Club: [Selecciona un club]
   - Contraseña: mínimo 6 caracteres
3. Click en "Crear Cuenta"
4. ✅ Debería crear el usuario correctamente sin error 500

## SQL de la Migración

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;

-- Create new policy that allows profile creation during signup
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR
    auth.uid() = id
  );
```

## Estado

- ⚠️ **PENDIENTE**: Aplicar migración en Supabase
- ✅ Migración creada y lista para aplicar
- ✅ Archivo commiteado al repositorio

---

**Nota:** Esta es una corrección crítica. Sin ella, NO se pueden registrar nuevos usuarios.
