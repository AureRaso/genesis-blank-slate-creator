# Configuración de la Funcionalidad IA para Creación de Clases

Esta funcionalidad está **exclusivamente disponible para ivan@gmail.com**.

## Configuración Requerida

### 1. Obtener API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crea una cuenta o inicia sesión
3. Click en "Create new secret key"
4. Dale un nombre descriptivo (ej: "PadeLock AI")
5. Copia la clave (empieza con `sk-...`)
6. **IMPORTANTE**: Guarda la clave en un lugar seguro, no podrás verla de nuevo

### 2. Configurar el Secreto en Supabase

Ejecuta el siguiente comando para configurar el secreto en Supabase:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-TU-CLAVE-AQUI
```

Alternativamente, puedes configurarlo desde el Dashboard de Supabase:

1. Ve a [https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/settings/vault/secrets](https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/settings/vault/secrets)
2. Click en "New Secret"
3. Nombre: `OPENAI_API_KEY`
4. Valor: Tu API key de OpenAI
5. Click en "Add secret"

### 3. Verificar el Despliegue

La función `ai-class-creator` ya está desplegada. Verifica que esté activa:

```bash
npx supabase functions list
```

Deberías ver `ai-class-creator` en la lista.

## Uso de la Funcionalidad

### Para ivan@gmail.com:

1. Inicia sesión con la cuenta `ivan@gmail.com`
2. Ve a la página "Clases"
3. Verás un botón morado "Crear con IA" junto al botón "Nueva Clase"
4. Click en "Crear con IA"
5. Selecciona un club
6. Escribe en lenguaje natural las clases que quieres crear, por ejemplo:
   - "3 clases los lunes de 10:00 a 11:00 con sergio y fran"
   - "crear 5 clases de martes y jueves de 18:00 a 19:30 con maria, nivel intermedio"
   - "clase los viernes a las 16h de 1 hora con pedro y ana en la pista 2"
7. Click en "Previsualizar con IA"
8. Revisa los datos parseados
9. Selecciona un entrenador
10. Click en "Confirmar y Crear"

## Ejemplos de Comandos en Lenguaje Natural

### Básico
```
3 clases los lunes de 10 a 11 con sergio y fran
```

### Con nivel
```
5 clases de martes y jueves de 18:00 a 19:30, nivel avanzado
```

### Con múltiples detalles
```
crear 4 clases los miércoles de 17h de 90 minutos en la pista 3, precio 80€, max 6 alumnos
```

### Con fechas específicas
```
clases todos los viernes de 16:00 a 17:30 desde el 1 de noviembre hasta el 30 de diciembre
```

## Seguridad

- **Frontend**: El botón solo es visible para `ivan@gmail.com`
- **Backend**: La función Edge valida que el usuario sea `ivan@gmail.com` antes de procesar cualquier solicitud
- **API Key**: Está almacenada de forma segura en Supabase Secrets, no en el código

## Costes Estimados

- Modelo usado: `gpt-4o-mini` (el más económico y rápido de OpenAI)
- Coste aproximado: ~$0.0001-0.0005 por creación de clase
- Coste mensual estimado (100 creaciones): ~$0.01-0.05
- **Extremadamente económico**: GPT-4o-mini es 60x más barato que GPT-4

## Troubleshooting

### Error: "OPENAI_API_KEY no configurada"
- Verifica que hayas configurado el secreto en Supabase
- Espera 1-2 minutos después de configurarlo para que se propague

### Error: "Esta funcionalidad solo está disponible para usuarios autorizados"
- Verifica que estés usando la cuenta `ivan@gmail.com`
- Cierra sesión y vuelve a iniciar sesión

### La IA no entiende mi comando
- Sé más específico en tu descripción
- Incluye: número de clases, días, horarios
- Usa formato de 24h para las horas (ej: 18:00 en lugar de 6pm)

## Funciones Desplegadas

- `ai-class-creator`: Parsea lenguaje natural con OpenAI GPT-4o-mini ✅
- `intelligent-bulk-create-classes`: Crea las clases en batch ✅ (ya existía)

## Archivos Creados/Modificados

### Nuevos:
- `supabase/functions/ai-class-creator/index.ts`
- `supabase/functions/ai-class-creator/deno.json`
- `supabase/functions/import_map.json`
- `src/hooks/useAIClassCreator.ts`
- `src/components/AIClassCreatorModal.tsx`
- `.env.example`

### Modificados:
- `src/pages/ClassesPage.tsx` (agregado botón condicional para ivan@gmail.com)
