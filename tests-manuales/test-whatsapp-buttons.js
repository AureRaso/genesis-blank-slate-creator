// Test script to send WhatsApp message with buttons using Whapi
// Run with: node test-whatsapp-buttons.js

const WHAPI_TOKEN = process.env.WHAPI_TOKEN || 'Oo0UhiZVhcBN8JEeK65D547iNwBKO2oL';
const WHAPI_ENDPOINT = 'https://gate.whapi.cloud';

// Your phone number (Gal's number for testing)
const TO_PHONE = '34662632906@s.whatsapp.net';

const message = `Hola ff! 👋

Recordatorio de tu clase de MAÑANA:

📍 Clase: Padelrock - Clase de Mañana
⏰ Horario: Por confirmar
🎾 Pista: Por asignar
✅ Asistencia confirmada

⚠️ Recuerda: Si no puedes asistir, pulsa el botón de abajo.

🔗 También puedes marcarlo en: https://www.padelock.com/auth

¡Nos vemos en la pista! 🎾`;

const buttons = [
  {
    type: 'quick_reply',
    id: 'absence_bfb54b55-3faf-4ea1-9882-c48b06bad4f9',
    title: '❌ No puedo ir'
  }
];

const requestBody = {
  to: TO_PHONE,
  type: 'button',
  body: {
    text: message
  },
  action: {
    buttons: buttons
  }
};

console.log('📤 Sending WhatsApp message with buttons...');
console.log('Request body:', JSON.stringify(requestBody, null, 2));

fetch(`${WHAPI_ENDPOINT}/messages/interactive`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${WHAPI_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
})
.then(response => {
  console.log('\n📥 Response status:', response.status);
  return response.text();
})
.then(text => {
  console.log('📥 Response body:', text);
  try {
    const json = JSON.parse(text);
    console.log('📥 Parsed JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('(Not valid JSON)');
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
