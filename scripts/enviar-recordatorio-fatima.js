// Script para enviar recordatorio manual a Fatima Balda Constantin
// La Red 21 Galisport

const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const KAPSO_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-class-reminder-kapso`;

const student = {
  studentName: 'Fatima Balda Constantin',
  email: 'fatix87@hotmail.com',
  className: 'Jueves - Pista 5',
  startTime: '21:00:00',
  clubName: 'La Red 21 Galisport',
  phone: '646721508' // Número español correcto
};

const DURATION_MINUTES = 60;
const TEST_SECRET = 'whatsapp-test-2025';

async function sendReminder() {
  console.log('='.repeat(60));
  console.log('ENVÍO MANUAL DE RECORDATORIO - Fatima Balda Constantin');
  console.log('Número: +34 646 721 508');
  console.log('='.repeat(60));

  console.log(`\n📱 Enviando a ${student.studentName} (${student.email})...`);

  try {
    const response = await fetch(KAPSO_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: student.email,
        participationId: 'manual-reminder-fatima',
        className: student.className,
        startTime: student.startTime,
        durationMinutes: DURATION_MINUTES,
        clubName: student.clubName,
        studentName: student.studentName,
        testSecret: TEST_SECRET
        // No usamos guardianPhone, así que buscará el teléfono en la BD
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`   ✅ Enviado correctamente`);
      console.log(`   📞 Teléfono usado: ${result.phone || student.phone}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }

    console.log('\nRespuesta completa:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return { success: false, error: error.message };
  }
}

sendReminder().then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO:', result.success ? '✅ ENVIADO' : '❌ FALLIDO');
  console.log('='.repeat(60));
});
