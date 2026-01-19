# ESTUDIO DE COSTOS - WhatsApp Business API vs Whapi.cloud
## Análisis Comparativo para Padelock - 2025

---

## RESUMEN EJECUTIVO

**Volumen actual estimado:** 60-100 mensajes/día (6 clubs activos)
**Tipo de mensajes:** Utility (recordatorios de clases)

**Conclusión rápida:**
- 🟢 **Whapi.cloud**: €33/mes (fijo, sin sorpresas)
- 🔴 **WhatsApp API oficial**: €18-60/mes (variable + complejidad técnica)

---

## 1. WHAPI.CLOUD (Solución Actual)

### Precio Mensual:
- **Plan estándar**: $35/mes (~€33/mes) por canal
- **Plan anual**: $29/mes (~€27/mes) si pagas anualmente

### Ventajas:
✅ **Precio fijo** - No importa cuántos mensajes envíes
✅ **Sin cargos por mensaje** - 0€ adicionales
✅ **Fácil implementación** - Ya funciona con tu código
✅ **Sin aprobación de Meta** - Listo en minutos
✅ **Cambio de número gratis** - Puedes cambiar la eSIM sin coste
✅ **Soporte técnico** incluido
✅ **No requiere Meta Business Manager**

### Desventajas:
⚠️ **No es oficial** - Usa WhatsApp Web (riesgo de ban si abusas)
⚠️ **Requiere número activo** - Necesitas mantener la eSIM
⚠️ **Límites no documentados** - WhatsApp puede banear sin aviso
⚠️ **Menos estable** que API oficial

### Costo Anual:
- **Mensual**: €33 × 12 = **€396/año**
- **Anual**: €27 × 12 = **€324/año**

---

## 2. WHATSAPP BUSINESS API OFICIAL (Meta)

### Modelo de Precios (desde 1 julio 2025):
**Por mensaje entregado** (ya NO por conversaciones)

### Categorías de Mensajes:

#### A. Utility Messages (Tu caso: recordatorios de clases)
**Precio en España (estimado basado en fuentes):**
- **~€0.009 - €0.015 por mensaje** (0.9-1.5 céntimos)
- Algunas fuentes mencionan desde €0.004 para volúmenes altos

#### B. Marketing Messages
- **~€0.025 - €0.045 por mensaje** (2.5-4.5 céntimos)

#### C. Authentication Messages
- **~€0.005 - €0.010 por mensaje** (0.5-1 céntimo)

#### D. Service Messages
- **GRATIS** si respondes dentro de 24h después de que el cliente te escriba

### Ventana de Servicio 24h:
Si un alumno te escribe primero:
- ✅ Tienes 24h para responder GRATIS (texto libre o templates utility)
- ❌ Marketing/Authentication templates SÍ se cobran incluso en esa ventana

### Descuentos por Volumen:
WhatsApp ofrece descuentos automáticos según volumen mensual:
- **Nivel 1**: 0-1,000 mensajes → Precio base
- **Nivel 2**: 1,001-10,000 mensajes → Descuento pequeño
- **Nivel 3**: 10,001-100,000 mensajes → Descuento mayor
- **Nivel 4**: 100,001+ mensajes → Máximo descuento

### Ventajas:
✅ **Oficial de Meta** - Sin riesgo de ban por usar API no oficial
✅ **Más estable** - Infraestructura oficial
✅ **Escalable** - Soporta millones de mensajes
✅ **Mejor deliverability** - Tasa de entrega más alta
✅ **Funciones avanzadas** - Botones, listas, catálogos, pagos
✅ **Métricas oficiales** - Analytics de Meta
✅ **Número verificado** - Marca verde oficial

### Desventajas:
❌ **Proceso de aprobación** - Puede tardar 1-4 semanas
❌ **Requiere Meta Business Manager** - Configuración compleja
❌ **Verificación de empresa** - Documentación legal requerida
❌ **Templates pre-aprobados** - Debes enviar plantillas a Meta para aprobación
❌ **Costos variables** - Difícil predecir gasto exacto
❌ **Complejidad técnica** - Integración más compleja
❌ **Requiere proveedor BSP** - Twilio, Vonage, etc. (costes adicionales)

---

## 3. CÁLCULO DE COSTOS MENSUALES

### Escenario Actual (6 clubs):
**Volumen estimado:**
- 60-100 mensajes/día
- ~2,000-3,000 mensajes/mes

