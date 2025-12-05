/**
 * Script para testear manualmente el sistema de recordatorios de asistencia (Node.js version)
 */

const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMzNzUsImV4cCI6MjA2NjQ0OTM3NX0.At3ieLAkb6bfS46mnPfZ-pzxF7Ghv_kXFmUdiluMjlY';

console.log('🔍 VERIFICACIÓN DEL SISTEMA DE RECORDATORIOS DE ASISTENCIA');
console.log('='.repeat(60));
console.log();

async function checkUpcomingClasses() {
  console.log('1️⃣ Buscando clases en las próximas 6-7 horas...');

  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const sevenHoursFromNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const today = now.toISOString().split('T')[0];

  console.log('   📅 Fecha de hoy:', today);
  console.log('   ⏰ Ahora son las:', now.toLocaleTimeString('es-ES'));
  console.log('   🎯 Buscando clases entre:', sixHoursFromNow.toLocaleTimeString('es-ES'),
              'y', sevenHoursFromNow.toLocaleTimeString('es-ES'));
  console.log();

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/programmed_classes?select=id,name,start_time,start_date,end_date,clubs:club_id(name)&is_active=eq.true&start_date=lte.${today}&end_date=gte.${today}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Error al buscar clases:', await response.text());
      return [];
    }

    const classes = await response.json();

    // Filtrar clases que empiezan en 6-7 horas
    const targetClasses = classes.filter(cls => {
      const [hours, minutes] = cls.start_time.split(':').map(Number);
      const classDateTime = new Date(today);
      classDateTime.setHours(hours, minutes, 0, 0);

      return classDateTime >= sixHoursFromNow && classDateTime < sevenHoursFromNow;
    });

    console.log(`   📚 Clases activas hoy: ${classes.length}`);
    console.log(`   🎯 Clases en rango 6-7h: ${targetClasses.length}`);

    if (classes.length > 0) {
      console.log('\n   Todas las clases de hoy:');
      classes.forEach(cls => {
        const [hours, minutes] = cls.start_time.split(':').map(Number);
        const classDateTime = new Date(today);
        classDateTime.setHours(hours, minutes, 0, 0);
        const isInRange = classDateTime >= sixHoursFromNow && classDateTime < sevenHoursFromNow;
        const emoji = isInRange ? '🎯' : '  ';
        console.log(`   ${emoji} ${cls.name} a las ${cls.start_time} (${cls.clubs?.name || 'Sin club'})`);
      });
    }

    if (targetClasses.length > 0) {
      console.log('\n   ✅ Clases que DEBERÍAN enviar recordatorios:');
      targetClasses.forEach(cls => {
        console.log(`   - ${cls.name} a las ${cls.start_time}`);
      });
    } else {
      console.log('\n   ⚠️  No hay clases en el rango de 6-7 horas');
      console.log('   💡 Esto es normal si no hay entrenamientos programados en ese horario');
    }

    console.log();
    return targetClasses;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return [];
  }
}

async function checkParticipantsWithoutConfirmation(targetClasses) {
  console.log('2️⃣ Verificando participantes sin confirmación...');

  if (targetClasses.length === 0) {
    console.log('   ⏭️  Saltando (no hay clases en rango)');
    console.log();
    return;
  }

  for (const classInfo of targetClasses) {
    console.log(`\n   📋 Clase: ${classInfo.name} (${classInfo.start_time})`);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/class_participants?select=id,attendance_confirmed_for_date,absence_confirmed,student_enrollment:student_enrollments!student_enrollment_id(full_name,email)&class_id=eq.${classInfo.id}&status=eq.active`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('   ❌ Error:', await response.text());
        continue;
      }

      const participants = await response.json();

      const unconfirmed = participants.filter(p =>
        !p.attendance_confirmed_for_date && !p.absence_confirmed
      );

      const confirmed = participants.filter(p => p.attendance_confirmed_for_date);
      const absent = participants.filter(p => p.absence_confirmed);

      console.log(`   👥 Total participantes: ${participants.length}`);
      console.log(`   ✅ Con asistencia confirmada: ${confirmed.length}`);
      console.log(`   ❌ Con ausencia confirmada: ${absent.length}`);
      console.log(`   ⚠️  Sin confirmar: ${unconfirmed.length}`);

      if (unconfirmed.length > 0) {
        console.log('\n   📧 Estos DEBERÍAN recibir email de recordatorio:');
        unconfirmed.forEach(p => {
          console.log(`      - ${p.student_enrollment?.full_name} (${p.student_enrollment?.email})`);
        });
      } else {
        console.log('\n   ℹ️  Todos los participantes ya han confirmado (no se enviarían emails)');
      }
    } catch (err) {
      console.error('   ❌ Error:', err.message);
    }
  }

  console.log();
}

async function testEdgeFunction() {
  console.log('3️⃣ Testeando la Edge Function manualmente...');
  console.log('   🚀 Invocando send-attendance-reminders...');
  console.log();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-attendance-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('   ❌ Error al invocar la función:', data);
      return;
    }

    console.log('   ✅ Función ejecutada exitosamente!');
    console.log('   📊 Resultado:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  console.log();
}

async function showNextSteps() {
  console.log('📝 PRÓXIMOS PASOS PARA VERIFICAR EL SISTEMA:');
  console.log('='.repeat(60));
  console.log();
  console.log('1️⃣ Verificar el Cron Job en Supabase Dashboard:');
  console.log('   - Ve a: SQL Editor');
  console.log('   - Ejecuta: verify-attendance-reminder-system.sql');
  console.log('   - Verifica que el cron job esté activo y ejecutándose cada hora');
  console.log();
  console.log('2️⃣ Si el cron job NO está activo:');
  console.log('   - Ejecuta: setup-attendance-reminder-cron.sql');
  console.log('   - Esto configurará el cron job para ejecutarse cada hora');
  console.log();
  console.log('3️⃣ Para testear con una clase real:');
  console.log('   - Opción A: Espera a que haya una clase en 6-7 horas');
  console.log('   - Opción B: Crea una clase de prueba que empiece en ~6.5 horas');
  console.log('   - Añade participantes y NO marques asistencia');
  console.log('   - Espera la ejecución automática del cron');
  console.log();
  console.log('4️⃣ Monitorear los logs:');
  console.log('   - Dashboard > Edge Functions > send-attendance-reminders > Logs');
  console.log('   - Busca mensajes como "Sent X attendance reminder emails"');
  console.log();
  console.log('5️⃣ Verificar emails enviados:');
  console.log('   - Revisa la cuenta de correo de los jugadores');
  console.log('   - Busca emails con asunto: "⏰ Confirma tu asistencia"');
  console.log();
}

// Ejecutar todas las verificaciones
async function main() {
  const targetClasses = await checkUpcomingClasses();
  await checkParticipantsWithoutConfirmation(targetClasses);
  await testEdgeFunction();
  await showNextSteps();
}

main().catch(console.error);
