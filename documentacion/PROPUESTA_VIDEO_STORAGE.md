# Propuesta: Almacenamiento de Videos para Biblioteca de Ejercicios

## Contexto

La Biblioteca de Ejercicios de PadeLock necesita soporte para videos cortos (max 1 minuto) con buena calidad. Este documento analiza las opciones disponibles y recomienda la mejor solución.

---

## Requisitos

- Videos de **max 1 minuto** de duración
- **Buena calidad** (720p-1080p)
- **Escalable** para múltiples clubes
- **Coste optimizado** para uso moderado inicial
- Integración sencilla con la arquitectura actual (Supabase + React)

---

## Opciones Evaluadas

### 1. Bunny.net Stream

| Aspecto | Detalle |
|---------|---------|
| **Almacenamiento** | $0.01/GB/mes |
| **Bandwidth** | $0.01/GB |
| **Transcoding** | Incluido (HLS/DASH automático) |
| **CDN** | 100+ PoPs globales incluido |
| **Player** | Embed player incluido |

**Ventajas:**
- Precio más competitivo para video
- Transcoding automático a múltiples resoluciones
- CDN global sin configuración adicional
- Player embed listo para usar
- API simple y bien documentada

**Desventajas:**
- Servicio adicional a gestionar
- Requiere cuenta separada

---

### 2. Supabase Storage

| Aspecto | Detalle |
|---------|---------|
| **Almacenamiento** | $0.021/GB/mes |
| **Bandwidth** | $0.09/GB |
| **Transcoding** | No disponible |
| **CDN** | Básico (Cloudflare) |

**Ventajas:**
- Ya integrado en la arquitectura actual
- Mismo dashboard de administración
- RLS nativo para seguridad
- Sin servicios adicionales

**Desventajas:**
- Bandwidth 9x más caro que Bunny
- Sin transcoding (un solo formato)
- Sin player integrado

---

### 3. AWS S3 + CloudFront

| Aspecto | Detalle |
|---------|---------|
| **Almacenamiento** | $0.023/GB/mes |
| **Bandwidth** | $0.085/GB |
| **Transcoding** | MediaConvert ($0.015/min) |
| **CDN** | CloudFront (configuración manual) |

**Ventajas:**
- Máxima escalabilidad
- Ecosistema completo de AWS
- Control total sobre la infraestructura

**Desventajas:**
- Mayor complejidad de configuración
- Múltiples servicios a coordinar
- Curva de aprendizaje más pronunciada

---

## Comparativa de Costes (Escenario Mensual)

**Supuesto:** 100 videos de 1 min (~50MB c/u), 1000 visualizaciones/mes

| Servicio | Storage | Bandwidth | Total |
|----------|---------|-----------|-------|
| **Bunny.net** | ~$0.50 | ~$5.00 | **~$5.50** |
| **Supabase** | ~$1.00 | ~$45.00 | **~$46.00** |
| **AWS S3+CF** | ~$1.00 | ~$42.00 | **~$43.00** |

---

## Recomendacion: Bunny.net Stream

### Por que Bunny

1. **Coste/beneficio optimo**: 8x mas barato que Supabase para el mismo uso
2. **Especializado en video**: Transcoding, CDN y player incluidos
3. **Simplicidad**: API sencilla, integracion rapida
4. **Escalabilidad**: Preparado para crecer sin cambios de arquitectura

### Arquitectura Propuesta

```
┌─────────────────────────┐
│      Frontend React     │
│   (Player Bunny embed)  │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐     ┌─────────────────────┐
│      Supabase DB        │     │    Bunny Stream     │
│  ─────────────────────  │     │  ─────────────────  │
│  ejercicios             │     │  - Videos MP4       │
│    └─ video_id (ref)────┼────▶│  - Transcoding HLS  │
│    └─ video_url         │     │  - CDN Global       │
│                         │     │  - Player embed     │
└─────────────────────────┘     └─────────────────────┘
```

### Flujo de Subida

1. Usuario selecciona video en el formulario
2. Frontend sube directamente a Bunny via API
3. Bunny devuelve `video_id` y `embed_url`
4. Se guarda referencia en Supabase (`ejercicios.video_id`)

### Flujo de Reproduccion

1. Usuario abre detalle de ejercicio
2. Se carga el player embed de Bunny con la URL guardada
3. Video se reproduce via CDN global

---

## Implementacion Tecnica

### Cambios en Base de Datos

```sql
-- Añadir columnas a ejercicios
ALTER TABLE ejercicios
ADD COLUMN video_id TEXT,
ADD COLUMN video_url TEXT,
ADD COLUMN video_thumbnail TEXT;
```

### Variables de Entorno Necesarias

```env
BUNNY_API_KEY=xxx
BUNNY_LIBRARY_ID=xxx
BUNNY_CDN_HOSTNAME=xxx.b-cdn.net
```

### Componentes Frontend

- `VideoUploader`: Componente para subir videos
- `VideoPlayer`: Wrapper del player embed de Bunny
- Modificacion de `EjercicioFormInline` para incluir upload

---

## Timeline Estimado

| Fase | Tareas | Esfuerzo |
|------|--------|----------|
| 1. Setup | Cuenta Bunny, API keys, migracion DB | 2h |
| 2. Backend | Integracion API Bunny, Edge Function | 4h |
| 3. Frontend | Componentes upload y player | 6h |
| 4. Testing | Pruebas E2E, optimizacion | 4h |

**Total estimado: 16 horas**

---

## Alternativa Conservadora

Si se prefiere mantener todo en Supabase inicialmente:

- Usar Supabase Storage para empezar
- Limitar videos a 720p para reducir bandwidth
- Migrar a Bunny cuando el coste justifique el cambio

**Nota:** Esta opcion es ~8x mas cara pero evita gestionar un servicio adicional.

---

## Conclusion

**Bunny.net Stream** es la opcion recomendada por:
- Mejor relacion precio/rendimiento
- Funcionalidades especificas para video
- Escalabilidad sin cambios arquitectonicos
- Implementacion relativamente sencilla

---

*Documento preparado: Diciembre 2024*
*Proyecto: PadeLock - Biblioteca de Ejercicios*
