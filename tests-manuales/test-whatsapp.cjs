/**
 * Script de prueba para enviar mensajes de WhatsApp a usuarios de prueba
 *
 * Uso:
 *   node test-whatsapp.js mark20@gmail.com
 *   node test-whatsapp.js mark@gmail.com
 *   node test-whatsapp.js both  (envía a ambos usuarios)
 */

const https = require('https');

// Configuración
const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MzYwMjgsImV4cCI6MjA0NzAxMjAyOH0.7-YQyRy8eKZjdPNFPxbY1iqZqOnJrL6Mfl4yUzgPkQA';

// Usuarios de prueba
const testUsers = ['mark20@gmail.com', 'mark@gmail.com'];

/**
 * Enviar mensaje de WhatsApp de prueba
 */
async function sendTestWhatsApp(userEmail) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      userEmail: userEmail,
      message: `¡Hola! 👋 Este es un mensaje de prueba de PadeLock.\n\nTu correo registrado es: ${userEmail}\n\nSi recibes este mensaje, significa que las notificaciones de WhatsApp están funcionando correctamente. ✅`,
      testSecret: 'whatsapp-test-2025'
    });

    const options = {
      hostname: 'hwwvtxyezhgmhyxjpnvl.supabase.co',
      port: 443,
      path: '/functions/v1/send-test-whatsapp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      // Desactivar verificación SSL en caso de problemas con certificados
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (e) {
          resolve({
            error: e.message,
            raw: responseData,
            statusCode: res.statusCode
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'both';

  console.log('🚀 Iniciando prueba de mensajes de WhatsApp...\n');

  let usersToTest = [];

  if (target === 'both') {
    usersToTest = testUsers;
  } else if (testUsers.includes(target)) {
    usersToTest = [target];
  } else {
    console.error('❌ Usuario no válido. Usa: mark20@gmail.com, mark@gmail.com o "both"');
    process.exit(1);
  }

  for (const userEmail of usersToTest) {
    console.log(`📱 Enviando mensaje de prueba a: ${userEmail}`);

    try {
      const result = await sendTestWhatsApp(userEmail);

      if (result.success) {
        console.log('✅ Mensaje enviado correctamente!');
        console.log('   - Email:', result.userEmail);
        console.log('   - Teléfono:', result.phone);
        console.log('   - Teléfono formateado:', result.formattedPhone);
        console.log('   - Message ID:', result.messageId);
      } else {
        console.error('❌ Error:');
        if (result.raw) {
          console.error('   - Status Code:', result.statusCode);
          console.error('   - Parse Error:', result.error);
          console.error('   - Raw Response:', result.raw);
        } else {
          console.error('   -', result.error || JSON.stringify(result));
        }
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
    }

    console.log(''); // Línea en blanco

    // Esperar 3 segundos entre mensajes para evitar rate limiting
    if (usersToTest.length > 1 && userEmail !== usersToTest[usersToTest.length - 1]) {
      console.log('⏳ Esperando 3 segundos antes del siguiente envío...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('✨ Prueba completada!');
}

main().catch(console.error);
