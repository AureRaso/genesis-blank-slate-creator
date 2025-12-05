# Búsqueda de Teléfonos de Clubes de Pádel

## ⚠️ RESULTADOS DE PRUEBA

El script fue probado con 5 clubes:
- **Tasa de éxito: 20%** (1 de 5 clubes)
- El Club de Mar de Almería fue encontrado con 8 posibles números
- Los otros 4 clubes no arrojaron resultados

**Conclusión**: El método de scraping automatizado tiene limitaciones. Se recomienda complementar con búsqueda manual o usar APIs de pago.

## Archivos Creados

1. **buscar-telefonos-clubes-avanzado.cjs** - Script principal (RECOMENDADO)
2. **buscar-telefonos-clubes.cjs** - Versión básica/plantilla
3. **test-busqueda.cjs** - Script de prueba con 5 clubes

## Cómo Usar el Script

### Opción 1: Prueba Primero (RECOMENDADO)

```bash
node test-busqueda.cjs
```

Esto probará con solo 5 clubes para que veas cómo funciona (~10-15 segundos).

### Opción 2: Ejecutar el Script Completo

```bash
node buscar-telefonos-clubes-avanzado.cjs
```

Este script:
- Busca automáticamente en DuckDuckGo por cada club
- Extrae números de teléfono del HTML de resultados
- Guarda progreso cada 10 clubes procesados
- Incluye delay de 2 segundos entre búsquedas para evitar bloqueos
- Genera dos archivos de salida: CSV y JSON

### Resultados

El script generará dos archivos:

1. **telefonos-clubes.csv** - Para abrir en Excel/Google Sheets
   - Columnas: Club, Provincia, Localidad, Teléfonos, Fuente, Estado

2. **telefonos-clubes.json** - Para procesamiento adicional
   - Formato JSON con toda la información

## Características del Script

### ✅ Ventajas
- Búsqueda automática de 200+ clubes
- Extracción inteligente de números telefónicos españoles
- Guarda progreso periódicamente (recuperable si se interrumpe)
- Estadísticas en tiempo real
- Respeta límites de búsqueda (delay entre peticiones)

### ⚠️ Limitaciones (IMPORTANTE)
- **Tasa de éxito limitada (~20-30%)** - Basado en pruebas reales
- **No es 100% preciso** - Los resultados requieren revisión manual
- Puede encontrar múltiples números sin indicar cuál es el correcto
- Depende de que la información esté públicamente disponible
- Algunos clubes pueden no tener presencia web
- Puede encontrar números antiguos o incorrectos
- DuckDuckGo puede bloquear después de muchas búsquedas

## Alternativas Recomendadas (Más Efectivas)

Dado que el script automatizado tiene una tasa de éxito limitada, considera estas alternativas:

### 1. Federación Andaluza de Pádel ⭐ RECOMENDADO
**Contacto**:
- Web: https://www.fap.es/
- Email: info@fap.es
- Es probable que tengan un directorio completo con toda la información de contacto

### 2. Búsqueda Manual Asistida
Para cada club, buscar en:
- Google Maps / Google My Business
- Páginas Amarillas España (paginasamarillas.es)
- Facebook / Instagram del club
- Playtomic (muchos clubes están listados aquí)

### 3. APIs de Búsqueda de Pago (Mayor Precisión)
Si necesitas automatizar con mejor tasa de éxito:
- **SerpAPI** (~$50/mes) - API de búsqueda de Google
- **ScraperAPI** (~$49/mes) - Web scraping con proxies
- **Google Custom Search API** - 100 búsquedas gratis/día

### 4. Servicios Profesionales
- Contratar un asistente virtual (~€10-15/hora)
- Servicios de data scraping profesionales
- Empresas de bases de datos comerciales (InfoCif, eInforma)

## Ejemplo de Uso Manual (Búsqueda Individual)

Si quieres buscar manualmente algunos clubes primero:

```javascript
// Modificar el array 'clubes' para incluir solo los que quieres buscar
const clubes = [
  { club: "CLUB DE MAR DE ALMERIA", provincia: "ALMERÍA", localidad: "ALMERIA" },
  { club: "CLUB TENIS LA BARROSA", provincia: "CÁDIZ", localidad: "CHICLANA DE LA FRONTERA" }
];
```

## Tiempo Estimado

- Con delay de 2 segundos: ~7-8 minutos para 200+ clubes
- Sin delay: Riesgo de bloqueo por DuckDuckGo

## Solución de Problemas

### Error: "Request blocked"
- Aumenta el delay entre búsquedas
- Usa una VPN
- Considera usar una API de búsqueda de pago

### Error: "Module not found"
- Asegúrate de estar en el directorio correcto
- El script usa solo módulos nativos de Node.js (https, fs)

### El script se interrumpe
- Los resultados parciales están guardados en `telefonos-clubes.csv`
- Puedes modificar el script para continuar desde donde se quedó

## Próximos Pasos Recomendados

1. **Ejecutar el script** y revisar resultados iniciales
2. **Revisar manualmente** los teléfonos encontrados
3. **Complementar** con búsqueda manual para clubes no encontrados
4. **Contactar** la Federación Andaluza de Pádel para validar datos
5. **Actualizar** la información periódicamente

## Consideraciones Legales

- ✅ Este script solo busca información públicamente disponible
- ✅ Respeta el RGPD al no crear bases de datos no autorizadas
- ⚠️ Verifica el uso que darás a los datos recopilados
- ⚠️ Considera informar a los clubes si usarás sus datos para contacto comercial

## Contacto y Soporte

Si necesitas ayuda adicional o mejoras específicas, considera:
- Contratar un servicio profesional de data scraping
- Usar bases de datos comerciales de empresas españolas
- Contactar directamente con la Federación de Pádel
