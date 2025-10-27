# Plan: Panel de Administración para Owners del SaaS

## Objetivo
Crear un panel de control completo para los owners/superadmins del SaaS que permita monitorear y gestionar todos los clubes, usuarios y métricas de onboarding sin afectar la funcionalidad existente.

---

## Fase 1: Preparación de Base de Datos y Roles

### 1.1 Crear rol "owner" en sistema
- **Archivo**: `supabase/migrations/20251019_add_owner_role.sql`
- **Acciones**:
  - Agregar 'owner' al check constraint de `profiles.role`
  - Crear función para convertir admin en owner
  - Script para asignar rol owner a usuarios específicos

### 1.2 Crear vistas materializadas para métricas
- **Archivo**: `supabase/migrations/20251019_create_owner_metrics_views.sql`
- **Vistas a crear**:
  - `club_metrics_view` - Estadísticas por club
  - `user_metrics_view` - Estadísticas de usuarios
  - `onboarding_metrics_view` - Progreso de onboarding
  - `activity_metrics_view` - Actividad reciente

### 1.3 Políticas RLS para owners
- **Archivo**: `supabase/migrations/20251019_add_owner_rls_policies.sql`
- **Políticas**:
  - Owners pueden leer TODOS los clubs
  - Owners pueden leer TODOS los profiles
  - Owners pueden leer TODOS los enrollments
  - Owners pueden leer métricas agregadas

---

## Fase 2: Estructura de Componentes y Rutas

### 2.1 Crear layout para Owner Dashboard
```
src/
  pages/
    owner/
      OwnerDashboard.tsx          # Dashboard principal
      ClubsManagement.tsx         # Gestión de clubes
      UsersManagement.tsx         # Gestión de usuarios
      MetricsAnalytics.tsx        # Analíticas y métricas
      OnboardingTracker.tsx       # Seguimiento onboarding
  components/
    owner/
      OwnerSidebar.tsx            # Navegación lateral
      ClubCard.tsx                # Card de club con stats
      UserTable.tsx               # Tabla de usuarios
      MetricsChart.tsx            # Gráficos de métricas
      OnboardingProgress.tsx      # Barra de progreso onboarding
      QuickStats.tsx              # Estadísticas rápidas
```

### 2.2 Agregar rutas en App.tsx
```typescript
// Rutas protegidas solo para owners
<Route path="/owner" element={<OwnerProtectedRoute />}>
  <Route index element={<OwnerDashboard />} />
  <Route path="clubs" element={<ClubsManagement />} />
  <Route path="users" element={<UsersManagement />} />
  <Route path="metrics" element={<MetricsAnalytics />} />
  <Route path="onboarding" element={<OnboardingTracker />} />
</Route>
```

---

## Fase 3: Funcionalidades del Panel de Owner

### 3.1 Dashboard Principal (OwnerDashboard.tsx)
**Métricas a mostrar**:
- Total de clubes activos
- Total de usuarios (desglosado por rol)
- Clases programadas hoy/semana
- Revenue total (si aplica)
- Tasa de conversión de onboarding
- Actividad reciente (últimos 10 eventos)

**Componentes**:
```typescript
<OwnerDashboard>
  <QuickStats />              // 4 cards con métricas principales
  <ActivityFeed />            // Últimas acciones en el sistema
  <ClubsOverview />          // Top 5 clubes más activos
  <RecentUsers />            // Últimos usuarios registrados
  <OnboardingSummary />      // Estado general del onboarding
</OwnerDashboard>
```

### 3.2 Gestión de Clubes (ClubsManagement.tsx)
**Funcionalidades**:
- Lista de todos los clubes con filtros
- Ver detalles de cada club:
  - Nombre, dirección, contacto
  - Número de canchas
  - Total de trainers, alumnos
  - Clases programadas
  - Estado de onboarding (%)
- Métricas por club:
  - Usuarios activos vs inactivos
  - Clases completadas vs canceladas
  - Pagos recibidos
- Acciones:
  - Activar/Desactivar club
  - Editar información
  - Ver historial de actividad

### 3.3 Gestión de Usuarios (UsersManagement.tsx)
**Funcionalidades**:
- Tabla con TODOS los usuarios del sistema
- Filtros:
  - Por rol (player, trainer, admin, club_admin, owner)
  - Por club
  - Por estado (activo, inactivo)
  - Por fecha de registro
- Búsqueda por email, nombre
- Columnas:
  - Nombre, Email, Rol, Club, Fecha registro, Último acceso
- Acciones:
  - Ver detalles completos
  - Cambiar rol
  - Activar/Desactivar
  - Eliminar usuario

### 3.4 Métricas y Analíticas (MetricsAnalytics.tsx)
**Gráficos a incluir**:
- Registro de usuarios por mes (línea)
- Distribución de usuarios por rol (pie)
- Clases por club (barras)
- Tasa de asistencia promedio (gauge)
- Crecimiento de clubes (área)
- Conversión de onboarding (funnel)

**Períodos**:
- Última semana
- Último mes
- Últimos 3 meses
- Último año
- Rango personalizado

### 3.5 Seguimiento de Onboarding (OnboardingTracker.tsx)
**Pasos de onboarding a trackear**:
1. Club creado
2. Administrador de club asignado
3. Primer trainer agregado
4. Primeras 3 clases creadas
5. Primeros 5 alumnos registrados
6. Primera clase completada
7. Primer pago registrado

**Métricas**:
- % de clubes en cada etapa
- Tiempo promedio por etapa
- Clubes estancados (>7 días sin avance)
- Tasa de completitud de onboarding

---

## Fase 4: Hooks Personalizados para Owners

