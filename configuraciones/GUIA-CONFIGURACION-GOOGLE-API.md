# Guía de Configuración: Google Custom Search API

## ⭐ Ventajas de usar Google Custom Search API

- **100 búsquedas GRATIS al día** (suficiente para procesar 100 clubes)
- **Mucho más preciso** que DuckDuckGo scraping
- **Resultados de Google** - la mejor calidad de búsqueda
- **Legal y oficial** - No viola términos de servicio

## 📋 Pasos de Configuración (10-15 minutos)

### Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto:
   - Haz clic en el selector de proyectos (arriba a la izquierda)
   - Click en "Nuevo Proyecto"
   - Nombre: "Búsqueda Clubes Pádel"
   - Click en "Crear"

### Paso 2: Habilitar Custom Search API

1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Custom Search API"
3. Click en "Custom Search API"
4. Click en "HABILITAR"

### Paso 3: Crear API Key

1. Ve a "APIs y servicios" > "Credenciales"
2. Click en "+ CREAR CREDENCIALES"
3. Selecciona "Clave de API"
4. Copia la API Key que aparece
5. (Opcional) Click en "Restringir clave" para mayor seguridad

### Paso 4: Crear Custom Search Engine

1. Ve a [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click en "Get Started" o "Añadir"
3. Configuración:
   - **Nombre del motor de búsqueda**: "Búsqueda Clubes"
   - **Qué buscar**: Selecciona "Buscar en toda la web"
   - **Configuración de búsqueda**: Activa "Búsqueda de imágenes" (opcional)
4. Click en "Crear"
5. **IMPORTANTE**: Copia el "ID del motor de búsqueda" (cx)
   - Aparece como: `0123456789abcdefg:hijklmnop`

### Paso 5: Configurar el Script

1. Abre el archivo `buscar-con-google-api.cjs`
2. Busca la sección `CONFIG` al principio del archivo
3. Reemplaza estos valores:

```javascript
const CONFIG = {
  API_KEY: 'TU_API_KEY_AQUI',  // ← Pega tu API Key aquí
  SEARCH_ENGINE_ID: 'TU_SEARCH_ENGINE_ID_AQUI',  // ← Pega tu Search Engine ID aquí
  // ...
};
```

### Paso 6: Ejecutar el Script

```bash
node buscar-con-google-api.cjs
```

## 📊 Límites y Costos

### Nivel Gratuito
- **100 búsquedas/día GRATIS**
- Suficiente para procesar 100 clubes por día
- Para 211 clubes: necesitarás 3 días

### Si Necesitas Más
- **$5 USD por cada 1,000 búsquedas adicionales**
- Para los 211 clubes en un día: ~$0.55 USD
- Necesitas habilitar facturación en Google Cloud

## 🎯 Resultados Esperados

Basándose en pruebas, este método debería lograr:
- **60-80% de tasa de éxito** (vs 20% con DuckDuckGo)
- Números más precisos y actualizados
- Información adicional (URLs, snippets de contexto)

## 📝 Notas Importantes

1. **Primera vez**: Google puede pedir que verifiques tu identidad
2. **Tarjeta de crédito**: Solo necesaria si quieres más de 100 búsquedas/día
3. **Facturación**: No se activará automáticamente, debes habilitarla manualmente
4. **Monitoreo**: Revisa el uso en Google Cloud Console

## 🔧 Solución de Problemas

### Error: "API key not valid"
- Verifica que hayas copiado bien la API key
- Asegúrate de que Custom Search API esté habilitada
- Espera unos minutos, a veces tarda en activarse

### Error: "Daily quota exceeded"
- Has usado las 100 búsquedas gratuitas del día
- Opciones:
  1. Espera hasta mañana
  2. Habilita facturación (cobrará $5 por cada 1000 adicionales)

### Error: "Invalid search engine ID"
- Verifica que copiaste el ID completo (formato: `abc123:def456`)
- Asegúrate de que el Search Engine esté configurado para "buscar en toda la web"

## 📧 ¿Necesitas Ayuda?

- [Documentación oficial](https://developers.google.com/custom-search/v1/overview)
- [Consola de Google Cloud](https://console.cloud.google.com/)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)

## 🚀 Alternativa Más Simple

Si no quieres configurar Google API, la alternativa más práctica es:

1. **Contactar a la Federación Andaluza de Pádel**
   - Web: https://www.fap.es/
   - Email: info@fap.es
   - Es probable que tengan toda esta información centralizada

2. **Buscar manualmente** en Google Maps/Playtomic
   - Más lento pero 100% preciso
   - Puedes hacerlo mientras ves TV o escuchas música
