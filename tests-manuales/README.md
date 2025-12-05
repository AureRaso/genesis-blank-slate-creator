# 🧪 Tests Manuales

Esta carpeta contiene scripts JavaScript para testing manual, debugging y análisis de datos.

## 📂 Tipos de Scripts

### Scripts de Debug (debug-*.js)
Scripts para diagnosticar problemas específicos:
- debug-class-participants.js
- debug-player-payments.js

### Scripts de Testing (test-*.js)
Scripts para probar funcionalidades:
- test-attendance-reminder.js
- test-attendance-reminder-node.js
- test-cancel-class.js
- test-reminder.js
- test-busqueda.cjs

### Scripts de Investigación (investigate-*.js)
Scripts para analizar comportamiento:
- investigate-morning-report.js
- investigate-notifications.js

### Scripts de Búsqueda (buscar-*.cjs)
Scripts para búsqueda de datos de clubes:
- buscar-telefonos-clubes.cjs
- buscar-telefonos-clubes-avanzado.cjs
- buscar-con-google-api.cjs

### Scripts de Análisis (analizar-*.cjs)
Scripts de análisis de datos:
- analizar-clubes-por-pais.cjs

### Otros
- check-participation-update.js
- check-whapi-messages.js
- list-profiles.js

## 🚀 Cómo Ejecutar

### Node.js Scripts (.js)
```bash
node tests-manuales/nombre-del-script.js
```

### CommonJS Scripts (.cjs)
```bash
node tests-manuales/nombre-del-script.cjs
```

## ⚠️ Notas Importantes

1. **Variables de entorno**: Asegúrate de tener .env configurado
2. **Database access**: Algunos scripts requieren DATABASE_URL
3. **API keys**: Scripts de Google API necesitan GOOGLE_API_KEY

## 🔗 Ver También
- ../documentacion/ - Documentación técnica
- ../configuraciones/ - Guías de configuración
- ../migrations/ - Scripts SQL
