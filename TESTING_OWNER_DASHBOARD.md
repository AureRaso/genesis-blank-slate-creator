# TESTING OWNER DASHBOARD - Sprint 1

## ✅ SPRINT 1 COMPLETADO

Hemos implementado los siguientes cambios:

1. ✅ Migración SQL: Rol 'owner' agregado a la base de datos
2. ✅ Políticas RLS: Owners pueden leer todos los datos del sistema
3. ✅ Componente OwnerProtectedRoute: Protección de rutas para owners
4. ✅ Página OwnerDashboard: Dashboard básico con placeholders
5. ✅ Rutas en App.tsx: Rutas `/owner` configuradas
6. ✅ AuthContext: Helper `isOwner` agregado

---

## 🔍 FASE DE TESTING

### OBJETIVO PRINCIPAL
**Verificar que NINGUNA funcionalidad existente se ha visto afectada** y que el nuevo panel de owner funciona correctamente.

---

## PASO 1: Verificar Funcionalidad Existente (CRÍTICO)

### 1.1. Test de Login de PLAYER

1. Abre la aplicación en el navegador
2. Haz login con credenciales de un **player** (jugador)
3. **Verifica**:
   - ✅ Login exitoso
   - ✅ Redirección a `/dashboard`
   - ✅ Dashboard de player se muestra correctamente
   - ✅ Menú lateral tiene opciones de player
   - ✅ NO hay errores en consola del navegador
   - ✅ Puede ver "Mis Clases"
   - ✅ Puede navegar por todas las secciones de player

**Resultado esperado**: Todo funciona EXACTAMENTE como antes.

---

### 1.2. Test de Login de TRAINER

1. Haz logout
2. Haz login con credenciales de un **trainer** (entrenador)
3. **Verifica**:
   - ✅ Login exitoso
   - ✅ Redirección a `/dashboard`
   - ✅ Dashboard de trainer se muestra correctamente
   - ✅ Puede ver sus alumnos
   - ✅ Puede ver clases programadas
   - ✅ Puede marcar asistencias
   - ✅ NO hay errores en consola del navegador
   - ✅ Todas las funcionalidades de trainer funcionan

**Resultado esperado**: Todo funciona EXACTAMENTE como antes.

---

### 1.3. Test de Login de ADMIN

1. Haz logout
2. Haz login con credenciales de un **admin**
3. **Verifica**:
   - ✅ Login exitoso
   - ✅ Redirección a `/dashboard`
   - ✅ Dashboard de admin se muestra correctamente
   - ✅ Puede ver clubes
   - ✅ Puede ver jugadores
   - ✅ Puede ver entrenadores
   - ✅ Puede programar clases
   - ✅ Puede crear alumnos
   - ✅ NO hay errores en consola del navegador
   - ✅ Todas las funcionalidades de admin funcionan

**Resultado esperado**: Todo funciona EXACTAMENTE como antes.

---

### 1.4. Test de Registro con Google OAuth

1. Haz logout
2. Crea una nueva cuenta usando Google OAuth
3. Completa el perfil con club y nivel
4. **Verifica**:
   - ✅ Registro exitoso
   - ✅ Perfil completado correctamente
   - ✅ Usuario aparece en la lista de alumnos del club
   - ✅ `student_enrollments` se creó correctamente
   - ✅ NO hay errores en consola del navegador

**Resultado esperado**: El bug de registro con Google OAuth sigue arreglado.

---

## PASO 2: Promover Admin a Owner

Una vez verificado que TODO lo anterior funciona correctamente, procede a promover un admin a owner:

1. Abre el **SQL Editor** de Supabase
2. Abre el archivo `promote_admin_to_owner.sql`
3. **Ejecuta la consulta de OPCIÓN 1** para ver los admins disponibles:

```sql
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
```

4. **Elige un admin** para promover (anota su email)
5. **Reemplaza 'admin@email.com'** en las consultas 2.1, 2.2 y 2.3 con el email elegido
6. **Ejecuta las consultas en orden**:
   - 2.1. Verificar usuario
   - 2.2. Promover a owner
   - 2.3. Verificar promoción

---

## PASO 3: Test de Panel de Owner

### 3.1. Login como Owner

1. **Haz logout** de la aplicación
2. **Haz login** con las credenciales del admin que promoviste a owner
3. **Verifica**:
   - ✅ Login exitoso
   - ✅ Redirección automática a `/owner` (NO a `/dashboard`)
   - ✅ Se muestra el OwnerDashboard

### 3.2. Verificar Dashboard de Owner

**Deberías ver**:
- ✅ Header: "Panel de Administración" con tu nombre
- ✅ 4 tarjetas de estadísticas (con "-" como placeholder):
  - Total Clubes
  - Total Usuarios
  - Entrenadores
  - Clases Hoy
- ✅ Tarjeta "Estado del Sistema" con indicadores:
  - 🟢 Base de datos configurada
  - 🟢 Rutas protegidas
  - 🟡 Métricas en desarrollo
- ✅ Tarjeta naranja de bienvenida con funcionalidades futuras
- ✅ Footer: "✅ Panel de Owner - Fase 1 completada"

