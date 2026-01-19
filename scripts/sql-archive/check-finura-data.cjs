const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const clubId = '82608dac-fb10-422a-b158-9097d591fd57';

  // Verificar clases
  const { data: classes, error: classError } = await supabase
    .from('scheduled_classes')
    .select('id, name, day_of_week, start_time')
    .eq('club_id', clubId);

  if (classError) {
    console.error('Error getting classes:', classError);
    return;
  }

  console.log('\n=== CLASES DEL CLUB FINURA PADEL ACADEMY ===');
  console.log('Total clases: ' + classes.length);

  if (classes.length > 0) {
    // Obtener participantes de cada clase
    const classIds = classes.map(c => c.id);

    const { data: participants, error: partError } = await supabase
      .from('class_participants')
      .select('id, class_id')
      .in('class_id', classIds);

    if (partError) {
      console.error('Error getting participants:', partError);
      return;
    }

    console.log('Total participantes: ' + (participants ? participants.length : 0));

    console.log('\nClases:');
    classes.forEach(c => {
      const partCount = participants ? participants.filter(p => p.class_id === c.id).length : 0;
      console.log('  - ' + c.name + ' (' + c.day_of_week + ' ' + c.start_time + ') - ' + partCount + ' participantes');
    });
  }
}

checkData();
