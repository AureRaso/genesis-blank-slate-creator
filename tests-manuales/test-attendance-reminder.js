/**
 * Script para testear manualmente el sistema de recordatorios de asistencia
 *
 * Este script:
 * 1. Llama a la Edge Function de send-attendance-reminders
 * 2. Muestra los resultados en consola
 * 3. Ayuda a verificar que todo funciona correctamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Configuración (obtener de .env o variables de entorno)
const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MDQ5MTQsImV4cCI6MjA0NjQ4MDkxNH0.BBPF_fDVnFyW4i-_gJT2aQ3pKKJWLJa0PrI9ItZWPpQ';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDkwNDkxNCwiZXhwIjoyMDQ2NDgwOTE0fQ.oHbEMYRXaJc0oIU08Fto8CvMQEYeMUm6c5pKC0P_rUs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔍 VERIFICACIÓN DEL SISTEMA DE RECORDATORIOS DE ASISTENCIA');
console.log('='.repeat(60));
console.log();

async function checkCronJob() {
  console.log('1️⃣ Verificando si el cron job está configurado...');

  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT jobname, schedule, active, nodename
              FROM cron.job
              WHERE jobname = 'send-attendance-reminders-hourly'`
      });

    if (error) {
      console.log('⚠️  No se puede verificar el cron job directamente desde aquí');
      console.log('   Necesitas ejecutar el SQL en el Dashboard de Supabase');
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Cron job encontrado:', data[0]);
    } else {
      console.log('❌ Cron job NO encontrado');
    }
  } catch (err) {
    console.log('⚠️  No se puede verificar el cron job directamente desde aquí');
    console.log('   Necesitas ejecutar verify-attendance-reminder-system.sql en el Dashboard');
  }

  console.log();
}

async function checkUpcomingClasses() {
  console.log('2️⃣ Buscando clases en las próximas 6-7 horas...');

  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const sevenHoursFromNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const today = now.toISOString().split('T')[0];

  console.log('   📅 Fecha de hoy:', today);
  console.log('   ⏰ Buscando clases entre:', sixHoursFromNow.toLocaleTimeString('es-ES'),
              'y', sevenHoursFromNow.toLocaleTimeString('es-ES'));
  console.log();

  const { data: classes, error } = await supabase
    .from('programmed_classes')
    .select(`
      id,
      name,
      start_time,
      start_date,
      end_date,
      clubs:club_id (
        name
      )
    `)
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today);

  if (error) {
    console.error('❌ Error al buscar clases:', error);
    return [];
  }

  // Filtrar clases que empiezan en 6-7 horas
  const targetClasses = classes.filter(cls => {
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const classDateTime = new Date(today);
    classDateTime.setHours(hours, minutes, 0, 0);

    return classDateTime >= sixHoursFromNow && classDateTime < sevenHoursFromNow;
  });

  console.log(`   📚 Clases activas hoy: ${classes.length}`);
  console.log(`   🎯 Clases en rango 6-7h: ${targetClasses.length}`);

  if (targetClasses.length > 0) {
    console.log('\n   Clases encontradas:');
    targetClasses.forEach(cls => {
      console.log(`   - ${cls.name} a las ${cls.start_time} (${cls.clubs?.name})`);
    });
  } else {
    console.log('   ⚠️  No hay clases en el rango de 6-7 horas');
    console.log('   💡 Esto es normal si no hay entrenamientos programados en ese horario');
  }

  console.log();
  return targetClasses;
}

async function checkParticipantsWithoutConfirmation(targetClasses) {
  console.log('3️⃣ Verificando participantes sin confirmación...');

  if (targetClasses.length === 0) {
    console.log('   ⏭️  Saltando (no hay clases en rango)');
    console.log();
    return;
  }

  for (const classInfo of targetClasses) {
    console.log(`\n   📋 Clase: ${classInfo.name} (${classInfo.start_time})`);

    const { data: participants, error } = await supabase
      .from('class_participants')
      .select(`
        id,
        attendance_confirmed_for_date,
        absence_confirmed,
        student_enrollment:student_enrollments!student_enrollment_id (
          full_name,
          email
        )
      `)
      .eq('class_id', classInfo.id)
      .eq('status', 'active');

    if (error) {
      console.error('   ❌ Error:', error);
      continue;
    }

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
      console.log('\n   📧 Estos recibirían email:');
      unconfirmed.forEach(p => {
        console.log(`      - ${p.student_enrollment?.full_name} (${p.student_enrollment?.email})`);
      });
    }
  }

  console.log();
}

async function testEdgeFunction() {
  console.log('4️⃣ Testeando la Edge Function manualmente...');
  console.log('   🚀 Invocando send-attendance-reminders...');
  console.log();

  try {
    const { data, error } = await supabase.functions.invoke('send-attendance-reminders', {
      body: {}
    });

    if (error) {
      console.error('   ❌ Error al invocar la función:', error);
      return;
    }

    console.log('   ✅ Función ejecutada exitosamente!');
    console.log('   📊 Resultado:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  console.log();
}

async function showNextSteps() {
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('='.repeat(60));
  console.log();
  console.log('1. Ejecuta verify-attendance-reminder-system.sql en el Dashboard de Supabase');
  console.log('   para ver el estado completo del cron job');
  console.log();
  console.log('2. Si el cron job no está activo, ejecuta setup-attendance-reminder-cron.sql');
  console.log();
  console.log('3. Para testear con una clase real:');
  console.log('   - Crea una clase que empiece en ~6.5 horas');
  console.log('   - Añade participantes sin confirmar asistencia');
  console.log('   - Espera a que el cron ejecute o invoca manualmente la función');
  console.log();
  console.log('4. Monitorea los logs en:');
  console.log('   Dashboard > Edge Functions > send-attendance-reminders > Logs');
  console.log();
}

// Ejecutar todas las verificaciones
async function main() {
  await checkCronJob();
  const targetClasses = await checkUpcomingClasses();
  await checkParticipantsWithoutConfirmation(targetClasses);
  await testEdgeFunction();
  await showNextSteps();
}

main().catch(console.error);
