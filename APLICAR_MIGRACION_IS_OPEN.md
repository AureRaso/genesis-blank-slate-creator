# Aplicar Migración: Campo is_open en programmed_classes

## ⚠️ IMPORTANTE: Aplicar esta migración antes de usar la nueva funcionalidad

Esta migración agrega el campo `is_open` a la tabla `programmed_classes`, que controla si una clase aparece en "Clases Disponibles" para los jugadores.

## Opción 1: Aplicar desde Supabase Dashboard (Recomendado)

1. Ve a tu **Dashboard de Supabase**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Haz clic en **New Query**
5. Copia y pega el siguiente SQL:

```sql
-- Add is_open field to programmed_classes table
-- This field controls whether a class appears in "Clases Disponibles" for players

ALTER TABLE programmed_classes
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN programmed_classes.is_open IS 'Controls if the class is visible in "Clases Disponibles" for players to book';

-- Create index for better performance when filtering open classes
CREATE INDEX IF NOT EXISTS idx_programmed_classes_is_open ON programmed_classes(is_open) WHERE is_open = true AND is_active = true;
```

6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Verifica que aparezca "Success" en la consola

## Opción 2: Aplicar usando Supabase CLI

Si tienes problemas con el formato de las migraciones (como el error que viste), aplica manualmente:

```bash
cd "c:\Users\sefac\Documents\Sergio\Proyectos\genesis-blank-slate-creator"

# Ejecutar el SQL directamente
npx supabase db execute --file "supabase/migrations/20251031_185604_add_is_open_to_programmed_classes.sql"
```

## Verificar que la migración se aplicó correctamente

Ejecuta esta query en el SQL Editor para verificar:

```sql
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'programmed_classes'
  AND column_name = 'is_open';
```

Deberías ver:
- `column_name`: is_open
- `data_type`: boolean
- `column_default`: true
- `is_nullable`: NO

## Verificar que las clases existentes tienen is_open = true

```sql
SELECT
  id,
  name,
  is_open,
  is_active
FROM programmed_classes
LIMIT 10;
```

Todas las clases existentes deberían tener `is_open = true` por defecto.

## ¿Qué hace este campo?

- **`is_open = true`**: La clase aparece en "Clases Disponibles" y los jugadores pueden verla y reservar
- **`is_open = false`**: La clase NO aparece en "Clases Disponibles" para jugadores (clase cerrada/privada)

## Funcionalidad implementada

1. ✅ **Formulario de creación de clases** (Paso 3):
   - Nuevo campo "Clase Abierta para Reservas" con switch
   - Por defecto: activado (clase abierta)

2. ✅ **Filtrado automático**:
   - Solo las clases con `is_open = true` aparecen en "Clases Disponibles"
   - Las clases cerradas siguen apareciendo en el calendario de admin/trainers

3. ✅ **Editable en formularios**:
   - Los admins/trainers pueden cambiar este campo al crear o editar clases

## Próximos pasos después de aplicar la migración

1. Crear una nueva clase desde el dashboard de admin
2. En el paso 3, verás el nuevo campo "Clase Abierta para Reservas"
3. Activa/desactiva el switch para controlar la visibilidad
4. Verifica que solo las clases abiertas aparecen en "Clases Disponibles" para jugadores

## Solución de problemas

### Error: "column already exists"
- Esto significa que el campo ya se agregó antes
- Puedes ignorar este error de forma segura

### Las clases no aparecen en "Clases Disponibles"
1. Verifica que `is_open = true`:
   ```sql
   SELECT id, name, is_open FROM programmed_classes WHERE id = 'TU_CLASE_ID';
   ```
2. Si es `false`, actualiza:
   ```sql
   UPDATE programmed_classes SET is_open = true WHERE id = 'TU_CLASE_ID';
   ```

### Error al crear nuevas clases
- Verifica que la migración se aplicó correctamente con la query de verificación de arriba
- Recarga la página del navegador (Ctrl+F5) para actualizar los tipos de TypeScript
