#!/bin/bash

# ============================================
# SCRIPT DE ENVÍO MANUAL - MENSAJES PERDIDOS
# ============================================
# Envía los 62 mensajes perdidos del domingo 28 dic
# mediante curl con 10 segundos de delay entre cada uno
#
# IMPORTANTE: Configura las variables de entorno antes de ejecutar
# ============================================

# Configuración
SUPABASE_URL="${SUPABASE_URL:-https://hwwvtxyezhgmhyxjpnvl.supabase.co}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
WHATSAPP_REMINDER_URL="${WHATSAPP_REMINDER_URL:-https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/send-class-reminder-whatsapp}"
DELAY_SECONDS=10

# Validar variables de entorno
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurada"
  echo "Ejecuta: export SUPABASE_SERVICE_ROLE_KEY='tu-clave-aqui'"
  exit 1
fi

echo "============================================"
echo "📱 ENVÍO MANUAL DE MENSAJES PERDIDOS"
echo "============================================"
echo "Fecha: $(date)"
echo "Mensajes a enviar: 50 (clases >= 19:30h)"
echo "Delay entre mensajes: ${DELAY_SECONDS} segundos"
echo "Tiempo total estimado: $((50 * DELAY_SECONDS / 60)) minutos"
echo "============================================"
echo ""

# Función para enviar mensaje
send_message() {
  local email=$1
  local count=$2
  local total=$3

  echo "[$count/$total] Enviando a: $email"

  response=$(curl -s -w "\n%{http_code}" -X POST "$WHATSAPP_REMINDER_URL" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"userEmail\":\"$email\"}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo "   ✅ Enviado correctamente"
  else
    echo "   ❌ Error (HTTP $http_code): $body"
  fi

  # Delay entre mensajes (excepto en el último)
  if [ $count -lt $total ]; then
    echo "   ⏳ Esperando ${DELAY_SECONDS} segundos..."
    sleep $DELAY_SECONDS
  fi
  echo ""
}

# Lista de emails (50 mensajes - solo clases >= 19:30h)
# Ordenados por club y hora
emails=(
  # Escuela Pádel Fuente Viña (8 mensajes - EXCLUYE 19:00)
  "adriangutierrez.cj@gmail.com"
  "albertorodrizg@gmail.com"
  "alfonsoroldanmartin06@gmail.com"
  "carloscarmona97@gmail.com"
  "carlos-gamero@hotmail.com"
  "juani-carmona@hotmail.com"
  "lorenrga@gmail.com"
  "manolo.rivas.llamas@gmail.com"

  # Hespérides Padel (18 mensajes - EXCLUYE 19:00)
  "carrerovilloria.celia@gmail.com"
  "cesargaldor@gmail.com"
  "emmamartinezgomez@gmail.com"
  "josbermir@gmail.com"
  "lauraabernaal@gmail.com"
  "alejandro.caballero.calvo@gmail.com"
  "alefdz95@gmail.com"
  "almudena.gomezcam@gmail.com"
  "8.alvaro.22@gmail.com"
  "jmoyasevilla@gmail.com"
  "mrpd@telefonica.net"
  "mariamoyavazquez@gmail.com"
  "matesal25@gmail.com"
  "addpajuelo@gmail.com"
  "gonzamartinosuna@gmail.com"
  "ivan_kortg_11@hotmail.com"
  "j.enrike@hotmail.com"
  "jmpoleyy@gmail.com"

  # La Red 21 Galisport (8 mensajes - EXCLUYE 19:00)
  "ajlc28@gmail.com"
  "carmenentrenas18@gmail.com"
  "mc.gonzalez.bbva@gmail.com"
  "merchipastor@gmail.com"
  "dprietopascual56@gmail.com"
  "info.jvconsultores@gmail.com"
  "japrietocoronel56@gmail.com"
  "josetarabita@gmail.com"

  # Wild Padel Indoor (16 mensajes - incluye 19:30)
  "franjavi_42@hotmail.com"
  "nardyeo25@gmail.com"
  "carlosdanielarenasligioiz@gmail.com"
  "carlosvinuesapolo@gmail.com"
  "hajavimiranda@gmail.com"
  "maramang@gmail.com"
  "ricardoaguilarsoria@gmail.com"
  "eliaschinchilla956@gmail.com"
  "pamope09@gmail.com"
  "adrianduranmorales98@gmail.com"
  "alejandrobernabeguerrero@gmail.com"
  "nando91cs@gmail.com"
  "frandh1997@gmail.com"
  "jriquelmelopez@gmail.com"
  "moisesespinosaperez@hotmail.com"
  "raul.raul.garcia@hotmail.com"
)

total_emails=${#emails[@]}

echo "🚀 Iniciando envío de $total_emails mensajes..."
echo ""

# Enviar todos los mensajes
count=1
for email in "${emails[@]}"; do
  send_message "$email" $count $total_emails
  count=$((count + 1))
done

echo "============================================"
echo "✅ PROCESO COMPLETADO"
echo "============================================"
echo "Total de mensajes procesados: $total_emails"
echo "Fecha de finalización: $(date)"
echo "============================================"
