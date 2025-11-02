# Configuración de Grupos de WhatsApp por Club

## Resumen
Ahora el sistema filtra automáticamente los grupos de WhatsApp según el club del usuario. Cuando un administrador o trainer esté en la página de asistencia y quiera comunicar un hueco libre, solo verá los grupos asociados a su club.

## Cambios Implementados

1. **Hook `useAllWhatsAppGroups` actualizado**: Ahora recibe el `club_id` como parámetro y filtra solo los grupos de ese club.
2. **`TodayAttendancePage` actualizado**: Pasa automáticamente el `club_id` del usuario al hook.

## Configuración de Grupos en la Base de Datos

Para configurar los grupos de WhatsApp, necesitas insertar registros en la tabla `whatsapp_groups` con los `club_id` correctos.

### Paso 1: Obtener los IDs de los clubes

Primero, necesitas saber los IDs de tus clubes:

```sql
SELECT id, name FROM clubs;
```

Esto te devolverá algo como:
- Club Hespérides: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Club KM Padel: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`

### Paso 2: Insertar los grupos de WhatsApp

#### Para Club Hespérides (4 grupos)

```sql
-- Grupo 1: Menores Hespérides
INSERT INTO whatsapp_groups (
  club_id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_by
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Reemplazar con ID real del Club Hespérides
  'Menores Hespérides',
  '123456789@g.us', -- Reemplazar con el ID real del grupo de WhatsApp
  'Grupo de WhatsApp para menores del Club Hespérides',
  true,
  auth.uid() -- Tu ID de usuario
);

-- Grupo 2: Nivel Bronce
INSERT INTO whatsapp_groups (
  club_id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_by
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Reemplazar con ID real del Club Hespérides
  'Nivel Bronce',
  '234567890@g.us', -- Reemplazar con el ID real del grupo de WhatsApp
  'Grupo de WhatsApp para nivel bronce del Club Hespérides',
  true,
  auth.uid()
);

-- Grupo 3: Nivel Plata
INSERT INTO whatsapp_groups (
  club_id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_by
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Reemplazar con ID real del Club Hespérides
  'Nivel Plata',
  '345678901@g.us', -- Reemplazar con el ID real del grupo de WhatsApp
  'Grupo de WhatsApp para nivel plata del Club Hespérides',
  true,
  auth.uid()
);

-- Grupo 4: Nivel Oro
INSERT INTO whatsapp_groups (
  club_id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_by
) VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- Reemplazar con ID real del Club Hespérides
  'Nivel Oro',
  '456789012@g.us', -- Reemplazar con el ID real del grupo de WhatsApp
  'Grupo de WhatsApp para nivel oro del Club Hespérides',
  true,
  auth.uid()
);
```

#### Para Club KM Padel (1 grupo)

```sql
-- Grupo: Clases Padel KM
INSERT INTO whatsapp_groups (
  club_id,
  group_name,
  group_chat_id,
  description,
  is_active,
  created_by
) VALUES (
  'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', -- Reemplazar con ID real del Club KM Padel
  'Clases Padel KM',
  '567890123@g.us', -- Reemplazar con el ID real del grupo de WhatsApp
  'Grupo de WhatsApp para clases del Club KM Padel',
  true,
  auth.uid()
);
```

### Paso 3: Cómo obtener el `group_chat_id` de WhatsApp

El `group_chat_id` es el identificador único del grupo en WhatsApp. Hay varias formas de obtenerlo:

1. **Usando Whapi.cloud (API que ya usas)**:
   - Ve a tu dashboard de Whapi.cloud
   - Busca los grupos en la sección de grupos
   - Copia el ID del grupo (formato: `123456789@g.us`)

2. **Usando la API de WhatsApp Web**:
   - Si tienes acceso a la API, puedes listar todos los grupos
   - El ID aparecerá en formato `xxxxxxxxx@g.us`

3. **Formato del ID**:
   - Grupos: `123456789012345@g.us`
   - Chats individuales: `1234567890@c.us`

### Paso 4: Verificar la configuración

Después de insertar los grupos, puedes verificar que están correctamente configurados:

```sql
-- Ver todos los grupos de WhatsApp con sus clubes
SELECT
  wg.id,
  wg.group_name,
  wg.group_chat_id,
  wg.is_active,
  c.name as club_name
FROM whatsapp_groups wg
LEFT JOIN clubs c ON c.id = wg.club_id
ORDER BY c.name, wg.group_name;
```

### Paso 5: Actualizar un grupo existente

Si necesitas cambiar el `group_chat_id` de un grupo:

```sql
UPDATE whatsapp_groups
SET group_chat_id = 'nuevo_id@g.us'
WHERE group_name = 'Menores Hespérides';
```

### Paso 6: Desactivar un grupo (sin eliminarlo)

Si necesitas desactivar temporalmente un grupo:

```sql
UPDATE whatsapp_groups
SET is_active = false
WHERE group_name = 'Nivel Bronce';
```

## Cómo Funciona en la Aplicación

1. **Usuario entra a "Asistencia de Hoy"**: El sistema detecta automáticamente el `club_id` del usuario.

2. **Se cargan solo los grupos de su club**:
   - Si es del Club Hespérides → verá: Menores Hespérides, Nivel Bronce, Nivel Plata, Nivel Oro
   - Si es del Club KM Padel → verá: Clases Padel KM

3. **Al hacer clic en "Comunicar hueco libre"**:
   - Si solo hay 1 grupo → se envía directamente
   - Si hay múltiples grupos → aparece un diálogo para seleccionar a cuál enviar

## Solución de Problemas

### No aparece ningún grupo
1. Verifica que el usuario tiene un `club_id` asignado en su perfil
2. Verifica que existen grupos activos para ese club
3. Revisa los logs de la consola del navegador

### Aparecen grupos de otros clubes
1. Verifica que los `club_id` en la tabla `whatsapp_groups` son correctos
2. Verifica que el usuario tiene el `club_id` correcto en su perfil

### Error al enviar mensaje
1. Verifica que el `group_chat_id` es correcto
2. Verifica que el grupo está activo (`is_active = true`)
3. Verifica que tu API de Whapi.cloud está funcionando correctamente
