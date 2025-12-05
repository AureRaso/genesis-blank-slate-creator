import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMzNzUsImV4cCI6MjA2NjQ0OTM3NX0.At3ieLAkb6bfS46mnPfZ-pzxF7Ghv_kXFmUdiluMjlY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPlayerPayments() {
  console.log('=== DEBUG: Pagos del Jugador gal@vmi.com ===\n');

  try {
    // 1. Buscar el usuario por email
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'gal@vmi.com');

    if (profileError) {
      console.error('Error buscando perfil:', profileError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No se encontró el perfil para gal@vmi.com');
      return;
    }

    const profile = profiles[0];
    console.log('✅ Perfil encontrado:');
    console.log(`   - ID: ${profile.id}`);
    console.log(`   - Email: ${profile.email}`);
    console.log(`   - Nombre: ${profile.full_name}`);
    console.log(`   - Rol: ${profile.role}`);
    console.log(`   - Club ID: ${profile.club_id}\n`);

    // 2. Buscar student_enrollment
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .select('*')
      .eq('user_id', profile.id);

    if (enrollmentError) {
      console.error('Error buscando inscripción:', enrollmentError);
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      console.log('❌ No se encontró student_enrollment para este usuario');
      return;
    }

    const enrollment = enrollments[0];
    console.log('✅ Student Enrollment encontrado:');
    console.log(`   - ID: ${enrollment.id}`);
    console.log(`   - Nombre: ${enrollment.full_name}`);
    console.log(`   - Email: ${enrollment.email}\n`);

    // 3. Buscar class_participants
    const { data: participants, error: participantsError } = await supabase
      .from('class_participants')
      .select(`
        *,
        programmed_class:programmed_classes(
          id,
          name,
          monthly_price,
          start_date,
          end_date,
          start_time,
          duration_minutes,
          days_of_week
        )
      `)
      .eq('student_enrollment_id', enrollment.id);

    if (participantsError) {
      console.error('Error buscando class_participants:', participantsError);
      return;
    }

    if (!participants || participants.length === 0) {
      console.log('❌ No se encontraron clases asignadas para este estudiante');
      return;
    }

    console.log(`✅ Clases asignadas: ${participants.length}\n`);
    participants.forEach((participant, index) => {
      console.log(`Clase ${index + 1}:`);
      console.log(`   - Nombre: ${participant.programmed_class?.name || 'N/A'}`);
      console.log(`   - Precio mensual: ${participant.programmed_class?.monthly_price || 0}€`);
      console.log(`   - Fecha inicio: ${participant.programmed_class?.start_date}`);
      console.log(`   - Fecha fin: ${participant.programmed_class?.end_date}`);
      console.log(`   - Días: ${participant.programmed_class?.days_of_week?.join(', ') || 'N/A'}`);
      console.log(`   - Estado: ${participant.status}\n`);
    });

    // 4. Buscar pagos mensuales
    const { data: payments, error: paymentsError } = await supabase
      .from('monthly_payments')
      .select(`
        *,
        programmed_class:programmed_classes(name)
      `)
      .eq('student_enrollment_id', enrollment.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (paymentsError) {
      console.error('Error buscando pagos:', paymentsError);
      return;
    }

    if (!payments || payments.length === 0) {
      console.log('❌ No se encontraron pagos mensuales generados');
      console.log('\n📝 ACCIÓN REQUERIDA:');
      console.log('   Necesitas ejecutar la migración para generar los pagos de las clases existentes.');
      console.log('   Ejecuta: npx supabase db reset (si tienes Docker)');
      console.log('   O aplica manualmente la migración: 20251117100000_generate_existing_monthly_payments.sql');
      return;
    }

    console.log(`✅ Pagos mensuales encontrados: ${payments.length}\n`);

    const paymentsByStatus = {
      pendiente: [],
      en_revision: [],
      pagado: []
    };

    payments.forEach(payment => {
      paymentsByStatus[payment.status].push(payment);
    });

    console.log('📊 Resumen de pagos por estado:');
    console.log(`   - Pendientes: ${paymentsByStatus.pendiente.length}`);
    console.log(`   - En revisión: ${paymentsByStatus.en_revision.length}`);
    console.log(`   - Pagados: ${paymentsByStatus.pagado.length}\n`);

    console.log('💰 Detalle de pagos:');
    payments.forEach(payment => {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      console.log(`   - ${monthNames[payment.month - 1]} ${payment.year}: ${payment.amount}€ (${payment.status}) - ${payment.programmed_class?.name || 'N/A'}`);
    });

    const totalPendiente = paymentsByStatus.pendiente.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalEnRevision = paymentsByStatus.en_revision.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPagado = paymentsByStatus.pagado.reduce((sum, p) => sum + Number(p.amount), 0);

    console.log('\n💵 Totales:');
    console.log(`   - Total pendiente: ${totalPendiente.toFixed(2)}€`);
    console.log(`   - Total en revisión: ${totalEnRevision.toFixed(2)}€`);
    console.log(`   - Total pagado: ${totalPagado.toFixed(2)}€`);
    console.log(`   - TOTAL: ${(totalPendiente + totalEnRevision + totalPagado).toFixed(2)}€`);

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar el debug
debugPlayerPayments().then(() => {
  console.log('\n=== DEBUG COMPLETADO ===');
  process.exit(0);
}).catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
