# Fix RLS Infinite Recursion - Instrucciones

## 🔴 Problema
Error: `infinite recursion detected in policy for relation "class_participants"`

## 🎯 Causa Raíz
Las políticas RLS crean un ciclo:
1. Query a `programmed_classes` con JOIN a `class_participants`
2. Política de `programmed_classes` verifica acceso
3. JOIN ejecuta query a `class_participants`
4. Política de `class_participants` intenta verificar acceso en `programmed_classes`
5. **LOOP INFINITO** ♾️

## ✅ Solución

### Paso 1: Ejecutar el script SQL

1. **Abre Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a SQL Editor** (en el menú lateral)
4. **Abre el archivo**: `FINAL_FIX_RLS.sql`
5. **Copia TODO el contenido** del archivo
6. **Pega en SQL Editor**
7. **Click en "Run"** o presiona `Ctrl+Enter`

### Paso 2: Verificar que funcionó

El script al final muestra una tabla con todas las políticas. Deberías ver:

**En `class_participants`:**
- `players_view_own_participations` (SELECT)
- `players_update_own_attendance` (UPDATE)
- `trainers_manage_own_class_participants` (ALL)
- `club_admins_manage_all_participants` (ALL)

**En `programmed_classes`:**
- Las políticas existentes de trainers y admins
- `authenticated_users_can_view_classes` (nueva - permite lectura sin recursión)

### Paso 3: Probar en la aplicación

1. **Recarga la aplicación** (F5)
2. **Inicia sesión como jugador** (juan@email.com)
3. **Verifica que se muestran**:
   - ✅ Clases de hoy
   - ✅ Clases programadas
4. **Inicia sesión como admin**
5. **Verifica que se muestran**:
   - ✅ Todas las clases en "Clases Programadas"

## 📋 Archivos Creados

1. **`FINAL_FIX_RLS.sql`** - Script principal (USAR ESTE)
2. `fix_rls_nuclear_option.sql` - Alternativa (backup)
3. `temporary_disable_rls.sql` - Solo para debug (NO usar en producción)
4. `check_all_rls_policies.sql` - Para verificar estado actual
5. `debug_rls_policies.sql` - Para debugging

## 🔧 Qué hace la solución

### En `class_participants`:
- Crea función `is_my_enrollment()` con `SECURITY DEFINER` que **bypasea RLS**
- Usa esta función en las políticas para evitar recursión
- Permite a jugadores ver/actualizar solo sus propios registros
- Permite a trainers y admins gestionar participantes

### En `programmed_classes`:
- **ELIMINA** cualquier política que haga referencia a `class_participants`
- Agrega política simple que permite lectura a usuarios autenticados
- El filtrado real ocurre a nivel de `class_participants` en el JOIN

## ⚠️ Si aún no funciona

### Opción A: Debug
Ejecuta `check_all_rls_policies.sql` y envíame el resultado para ver qué políticas están activas.

### Opción B: Deshabilitar RLS temporalmente
```sql
ALTER TABLE public.class_participants DISABLE ROW LEVEL SECURITY;
```
⚠️ **SOLO PARA TESTING** - Permite acceso completo a todos

### Opción C: Verificar función
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'is_my_enrollment';
```

## 📞 Soporte
Si el error persiste después de ejecutar `FINAL_FIX_RLS.sql`, necesitamos:
1. Resultado de `check_all_rls_policies.sql`
2. Screenshot del error en consola
3. Usuario con el que estás probando (juan@email.com o admin)
