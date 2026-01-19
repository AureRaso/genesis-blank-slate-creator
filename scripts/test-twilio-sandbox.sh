#!/bin/bash
# ===========================================
# SCRIPT DE PRUEBA - TWILIO WHATSAPP SANDBOX
# ===========================================
# Este script envía un mensaje de prueba usando la API de Twilio
# IMPORTANTE: Antes de ejecutar, el destinatario debe unirse al sandbox
# enviando "join <palabra-clave>" al +14155238886

# Cargar variables desde .env.twilio
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env.twilio" ]; then
    export $(cat "$PROJECT_DIR/.env.twilio" | grep -v '^#' | xargs)
else
    echo "Error: No se encontró .env.twilio"
    echo "Copia .env.twilio.example a .env.twilio y rellena las credenciales"
    exit 1
fi

# Configuración
ACCOUNT_SID="${TWILIO_ACCOUNT_SID}"
AUTH_TOKEN="${TWILIO_AUTH_TOKEN}"
FROM_NUMBER="${TWILIO_WHATSAPP_FROM:-+14155238886}"
TO_NUMBER="${TWILIO_TEST_PHONE:-+34662632906}"
CONTENT_SID="${TWILIO_CONTENT_SID:-HXb5b62575e6e4ff6129ad7c8efe1f983e}"

# Variables del mensaje (fecha y hora de ejemplo)
DATE_VAR="30/12"
TIME_VAR="18:00"

echo "=========================================="
echo "  PRUEBA DE TWILIO WHATSAPP SANDBOX"
echo "=========================================="
echo ""
echo "Configuración:"
echo "  Account SID: ${ACCOUNT_SID:0:10}..."
echo "  From: whatsapp:$FROM_NUMBER"
echo "  To: whatsapp:$TO_NUMBER"
echo "  Template: $CONTENT_SID"
echo "  Variables: fecha=$DATE_VAR, hora=$TIME_VAR"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de haber enviado 'join <palabra>' al +14155238886"
echo ""
read -p "¿Continuar con el envío? (s/n): " confirm

if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "Enviando mensaje..."
echo ""

# Ejecutar curl
response=$(curl -s -w "\n%{http_code}" \
    "https://api.twilio.com/2010-04-01/Accounts/$ACCOUNT_SID/Messages.json" \
    -X POST \
    --data-urlencode "To=whatsapp:$TO_NUMBER" \
    --data-urlencode "From=whatsapp:$FROM_NUMBER" \
    --data-urlencode "ContentSid=$CONTENT_SID" \
    --data-urlencode "ContentVariables={\"1\":\"$DATE_VAR\", \"2\":\"$TIME_VAR\"}" \
    -u "$ACCOUNT_SID:$AUTH_TOKEN")

# Separar respuesta y código HTTP
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "=========================================="
echo "  RESULTADO"
echo "=========================================="
echo ""
echo "HTTP Status: $http_code"
echo ""
echo "Respuesta:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" == "201" ]; then
    echo "✅ Mensaje enviado correctamente!"
    echo ""
    echo "Revisa tu WhatsApp en el número $TO_NUMBER"
elif [ "$http_code" == "400" ]; then
    echo "❌ Error 400: Solicitud inválida"
    echo "Posibles causas:"
    echo "  - El número no se ha unido al sandbox"
    echo "  - Template SID incorrecto"
elif [ "$http_code" == "401" ]; then
    echo "❌ Error 401: Credenciales inválidas"
    echo "Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN"
elif [ "$http_code" == "403" ]; then
    echo "❌ Error 403: No autorizado"
    echo "El número debe unirse al sandbox primero"
else
    echo "❌ Error inesperado: $http_code"
fi
