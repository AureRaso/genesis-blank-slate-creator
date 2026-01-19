// Script para verificar la lógica de scoring de lista de espera
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarScoring() {
  console.log('🔍 VERIFICACIÓN DEL SCORING DE LISTA DE ESPERA\n');
  console.log('='.repeat(70));

  // 1. Verificar si hay casos donde AMBOS campos están activos
  console.log('\n📋 1. Verificar si hay casos con attendance_confirmed Y absence_confirmed a la vez:\n');

  const { data: ambos, error: e1 } = await supabase
    .from('class_participants')
    .select(`
      id,
      attendance_confirmed_for_date,
      absence_confirmed,
      student_enrollment:student_enrollments!student_enrollment_id(full_name)
    `)
    .not('attendance_confirmed_for_date', 'is', null)
    .eq('absence_confirmed', true)
    .limit(10);

  if (e1) {
    console.error('Error:', e1.message);
  } else if (ambos.length === 0) {
    console.log('✅ NO hay casos donde ambos campos estén activos simultáneamente.');
    console.log('   Esto confirma que son MUTUAMENTE EXCLUYENTES.\n');
  } else {
    console.log('⚠️ HAY casos con ambos campos activos:');
    ambos.forEach(r => console.log(`   - ${r.student_enrollment?.full_name}: confirmed=${r.attendance_confirmed_for_date}, absence=${r.absence_confirmed}`));
  }

  // 2. Obtener conteos manuales por alumno
  console.log('\n📋 2. Conteos manuales de alumnos activos:\n');

  const { data: participants, error: e2 } = await supabase
    .from('class_participants')
    .select(`
      student_enrollment_id,
      class_id,
      attendance_confirmed_for_date,
      absence_confirmed,
      status,
      student_enrollment:student_enrollments!student_enrollment_id(full_name)
    `)
    .eq('status', 'active');

  if (e2) {
    console.error('Error:', e2.message);
    return;
  }

  // Agrupar por alumno
  const porAlumno = {};
  participants.forEach(p => {
    const id = p.student_enrollment_id;
    if (!porAlumno[id]) {
      porAlumno[id] = {
        name: p.student_enrollment?.full_name || 'Sin nombre',
        class_id: p.class_id,
        confirmaciones: 0,
        ausencias: 0,
        total: 0
      };
    }
    porAlumno[id].total++;
    if (p.attendance_confirmed_for_date) porAlumno[id].confirmaciones++;
    if (p.absence_confirmed) porAlumno[id].ausencias++;
  });

  // Filtrar alumnos con al menos 3 participaciones
  const alumnosActivos = Object.entries(porAlumno)
    .filter(([_, v]) => v.total >= 3)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15);

  console.log('Alumno'.padEnd(30) + 'Confirm'.padStart(8) + 'Ausenc'.padStart(8) + 'Total'.padStart(8));
  console.log('-'.repeat(54));

  alumnosActivos.forEach(([id, data]) => {
    console.log(
      data.name.substring(0, 28).padEnd(30) +
      data.confirmaciones.toString().padStart(8) +
      data.ausencias.toString().padStart(8) +
      data.total.toString().padStart(8)
    );
  });

  // 3. Probar la función get_student_behavior_metrics
  console.log('\n📋 3. Resultados de get_student_behavior_metrics vs conteo manual:\n');

  console.log('Alumno'.padEnd(25) + 'Attended'.padStart(9) + 'Late'.padStart(6) + 'Early'.padStart(7) + ' | ' + 'Confirm'.padStart(8) + 'Ausenc'.padStart(8) + ' | Análisis');
  console.log('-'.repeat(90));

  for (const [studentId, data] of alumnosActivos.slice(0, 10)) {
    try {
      const { data: metrics, error } = await supabase
        .rpc('get_student_behavior_metrics', {
          p_student_enrollment_id: studentId,
          p_class_id: data.class_id
        });

      if (error) {
        console.log(`${data.name.substring(0, 23).padEnd(25)} Error: ${error.message}`);
        continue;
      }

      const m = metrics[0] || { total_attended: 0, late_notice_absences: 0, early_notice_absences: 0 };
      const funcionAttended = m.total_attended;
      const funcionAusencias = m.late_notice_absences + m.early_notice_absences;

      // Análisis
      let analisis = '';
      if (funcionAttended === data.confirmaciones) {
        analisis = '✅ OK';
      } else if (funcionAttended === data.confirmaciones - funcionAusencias) {
        analisis = '⚠️ Resta ausencias (posible error)';
      } else {
        analisis = `❓ Diferencia: ${funcionAttended} vs ${data.confirmaciones}`;
      }

      console.log(
        data.name.substring(0, 23).padEnd(25) +
        funcionAttended.toString().padStart(9) +
        m.late_notice_absences.toString().padStart(6) +
        m.early_notice_absences.toString().padStart(7) +
        ' | ' +
        data.confirmaciones.toString().padStart(8) +
        data.ausencias.toString().padStart(8) +
        ' | ' + analisis
      );
    } catch (err) {
      console.log(`${data.name.substring(0, 23).padEnd(25)} Error: ${err.message}`);
    }
  }

  // 4. Explicación del cálculo
  console.log('\n' + '='.repeat(70));
  console.log('📊 ANÁLISIS DEL CÁLCULO:');
  console.log('='.repeat(70));
  console.log(`
La función get_student_behavior_metrics calcula:

  total_attended = total_attendance_confirmations - (late_absences + early_absences)

PREGUNTA CLAVE: Cuando un alumno CANCELA, ¿se borra attendance_confirmed_for_date?

Si SÍ se borra (mutuamente excluyentes):
  - total_attendance_confirmations ya NO incluye las ausencias
  - Restar ausencias sería INCORRECTO (doble resta)

Si NO se borra (pueden coexistir):
  - total_attendance_confirmations SÍ incluye las ausencias
  - Restar ausencias sería CORRECTO

Según el código en useAttendanceConfirmations.ts:148-152:
  attendance_confirmed_for_date: null  ← SE BORRA al cancelar

Por lo tanto, la resta actual PODRÍA ser incorrecta.
`);

  // 5. Verificar un caso específico en detalle
  console.log('\n📋 4. Caso específico detallado:\n');

  const [ejemploId, ejemploData] = alumnosActivos.find(([_, d]) => d.ausencias > 0) || alumnosActivos[0];

  if (ejemploId) {
    console.log(`Alumno: ${ejemploData.name}`);
    console.log(`Student ID: ${ejemploId}\n`);

    const { data: detalle } = await supabase
      .from('class_participants')
      .select(`
        id,
        attendance_confirmed_for_date,
        attendance_confirmed_at,
        absence_confirmed,
        absence_confirmed_at,
        programmed_class:programmed_classes!class_id(name)
      `)
      .eq('student_enrollment_id', ejemploId)
      .eq('status', 'active');

    console.log('Clase'.padEnd(30) + 'Conf.Asist'.padStart(12) + 'Conf.Ausenc'.padStart(13));
    console.log('-'.repeat(55));

    detalle?.forEach(d => {
      const confAsist = d.attendance_confirmed_for_date ? '✅ ' + d.attendance_confirmed_for_date : '❌';
      const confAusen = d.absence_confirmed ? '✅' : '❌';
      console.log(
        (d.programmed_class?.name || 'Sin nombre').substring(0, 28).padEnd(30) +
        confAsist.padStart(12) +
        confAusen.padStart(13)
      );
    });
  }
}

verificarScoring().catch(console.error);
