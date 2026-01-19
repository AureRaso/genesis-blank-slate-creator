// Script para enviar recordatorios manuales a los alumnos de La Red 21
// que no recibieron el mensaje a las 17:00

const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const KAPSO_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-class-reminder-kapso`;

// Alumnos que NO recibieron mensaje - IDs obtenidos de la BD
// NOTA: Solo incluimos Pista 1 porque Pista 4 no aparece en los resultados de la consulta
const studentsToNotify = [
  {
    participationId: 'd489ac1e-1975-40aa-9e92-286f7ccbc4d9',
    studentName: 'Adriana Lasheras Fondon',
    email: 'alasherasfondon24@gmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  },
  {
    participationId: '350edbf6-1379-451a-8a1c-66ae558a75f0',
    studentName: 'Anna Doubova',
    email: 'anna.doubova@gmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  },
  {
    participationId: '728ffe54-0258-4bba-a5fd-69813ea66b87',
    studentName: 'Diego Martínez Sáez',
    email: 'dimarsae44@gmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  },
  {
    participationId: '19ce6785-014b-4720-abf7-2aaa0935da97',
    studentName: 'Jacobo Lozano montoya',
    email: 'jacobolozano@hotmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  },
  {
    participationId: 'a3eb828b-d0d8-4d19-a715-d23fdaa8507c',
    studentName: 'Jaime Campos González',
    email: 'jaimecg03@gmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  },
  {
    participationId: '38b2d9d6-6c83-49f8-8c83-18b3c1588421',
    studentName: 'Javier Burgos Martin',
    email: 'javburmar@gmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  },
  {
    participationId: 'ff06cd23-ef66-4f3c-af8f-163e73691b58',
    studentName: 'Miguel Anzola',
    email: 'anzolamiguel8@gmail.com',
    className: 'Jueves - Pista 1',
    startTime: '17:00:00'
  }
];

const CLUB_NAME = 'La Red 21 Galisport';
const DURATION_MINUTES = 60;
const TEST_SECRET = 'whatsapp-test-2025';

async function sendReminder(student) {
  console.log(`\n📱 Enviando a ${student.studentName} (${student.email})...`);
  
  try {
    const response = await fetch(KAPSO_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: student.email,
        participationId: student.participationId,
        className: student.className,
        startTime: student.startTime,
        durationMinutes: DURATION_MINUTES,
        clubName: CLUB_NAME,
        studentName: student.studentName,
        testSecret: TEST_SECRET
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`   ✅ Enviado correctamente`);
      return true;
    } else {
      console.log(`   ❌ Error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('ENVÍO MANUAL DE RECORDATORIOS - La Red 21 Galisport');
  console.log('Alumnos de Pista 1 con clases el jueves 8 enero a las 17:00');
  console.log('='.repeat(60));
  console.log(`\nTotal alumnos a notificar: ${studentsToNotify.length}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const student of studentsToNotify) {
    const success = await sendReminder(student);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Delay de 2 segundos entre mensajes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN:');
  console.log(`   ✅ Enviados: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  console.log('='.repeat(60));
}

main();