### WHAPI.CLOUD:
```
Costo mensual: €33 (fijo)
Costo anual: €396
```

### WHATSAPP API OFICIAL:

#### Opción A: Utility Messages a €0.012/mensaje (precio medio)
```
2,000 mensajes × €0.012 = €24/mes
3,000 mensajes × €0.012 = €36/mes

Costo anual: €288 - €432/año
```

#### Opción B: Utility Messages a €0.009/mensaje (con descuento volumen)
```
2,000 mensajes × €0.009 = €18/mes
3,000 mensajes × €0.009 = €27/mes

Costo anual: €216 - €324/año
```

#### Opción C: Utility Messages a €0.015/mensaje (precio alto)
```
2,000 mensajes × €0.015 = €30/mes
3,000 mensajes × €0.015 = €45/mes

Costo anual: €360 - €540/año
```

**+ Costos del proveedor BSP (Business Solution Provider):**
- Twilio: $0.005/mensaje adicional (~€0.0047)
- Vonage: Similar a Twilio
- Otros BSP: Variable

**Costo real con BSP:**
```
Mensajes Meta: €36/mes
Mensajes BSP: 3,000 × €0.0047 = €14/mes
TOTAL: €50/mes (~€600/año)
```

---

## 4. COMPARACIÓN DIRECTA

| Concepto | Whapi.cloud | WhatsApp API Oficial |
|----------|-------------|----------------------|
| **Costo mensual (bajo volumen)** | €33 | €18-30 + €14 BSP = €32-44 |
| **Costo mensual (alto volumen)** | €33 | €36-45 + €21 BSP = €57-66 |
| **Costo anual** | €396 | €384-792 |
| **Precio por mensaje** | €0 | €0.009-0.015 + BSP |
| **Tiempo de setup** | 10 minutos | 2-4 semanas |
| **Complejidad técnica** | Baja | Alta |
| **Aprobación requerida** | No | Sí (Meta + BSP) |
| **Riesgo de ban** | Medio-Alto | Muy Bajo |
| **Escalabilidad** | Limitada | Ilimitada |
| **Soporte oficial** | Tercero | Meta + BSP |

---

## 5. ESCENARIOS DE CRECIMIENTO

### Si creces a 15 clubs (x2.5 el volumen):
**Volumen:** ~7,500 mensajes/mes

#### Whapi.cloud:
```
Costo: €33/mes (sin cambio)
Anual: €396
```

#### WhatsApp API:
```
Meta: 7,500 × €0.010 = €75/mes (con descuento por volumen)
BSP: 7,500 × €0.0047 = €35/mes
TOTAL: €110/mes
Anual: €1,320
```

### Si creces a 30 clubs (x5 el volumen):
**Volumen:** ~15,000 mensajes/mes

#### Whapi.cloud:
```
Costo: €33/mes (sin cambio)
Anual: €396
```

#### WhatsApp API:
```
Meta: 15,000 × €0.008 = €120/mes (mejor descuento)
BSP: 15,000 × €0.0047 = €70/mes
TOTAL: €190/mes
Anual: €2,280
```

---

## 6. COSTOS ADICIONALES NO MONETARIOS

### Whapi.cloud:
- ⏱️ **Tiempo de mantenimiento**: Bajo (solo cambiar eSIM si hay problemas)
- 🛠️ **Tiempo de desarrollo**: 0h (ya está implementado)
- 📞 **Soporte técnico**: Incluido en plan
- 🔧 **Actualizaciones**: Automáticas

### WhatsApp API Oficial:
- ⏱️ **Tiempo de setup inicial**: 40-80 horas (documentación, aprobación, integración)
- 📝 **Gestión de templates**: 2-3 horas/mes (crear, enviar a aprobación, actualizar)
- 🛠️ **Mantenimiento**: 5-10 horas/mes
- 💰 **Costo oportunidad**: ~€2,000-4,000 en tiempo de desarrollo

---

## 7. ANÁLISIS DE RIESGO

### Whapi.cloud - Riesgos:
🔴 **Ban de WhatsApp** (ya ocurrió)
- Probabilidad: Media-Alta si no se gestiona bien
- Impacto: Alto (servicio interrumpido)
- Mitigación: Escalado gradual + delays + monitoreo

🟡 **Servicio no oficial**
- Probabilidad: Baja (Whapi lleva años operando)
- Impacto: Medio (buscar alternativa)