### 3.3. Test de Navegación

**Intenta acceder manualmente a otras rutas**:

1. En la barra de direcciones, intenta acceder a `/dashboard`
2. **Resultado esperado**: NO deberías poder acceder (redirigido a `/owner`)

3. En la barra de direcciones, intenta acceder a `/dashboard/players`
4. **Resultado esperado**: NO deberías poder acceder

### 3.4. Verificar Consola

**Abre la consola del navegador** (F12) y verifica:
- ✅ NO hay errores
- ✅ Deberías ver logs como:
  - `AuthContext - Profile set with role: owner`
  - `OwnerProtectedRoute - Access granted for owner: [tu-email]`

---

## PASO 4: Test de Seguridad

### 4.1. Test de Acceso No Autorizado

1. **Haz logout**
2. **Haz login** con credenciales de un **player**
3. En la barra de direcciones, intenta acceder manualmente a `/owner`
4. **Resultado esperado**:
   - ✅ Redirigido automáticamente a `/dashboard`
   - ✅ NO puedes ver el panel de owner
   - ✅ Console log: `OwnerProtectedRoute - User is not owner, redirecting to dashboard`

5. **Repite el test** con un **trainer**
6. **Repite el test** con un **admin** (que NO sea owner)

**Resultado esperado**: NINGÚN usuario que no sea owner puede acceder a `/owner`.

---

## PASO 5: Test de RLS Policies

### 5.1. Verificar Permisos de Owner en Base de Datos

Abre el **SQL Editor** de Supabase y ejecuta:

```sql
-- Con la sesión del owner activa, debería poder leer todas las tablas

-- Ver todos los perfiles
SELECT COUNT(*) FROM profiles;

-- Ver todos los clubes
SELECT COUNT(*) FROM clubs;

-- Ver todos los student_enrollments
SELECT COUNT(*) FROM student_enrollments;

-- Ver todas las clases programadas
SELECT COUNT(*) FROM programmed_classes;

-- Ver todos los participantes
SELECT COUNT(*) FROM class_participants;

-- Ver todos los pagos
SELECT COUNT(*) FROM payment_records;

-- Ver todas las ligas
SELECT COUNT(*) FROM leagues;
```

**Resultado esperado**: Todas las consultas deberían funcionar sin errores de RLS.

---

## ✅ CHECKLIST FINAL

Marca cada item cuando esté verificado:

### Funcionalidad Existente (NO AFECTADA)
- [ ] ✅ Login de player funciona
- [ ] ✅ Login de trainer funciona
- [ ] ✅ Login de admin funciona
- [ ] ✅ Registro con Google OAuth funciona
- [ ] ✅ Dashboard de player funciona
- [ ] ✅ Dashboard de trainer funciona
- [ ] ✅ Dashboard de admin funciona
- [ ] ✅ Todas las secciones existentes funcionan
- [ ] ✅ NO hay errores en consola para usuarios existentes

### Nueva Funcionalidad de Owner
- [ ] ✅ Admin promovido a owner correctamente
- [ ] ✅ Login como owner funciona
- [ ] ✅ Redirección automática a `/owner`
- [ ] ✅ OwnerDashboard se muestra correctamente
- [ ] ✅ Estadísticas muestran placeholders "-"
- [ ] ✅ Tarjetas de estado se ven bien
- [ ] ✅ NO hay errores en consola para owner

### Seguridad
- [ ] ✅ Players NO pueden acceder a `/owner`
- [ ] ✅ Trainers NO pueden acceder a `/owner`
- [ ] ✅ Admins (no-owner) NO pueden acceder a `/owner`
- [ ] ✅ Solo owners pueden acceder a `/owner`
- [ ] ✅ RLS policies permiten a owner leer todos los datos

---

## 🎯 RESULTADO ESPERADO

Si TODOS los checks están ✅, entonces:

1. ✅ **0% de riesgo**: Ninguna funcionalidad existente se ha visto afectada
2. ✅ **Sprint 1 completo**: Panel básico de owner funcionando
3. ✅ **Listo para Sprint 2**: Implementar métricas reales

---

## 📋 PRÓXIMOS PASOS (Sprint 2)

Una vez confirmado que TODO funciona:

1. Implementar métricas reales en el dashboard:
   - Contar clubes activos
   - Contar usuarios totales por rol
   - Contar entrenadores activos
   - Contar clases programadas para hoy

2. Crear página de gestión de clubes
3. Crear página de gestión de usuarios
4. Crear métricas avanzadas y onboarding tracking

---

## ⚠️ SI ALGO NO FUNCIONA

**NO continúes con Sprint 2 hasta que TODO esté funcionando.**

Si encuentras algún problema:
1. Anota exactamente qué no funciona
2. Copia los errores de la consola
3. Revierte los cambios si es necesario
4. Analiza el problema antes de continuar

---

## 🔄 Revertir Cambios (si es necesario)

Si necesitas revertir el rol de owner a admin:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'tu-admin@email.com';
```

Luego haz logout y login de nuevo.

---

**¡Comienza el testing!** 🚀
