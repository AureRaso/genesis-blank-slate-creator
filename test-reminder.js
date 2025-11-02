// Script temporal para probar el recordatorio diario
import https from 'https';

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc0MjY4NSwiZXhwIjoyMDM1MzE4Njg1fQ.Lh-LKVpEFjVz1r5f9FdLHu9OJ4Mg_KS8JvBX-ZCZ-i4';

const options = {
  hostname: 'hwwvtxyezhgmhyxjpnvl.supabase.co',
  port: 443,
  path: '/functions/v1/daily-attendance-reminder',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  }
};

console.log('🚀 Invocando la función de recordatorio diario...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📊 Status:', res.statusCode);
    console.log('\n📦 Respuesta:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));

      if (json.success) {
        console.log(`\n✅ ¡Éxito! Se enviaron recordatorios a ${json.successCount} grupos`);
        console.log(`❌ Fallos: ${json.failureCount}`);
      } else {
        console.log('\n❌ Error:', json.error);
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write('{}');
req.end();