### WhatsApp API Oficial - Riesgos:
🟢 **Ban de WhatsApp**
- Probabilidad: Muy baja (API oficial)
- Impacto: Casi imposible si sigues políticas

🟡 **Costos variables**
- Probabilidad: Alta (depende de uso)
- Impacto: Medio (presupuesto impredecible)

🟡 **Complejidad técnica**
- Probabilidad: Alta
- Impacto: Alto (tiempo de desarrollo)

---

## 8. RECOMENDACIÓN FINAL

### ✅ MANTENER WHAPI.CLOUD SI:
1. Volumen < 10,000 mensajes/mes
2. Presupuesto ajustado
3. No tienes recursos para desarrollo (40-80h)
4. Necesitas simplicidad
5. Puedes gestionar riesgo de ban con escalado gradual

### ✅ MIGRAR A WHATSAPP API OFICIAL SI:
1. Volumen > 15,000 mensajes/mes
2. Tienes presupuesto para desarrollo inicial
3. Necesitas estabilidad a largo plazo
4. Planeas escalar mucho (50+ clubs)
5. Quieres marca verificada oficial

---

## 9. PLAN DE ACCIÓN RECOMENDADO

### CORTO PLAZO (Próximos 3 meses):
1. ✅ **Mantener Whapi.cloud**
2. ✅ Implementar calentamiento gradual de nueva cuenta
3. ✅ Configurar delays apropiados (2-3 segundos)
4. ✅ Escalar clubs progresivamente
5. ✅ Monitorear métricas de envío

### MEDIANO PLAZO (3-6 meses):
1. Evaluar volumen real de mensajes
2. Si volumen > 10,000/mes → Iniciar proceso de WhatsApp API oficial
3. Si volumen < 10,000/mes → Continuar con Whapi.cloud

### LARGO PLAZO (6-12 meses):
1. Si estás escalando rápido → Migrar a API oficial
2. Si volumen es estable y bajo → Mantener Whapi.cloud

---

## 10. COSTOS COMPARADOS - TABLA RESUMEN

| Clubs | Mensajes/mes | Whapi.cloud | WhatsApp API | Diferencia | Ganador |
|-------|--------------|-------------|--------------|------------|---------|
| 6 | 3,000 | €33 | €50 | +€17 | 🟢 Whapi |
| 10 | 5,000 | €33 | €70 | +€37 | 🟢 Whapi |
| 15 | 7,500 | €33 | €110 | +€77 | 🟢 Whapi |
| 20 | 10,000 | €33 | €140 | +€107 | 🟢 Whapi |
| 30 | 15,000 | €33 | €190 | +€157 | 🟢 Whapi |
| 50 | 25,000 | €33 | €270 | +€237 | 🟢 Whapi |

**Conclusión:** Whapi.cloud es **MÁS BARATO** en todos los escenarios de volumen razonable.

---

## 11. PUNTO DE EQUILIBRIO

¿Cuándo sería más barato WhatsApp API?

**Nunca**, a menos que:
- Meta baje precios significativamente
- Encuentres un BSP sin costos adicionales
- Tengas volumen tan bajo que €18/mes < €33/mes

Calculando el punto donde API oficial sería más barato:
```
Whapi: €33/mes fijo
API: (mensajes × €0.009) + (mensajes × €0.0047)
API: mensajes × €0.0137

€33 = mensajes × €0.0137
mensajes = €33 / €0.0137
mensajes = 2,408

Con MENOS de 2,408 mensajes/mes, API oficial PODRÍA ser más barato
Con MÁS de 2,408 mensajes/mes, Whapi.cloud ES más barato
```

**Tu volumen actual:** 3,000 mensajes/mes → **Whapi.cloud gana**

---

## FUENTES

- [WhatsApp Business API Pricing 2025 Guide](https://www.linkmobility.com/blog/whatsapp-business-api-pricing-2025-guide)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [WhatsApp API Pricing in Spain 2025](https://www.heltar.com/blogs/whatsapp-api-pricing-in-spain-2025-cm7fsszes004fip0ldjv0xfuc)
- [Whapi.cloud Pricing](https://whapi.cloud/price)
- [WhatsApp Business API Pricing Calculator](https://respond.io/whatsapp-pricing-calculator)

---

**Estudio realizado:** 29 diciembre 2025
**Próxima revisión recomendada:** Marzo 2026
