// Script para enviar recordatorio manual a Micaela Screpanti
// Número italiano: +39 371 165 3550

const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const KAPSO_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-class-reminder-kapso`;

const student = {
  studentName: 'Micaela Screpanti',
  email: 'screpanti.micaela@gmail.com',
  className: 'Jueves - Pista 2',
  startTime: '21:00:00',
  clubName: 'Hespérides Padel',
  // Usamos guardianPhone para pasar el número directamente (ya que el de la BD está mal)
  guardianPhone: '393711653550'
};

const DURATION_MINUTES = 60;
const TEST_SECRET = 'whatsapp-test-2025';

async function sendReminder() {
  console.log('='.repeat(60));
  console.log('ENVÍO MANUAL DE RECORDATORIO - Micaela Screpanti');
  console.log('Número italiano: +39 371 165 3550');
  console.log('='.repeat(60));

  console.log(`\n📱 Enviando a ${student.studentName} (${student.email})...`);

  try {
    // Primero necesitamos obtener un participation_id válido
    // Por ahora usamos uno genérico ya que el botón "No puedo ir"
    // solo funciona si el ID existe en la BD
    const response = await fetch(KAPSO_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: student.email,
        participationId: 'manual-reminder-micaela', // ID placeholder
        className: student.className,
        startTime: student.startTime,
        durationMinutes: DURATION_MINUTES,
        clubName: student.clubName,
        studentName: student.studentName,
        guardianPhone: student.guardianPhone,
        testSecret: TEST_SECRET
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`   ✅ Enviado correctamente`);
      console.log(`   📞 Número: ${student.guardianPhone}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }

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
