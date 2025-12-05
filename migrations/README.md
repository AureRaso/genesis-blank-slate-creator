# 🗃️ Migrations y Scripts SQL

Esta carpeta contiene scripts SQL para debugging, testing y correcciones de datos.

## ⚠️ Importante

**NO confundir con `supabase/migrations/`**:
- **`/migrations/`** (esta carpeta): Scripts SQL de debug, testing y correcciones manuales
- **`/supabase/migrations/`**: Migraciones oficiales de la base de datos que se aplican automáticamente

## 📂 Tipos de Scripts

### Scripts de Verificación (`check-*.sql`)
Queries para verificar el estado de la base de datos sin modificar datos.

**Ejemplos**:
- `check-attendance-table.sql` - Verifica estructura de tabla de asistencia
- `check-player-absence-in-confirmations.sql` - Verifica ausencias de jugadores
- `check-student-enrollments-structure.sql` - Verifica estructura de inscripciones

**Uso**:
```bash
# Ejecutar en Supabase Dashboard > SQL Editor
# O vía CLI:
psql "$DATABASE_URL" -f migrations/check-attendance-table.sql
```

---

### Scripts de Debug (`debug-*.sql`)
Queries detalladas para diagnosticar problemas específicos.

**Ejemplos**:
- `debug-paula-padilla-attendance.sql` - Debug de asistencia de un jugador específico
- `debug-jueves-pista2-19h-20251204.sql` - Debug de una clase específica
- `debug-missing-participants.sql` - Buscar participantes faltantes

---

### Scripts de Corrección (`fix-*.sql`)
Scripts que modifican datos para corregir problemas.

**⚠️ CUIDADO**: Estos scripts MODIFICAN la base de datos.

**Ejemplos**:
- `fix-crossmate-enrollment.sql` - Corrige inscripción de un jugador
- `fix-manuel-trainer-v2.sql` - Corrige datos de un entrenador

**Uso**:
1. ✅ Revisar el script ANTES de ejecutar
2. ✅ Hacer backup de datos si es necesario
3. ✅ Ejecutar en entorno de desarrollo primero
4. ✅ Verificar resultado con script `check-*` correspondiente

---

### Scripts de Marcado Manual (`mark-*.sql`)
Scripts para marcar manualmente asistencias/ausencias para testing.

**Ejemplos**:
- `mark-paula-absent-20251204.sql` - Marca ausencia manual

---

### Scripts de Eliminación (`delete-*.sql`)
Scripts para eliminar datos específicos.

**⚠️ PELIGRO**: Estos scripts ELIMINAN datos permanentemente.

**Ejemplos**:
- `delete-merinainfo1-execute.sql` - Elimina usuario específico
- `delete-user-merinainfo1.sql` - Elimina datos de usuario

**Uso**:
1. ⚠️ SIEMPRE hacer backup primero
2. ⚠️ Verificar TWICE que el ID/email es correcto
3. ⚠️ Ejecutar solo si estás 100% seguro

---

### Scripts de Testing (`test-*.sql`, `simulate-*.sql`)
Scripts para testing y simulación.

**Ejemplos**:
- `simulate-hesperides-notifications.sql` - Simula notificaciones
- `verify-manuel-trainer.sql` - Verifica datos de entrenador

---

### Scripts Misceláneos
Otros scripts para tareas específicas.

**Ejemplos**:
- `get-rocio-attendance-history.sql` - Obtiene historial de asistencia
- `add_payment_rejection_columns.sql` - Añade columnas para pagos

---

## 🔍 Cómo Usar Estos Scripts

### Opción 1: Supabase Dashboard
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Copia y pega el contenido del script
5. Haz clic en "Run"

### Opción 2: CLI con psql
```bash
# Asegúrate de tener DATABASE_URL en .env
source .env

# Ejecutar script
psql "$DATABASE_URL" -f migrations/nombre-del-script.sql

# Ver resultado
psql "$DATABASE_URL" -c "SELECT * FROM tabla LIMIT 10;"
```

### Opción 3: Supabase CLI
```bash
# Ejecutar query directamente
npx supabase db execute --file migrations/nombre-del-script.sql
```

---

## 📝 Crear Nuevos Scripts

### Plantilla para Script de Verificación

```sql
-- Descripción: Verificar [qué verificas]
-- Autor: [Tu nombre]
-- Fecha: [YYYY-MM-DD]

-- 1. Verificar existencia de [algo]
SELECT
  'Nombre descriptivo' as query_name,
  campo1,
  campo2
FROM tabla
WHERE condicion
LIMIT 10;

-- 2. Contar registros
SELECT
  'Conteo de registros' as query_name,
  COUNT(*) as total
FROM tabla;

-- 3. Verificar datos específicos
SELECT *
FROM tabla
WHERE id = 'ID_ESPECIFICO';
```

### Convenciones de Nombres

- **check-**: Verificación sin modificar datos
- **debug-**: Debugging detallado
- **fix-**: Corrección de datos (modifica DB)
- **delete-**: Eliminación de datos (modifica DB)
- **mark-**: Marcado manual (modifica DB)
- **simulate-**: Simulación/testing
- **verify-**: Verificación post-corrección
- **get-**: Obtener datos específicos
- **update-**: Actualización de datos (modifica DB)

### Formato de Nombres

```
[tipo]-[descripcion-corta]-[fecha-opcional].sql

Ejemplos:
check-attendance-2025-12-05.sql
fix-enrollment-maria-garcia.sql
debug-class-participants-hesperides.sql
```

---

## ⚙️ Variables Comunes

Estos scripts a menudo usan IDs específicos. Aquí hay referencias comunes:

### Clubs
```sql
-- Hesperides
'5e4fe3ae-54e1-40f3-b6b7-e8b74889ebc3'

-- Club de prueba
'cc0a5265-99c5-4b99-a479-5334280d0c6d'
```

### Clases de Ejemplo
```sql
-- Jueves - Pista 2
'515c21cf-1557-4d74-bc2e-1f5160aaf865'

-- Viernes - Pista 2
'5d6d27bb-06bc-43e1-95f6-cc927573f2a3'
```

---

## 🗑️ Limpieza

Estos scripts son temporales y de debugging. Se pueden eliminar cuando ya no sean necesarios:

1. Scripts de testing que ya se ejecutaron
2. Scripts de debug de problemas ya resueltos
3. Scripts one-time de corrección ya aplicados

**Mantener**:
- Scripts de verificación genéricos (reutilizables)
- Scripts de debugging de problemas recurrentes
- Scripts útiles como ejemplos/plantillas

---

## 📚 Ver También

- [Documentación del Sistema](../documentacion/README.md)
- [Migraciones Oficiales](../supabase/migrations/)
- [Sistema de Asistencias](../documentacion/DOCS_SISTEMA_ASISTENCIAS.md)

---

**Nota**: Si necesitas aplicar una migración permanente a la base de datos, crea el archivo en `supabase/migrations/` siguiendo el formato: `YYYYMMDDHHMMSS_descripcion.sql`
