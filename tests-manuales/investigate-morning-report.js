import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateMorningReport() {
  console.log('🔍 INVESTIGACIÓN DEL REPORTE DE ESTA MAÑANA (12 Nov 2025)\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Check cron_debug_logs for this morning's execution
  console.log('📋 1. LOGS DE EJECUCIÓN (últimas 24 horas):\n');
  const { data: logs, error: logsError } = await supabase
    .from('cron_debug_logs')
    .select('*')
    .eq('function_name', 'generate-daily-report')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (logsError) {
    console.error('Error fetching logs:', logsError);
  } else {
    logs?.forEach(log => {
      console.log(`[${log.created_at}] ${log.log_level}: ${log.message}`);
      if (log.details) {
        console.log('  Details:', JSON.stringify(log.details, null, 2));
      }
    });
  }

  console.log('\n─────────────────────────────────────────────────────\n');

  // 2. Check Hespérides club ID and config
  console.log('🏢 2. CONFIGURACIÓN CLUB HESPÉRIDES:\n');
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name')
    .ilike('name', '%hespérides%');

  if (clubsError) {
    console.error('Error fetching clubs:', clubsError);
  } else {
    console.log('Clubs encontrados:', clubs);
  }

  const hesperidesId = clubs?.[0]?.id || '7b6f49ae-d496-407b-bca1-f5f1e9370610';
  console.log('\nUsando club ID:', hesperidesId);

  // 3. Check WhatsApp report groups config
  console.log('\n📱 3. CONFIGURACIÓN WHATSAPP REPORTS:\n');
  const { data: reportGroups, error: groupsError } = await supabase
    .from('whatsapp_report_groups')
    .select('*')
    .eq('club_id', hesperidesId);

  if (groupsError) {
    console.error('Error fetching report groups:', groupsError);
  } else {
    console.log('Grupos configurados:', JSON.stringify(reportGroups, null, 2));
  }

  console.log('\n─────────────────────────────────────────────────────\n');

  // 4. Check programmed classes for Wednesday (today)
  console.log('🎾 4. CLASES PROGRAMADAS PARA HOY (Miércoles):\n');

  const today = '2025-11-12'; // Wednesday
  const dayOfWeekSpanish = 'miércoles';

  const { data: classes, error: classesError } = await supabase
    .from('programmed_classes')
    .select(`
      id,
      name,
      start_time,
      duration_minutes,
      days_of_week,
      start_date,
      end_date,
      max_participants,
      is_active,
      trainer:profiles!trainer_profile_id(full_name)
    `)
    .eq('club_id', hesperidesId)
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_time', { ascending: true });

  if (classesError) {
    console.error('Error fetching classes:', classesError);
  } else {
    console.log(`Total clases activas en rango de fechas: ${classes?.length || 0}`);

    if (classes && classes.length > 0) {
      console.log('\nTodas las clases encontradas:');
      classes.forEach((cls, idx) => {
        console.log(`\n  ${idx + 1}. ${cls.name} - ${cls.start_time}`);
        console.log(`     Días: ${JSON.stringify(cls.days_of_week)}`);
        console.log(`     Rango: ${cls.start_date} a ${cls.end_date}`);
        console.log(`     Activa: ${cls.is_active}`);
        console.log(`     Entrenador: ${cls.trainer?.full_name || 'N/A'}`);

        const includesWednesday = cls.days_of_week?.includes(dayOfWeekSpanish);
        console.log(`     ¿Incluye miércoles? ${includesWednesday ? '✅ SÍ' : '❌ NO'}`);
      });

      // Filter for Wednesday
      const wednesdayClasses = classes.filter(cls =>
        cls.days_of_week?.includes(dayOfWeekSpanish)
      );

      console.log(`\n\n📊 CLASES FILTRADAS PARA MIÉRCOLES: ${wednesdayClasses.length}`);

      if (wednesdayClasses.length > 0) {
        console.log('\nClases que deberían aparecer en el reporte:');
        wednesdayClasses.forEach((cls, idx) => {
          console.log(`  ${idx + 1}. ${cls.name} - ${cls.start_time} (${cls.trainer?.full_name})`);
        });
      } else {
        console.log('\n⚠️ NO HAY CLASES PROGRAMADAS PARA MIÉRCOLES');
      }
    } else {
      console.log('\n⚠️ NO SE ENCONTRARON CLASES EN EL RANGO DE FECHAS');
    }
  }

  console.log('\n─────────────────────────────────────────────────────\n');

  // 5. Check if there were any participants for today
  console.log('👥 5. PARTICIPANTES CONFIRMADOS PARA HOY:\n');

  const { data: participants, error: partsError } = await supabase
    .from('class_participants')
    .select(`
      id,
      status,
      attendance_confirmed_for_date,
      attendance_confirmed_at,
      absence_confirmed,
      programmed_class:programmed_classes(
        id,
        name,
        start_time,
        days_of_week,
        club_id
      )
    `)
    .eq('attendance_confirmed_for_date', today);

  if (partsError) {
    console.error('Error fetching participants:', partsError);
  } else {
    const hesperidesParticipants = participants?.filter(p =>
      p.programmed_class?.club_id === hesperidesId
    );
    console.log(`Participantes confirmados para hoy en Hespérides: ${hesperidesParticipants?.length || 0}`);

    if (hesperidesParticipants && hesperidesParticipants.length > 0) {
      console.log('\nDetalle:');
      hesperidesParticipants.forEach(p => {
        console.log(`  - Clase: ${p.programmed_class?.name} ${p.programmed_class?.start_time}`);
        console.log(`    Estado: ${p.status}, Asistirá: ${!p.absence_confirmed}`);
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('✅ INVESTIGACIÓN COMPLETA\n');
}

investigateMorningReport().catch(console.error);
