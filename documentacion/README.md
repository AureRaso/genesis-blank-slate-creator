# 📚 Documentación del Proyecto

Esta carpeta contiene toda la documentación técnica del proyecto PadeLock.

## 📖 Documentos Disponibles

### Sistema de Asistencias y Ausencias
**Archivo**: [DOCS_SISTEMA_ASISTENCIAS.md](DOCS_SISTEMA_ASISTENCIAS.md)

**Contenido**:
- Arquitectura de base de datos (tablas: `class_participants`, `class_attendance_confirmations`, `attendance_history`)
- Flujo de trabajo completo para jugadores y profesores
- Hooks y componentes utilizados
- Sistema de historial automático con triggers
- Casos de uso comunes con ejemplos reales
- Troubleshooting y debugging
- Mejores prácticas para desarrollo
- Diagramas de flujo de datos

**Cuándo consultarlo**:
- ✅ Necesitas entender cómo funciona el sistema de asistencias
- ✅ Vas a implementar una nueva feature relacionada con asistencias
- ✅ Hay un bug relacionado con ausencias o confirmaciones
- ✅ Necesitas hacer onboarding a un nuevo desarrollador
- ✅ Quieres verificar cómo se registra el historial de cambios

---

### Sistema de Tarifas y Pagos
**Archivo**: [DOCS_SISTEMA_TARIFAS_PAGOS.md](DOCS_SISTEMA_TARIFAS_PAGOS.md)

**Contenido**:
- Arquitectura de base de datos (tablas: `payment_rates`, `student_rate_assignments`, `student_payments`, `payment_generation_logs`)
- Tipos de tarifas: fija y por_clase
- Asignación de tarifas a alumnos
- Sistema de generación automática con pg_cron
- Flujo de estados de pagos (pendiente → en_revision → pagado)
- Hooks y componentes utilizados
- Casos de uso con ejemplos
- Troubleshooting y queries de diagnóstico

**Cuándo consultarlo**:
- ✅ Necesitas entender cómo funciona el sistema de cobros
- ✅ Vas a configurar nuevas tarifas para un club
- ✅ Los pagos no se están generando automáticamente
- ✅ Necesitas entender el cálculo de tarifas por_clase
- ✅ Quieres verificar los logs de generación automática

---

## 🗂️ Estructura de Carpetas Relacionadas

```
/
├── documentacion/              # ← Estás aquí
│   ├── README.md              # Este archivo
│   ├── DOCS_SISTEMA_ASISTENCIAS.md
│   └── DOCS_SISTEMA_TARIFAS_PAGOS.md
│
├── migrations/                 # Queries SQL de debug y testing
│   ├── check-*.sql            # Scripts de verificación
│   ├── debug-*.sql            # Scripts de debugging
│   ├── fix-*.sql              # Scripts de corrección
│   └── ...
│
├── supabase/migrations/        # Migraciones de base de datos
│   └── *.sql                  # Migraciones aplicadas a la DB
│
├── src/
│   ├── hooks/                 # React hooks
│   │   ├── useAttendanceConfirmations.ts  # Hooks de jugadores
│   │   └── useTodayAttendance.ts          # Hooks de profesores
│   │
│   ├── components/            # Componentes React
│   │   └── TodayClassesConfirmation.tsx   # Panel de jugador
│   │
│   └── pages/                 # Páginas
│       ├── TodayAttendancePage.tsx        # Panel profesor (hoy)
│       └── WeekAttendancePage.tsx         # Panel profesor (semana)
```

---

## 🔍 Cómo Usar Esta Documentación

### Para Desarrollo

1. **Antes de empezar a codear**:
   - Lee la sección correspondiente en DOCS_SISTEMA_ASISTENCIAS.md
   - Revisa los hooks existentes antes de crear nuevos
   - Verifica el flujo de datos en los diagramas

2. **Durante el desarrollo**:
   - Consulta "Mejores Prácticas" para seguir los estándares del proyecto
   - Usa los logs con emojis para debugging (`console.log('✅ [Player] ...')`)
   - Siempre invalida las queries de React Query después de mutaciones

3. **Durante debugging**:
   - Ve a la sección "Troubleshooting"
   - Usa las queries SQL proporcionadas para verificar estado de la DB
   - Revisa los logs de consola con los emojis para seguir el flujo

### Para Testing

1. Consulta "Casos de Uso Comunes" para escenarios de prueba
2. Usa las queries SQL de la carpeta `/migrations` para verificar datos
3. Revisa la sección "Arquitectura de Base de Datos" para entender qué campos verificar

### Para Onboarding

**Ruta de aprendizaje recomendada**:

1. Lee "Introducción" y "Arquitectura de Base de Datos"
2. Revisa "Flujo de Trabajo - Jugadores"
3. Revisa "Flujo de Trabajo - Profesores"
4. Estudia los "Diagramas de Flujo"
5. Practica con los "Casos de Uso Comunes"
6. Referencia "Troubleshooting" cuando encuentres problemas

---

## 🆕 Añadir Nueva Documentación

Cuando agregues documentación nueva:

1. Crea un archivo `.md` en esta carpeta
2. Usa un nombre descriptivo (ej: `DOCS_SISTEMA_PAGOS.md`)
3. Actualiza este README.md con:
   - Enlace al nuevo documento
   - Breve descripción del contenido
   - Cuándo consultarlo
4. Usa el mismo formato y estructura que DOCS_SISTEMA_ASISTENCIAS.md

### Plantilla de Documento

```markdown
# Sistema de [Nombre]

## Índice
1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Casos de Uso](#casos-de-uso)
5. [Troubleshooting](#troubleshooting)

## Introducción
[Describe qué hace el sistema y por qué existe]

## Arquitectura
[Describe tablas, relaciones, hooks, componentes]

## Flujo de Trabajo
[Describe cómo se usa paso a paso]

## Casos de Uso
[Ejemplos concretos con pasos y resultados]

## Troubleshooting
[Problemas comunes y soluciones]
```

---

## 📝 Convenciones

### Formato de Documentación

- ✅ Usar Markdown (.md)
- ✅ Incluir índice al inicio
- ✅ Usar bloques de código con sintaxis highlighting
- ✅ Incluir ejemplos concretos con datos reales
- ✅ Usar emojis para mejor legibilidad (📚 ✅ ❌ ⚠️ etc.)
- ✅ Incluir diagramas de flujo cuando sea posible
- ✅ Referenciar archivos con rutas relativas

### Estilo de Código en Documentación

```sql
-- Queries SQL: usar comentarios descriptivos
SELECT field FROM table
WHERE condition = true;
```

```javascript
// JavaScript: usar comentarios inline
const result = await hook.mutate({ param: value });
```

### Logs y Debugging

```javascript
// Usar emojis consistentes:
console.log('✅ [Role] Success message:', data);
console.log('❌ [Role] Error message:', error);
console.log('⚠️ [Role] Warning message:', warning);
console.log('🔍 [Role] Debug message:', debug);
```

---

## 🔗 Enlaces Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Repositorio del Proyecto](https://github.com/tu-repo)

---

**Última actualización**: 2026-02-05
**Mantenido por**: Equipo de desarrollo
