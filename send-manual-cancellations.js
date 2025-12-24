// Script para enviar mensajes de cancelación manualmente a los afectados por el bug
// Ejecutar con: node send-manual-cancellations.js

const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const WHAPI_ENDPOINT = 'https://gate.whapi.cloud';

if (!WHAPI_TOKEN) {
  console.error('❌ Error: WHAPI_TOKEN no está configurado');
  console.log('Ejecuta: set WHAPI_TOKEN=tu_token (Windows) o export WHAPI_TOKEN=tu_token (Linux/Mac)');
  process.exit(1);
}

// Datos de los 10 afectados
const affectedUsers = [
  {
    full_name: "Sofía López Cuevas",
    phone: "633530032",
    class_name: "Recuperación navidad",
    start_time: "12:00",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Carlos Aragón",
    phone: "684006782",
    class_name: "Martes Pista - 1",
    start_time: "18:00",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Alvaro Naranjo Santiago",
    phone: "651329824",
    class_name: "Martes - Pista 1",
    start_time: "19:00",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "carlos rivas llamas",
    phone: "682894108",
    class_name: "Martes - Pista 1",
    start_time: "19:00",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Jesús Martín",
    phone: "635567375",
    class_name: "Martes - Pista 1",
    start_time: "19:00",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Enrique Rodriguez",
    phone: "665837110",
    class_name: "Martes - Pista 1",
    start_time: "20:30",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Gerardo Garcia Muñoz",
    phone: "675530274",
    class_name: "Martes - Pista 1",
    start_time: "20:30",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Manuel Jesus Rodríguez Suarez",
    phone: "670525529",
    class_name: "Martes - Pista 1",
    start_time: "20:30",
    cancelled_date: "2025-12-23",
    reason: "Lluvia"
  },
  {
    full_name: "Marta Lazaro braña",
    phone: "695664580",
    class_name: "Martes - Pista 3",
    start_time: "21:30",
    cancelled_date: "2025-12-23",
    reason: "Cancelada por profesor/admin"
  },
  {
    full_name: "Miguel Lopez",
    phone: "666156275",
    class_name: "Martes - Pista 3",
    start_time: "21:30",
    cancelled_date: "2025-12-23",
    reason: "Cancelada por profesor/admin"
  }
];

function formatPhoneNumber(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = '34' + digits;
  }
  return `${digits}@s.whatsapp.net`;
}

function formatDateInSpanish(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function formatCancellationMessage(user) {
  const formattedDate = formatDateInSpanish(user.cancelled_date);

  let message = `Hola ${user.full_name},

Tu clase ha sido cancelada:

📍 ${user.class_name}
📅 ${formattedDate}
⏰ ${user.start_time}

Lamentamos los inconvenientes.`;

  if (user.reason) {
    message += `\n\n📝 Motivo: ${user.reason}`;
  }

  message += `\n\n¿Dudas? Contacta con tu club.`;

  return message;
}

async function sendMessage(user) {
  const formattedPhone = formatPhoneNumber(user.phone);
  const message = formatCancellationMessage(user);

  console.log(`\n📤 Enviando a ${user.full_name} (${formattedPhone})...`);

  try {
    const response = await fetch(`${WHAPI_ENDPOINT}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} - ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Enviado correctamente (ID: ${result.id || result.message_id})`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Enviando mensajes de cancelación manuales ===');
  console.log(`Total de usuarios afectados: ${affectedUsers.length}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const user of affectedUsers) {
    const success = await sendMessage(user);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    // Esperar 500ms entre mensajes para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n=== Resumen ===');
  console.log(`✅ Enviados: ${successCount}`);
  console.log(`❌ Fallidos: ${failureCount}`);
}

main();