### 4.1 Hooks de datos
```typescript
// src/hooks/owner/
useOwnerClubs.ts          // Obtener todos los clubes
useOwnerUsers.ts          // Obtener todos los usuarios
useOwnerMetrics.ts        // Métricas agregadas
useClubDetails.ts         // Detalles de un club específico
useOnboardingProgress.ts  // Progreso de onboarding
useActivityLog.ts         // Log de actividades
```

### 4.2 Ejemplo de hook
```typescript
// useOwnerClubs.ts
export const useOwnerClubs = () => {
  return useQuery({
    queryKey: ['owner-clubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          *,
          trainers:profiles!club_id(count),
          students:student_enrollments!club_id(count),
          classes:programmed_classes!club_id(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isOwner // Solo ejecutar si es owner
  });
};
```

---

## Fase 5: Componentes Reutilizables

### 5.1 Componentes de visualización
```typescript
// src/components/owner/

// Estadísticas rápidas
<StatCard
  title="Total Clubes"
  value={25}
  change={+12}
  icon={<Building />}
/>

// Tabla genérica con acciones
<DataTable
  data={clubs}
  columns={clubColumns}
  onRowClick={handleClubClick}
  actions={[
    { label: 'Ver', onClick: handleView },
    { label: 'Editar', onClick: handleEdit }
  ]}
/>

// Gráfico de líneas
<LineChart
  data={userGrowth}
  xKey="month"
  yKey="users"
  title="Crecimiento de Usuarios"
/>

// Progreso de onboarding
<OnboardingSteps
  club={selectedClub}
  steps={onboardingSteps}
  currentStep={3}
/>
```

---

## Fase 6: Protección de Rutas y Seguridad

### 6.1 Componente OwnerProtectedRoute
```typescript
// src/components/OwnerProtectedRoute.tsx
const OwnerProtectedRoute = () => {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!profile || profile.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
```

### 6.2 Actualizar AuthContext
```typescript
// Agregar helper
const isOwner = profile?.role === 'owner';

// Exportar
return {
  // ... existing
  isOwner
};
```

---

## Fase 7: Plan de Implementación (Paso a Paso)

### Sprint 1: Base de Datos y Autenticación (Día 1-2)
1. ✅ Crear migración para rol owner
2. ✅ Crear políticas RLS para owners
3. ✅ Asignar rol owner a usuario de prueba
4. ✅ Crear OwnerProtectedRoute
5. ✅ Actualizar App.tsx con rutas de owner

### Sprint 2: Dashboard Principal (Día 3-4)
1. ✅ Crear layout OwnerDashboard
2. ✅ Crear componente QuickStats
3. ✅ Implementar useOwnerMetrics hook
4. ✅ Mostrar métricas básicas (clubes, usuarios, clases)
5. ✅ Agregar ActivityFeed simple

### Sprint 3: Gestión de Clubes (Día 5-6)
1. ✅ Crear ClubsManagement page
2. ✅ Implementar useOwnerClubs hook
3. ✅ Crear ClubCard component
4. ✅ Agregar filtros básicos
5. ✅ Implementar vista de detalles de club

### Sprint 4: Gestión de Usuarios (Día 7-8)
1. ✅ Crear UsersManagement page
2. ✅ Implementar useOwnerUsers hook
3. ✅ Crear UserTable component
4. ✅ Agregar filtros por rol y club
5. ✅ Implementar búsqueda

### Sprint 5: Métricas y Onboarding (Día 9-10)
1. ✅ Crear MetricsAnalytics page
2. ✅ Integrar librería de gráficos (recharts)
3. ✅ Crear OnboardingTracker page
4. ✅ Implementar cálculo de progreso de onboarding
5. ✅ Crear visualizaciones de métricas

### Sprint 6: Pulido y Testing (Día 11-12)
1. ✅ Mejorar diseño responsive
2. ✅ Agregar loading states
3. ✅ Implementar manejo de errores
4. ✅ Testing completo
5. ✅ Documentación

---

## Estructura de Base de Datos Adicional

### Tabla: onboarding_progress
```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: activity_log
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT, -- 'club', 'user', 'class', etc.
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Tecnologías a Utilizar

### Visualización de Datos
- **recharts** - Gráficos y charts
- **lucide-react** - Iconos (ya en uso)
- **shadcn/ui** - Componentes (ya en uso)

### Tablas y Filtros
- **@tanstack/react-table** - Tablas avanzadas
- Filtros personalizados con shadcn/ui

### Estado Global (opcional)
- React Query para cache (ya en uso)
- Zustand para estado global si es necesario

---

## Consideraciones Importantes

### ✅ No Afectar Funcionalidad Existente
- Nuevas rutas bajo `/owner/*`
- Nuevos componentes en carpeta separada
- Nuevas políticas RLS solo para owner
- No modificar componentes existentes

### ✅ Seguridad
- Verificar rol en frontend Y backend
- Políticas RLS estrictas
- Logs de auditoría para acciones de owner

### ✅ Performance
- Paginación en listas grandes
- Lazy loading de componentes
- Cache de métricas con React Query
- Considerar vistas materializadas para queries pesadas

### ✅ UX/UI
- Diseño coherente con el resto de la app
- Responsive para tablet y desktop
- Loading states claros
- Manejo de errores amigable

---

## Próximos Pasos Inmediatos

**¿Comenzamos con el Sprint 1?**

1. Crear migración para agregar rol 'owner'
2. Crear políticas RLS básicas
3. Crear OwnerProtectedRoute
4. Crear estructura básica de rutas

**¿O prefieres ajustar algo del plan primero?**
