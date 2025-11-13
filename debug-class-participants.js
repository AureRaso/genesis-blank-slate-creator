import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkParticipants() {
  const classId = '38effda6-b727-4d2a-8f67-cb19d6244d0c';

  console.log('\n🔍 Checking participants for class:', classId);
  console.log('Class: Martes - Pista 1, 19:00:00\n');

  // Query all active participants
  const { data: allParticipants, error } = await supabase
    .from('class_participants')
    .select(`
      id,
      status,
      absence_confirmed,
      is_substitute,
      student_enrollment:student_enrollments!student_enrollment_id(
        full_name,
        email
      )
    `)
    .eq('class_id', classId)
    .eq('status', 'active');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 All active participants:');
  allParticipants.forEach((p, i) => {
    console.log(`  ${i+1}. ${p.student_enrollment?.full_name || 'Unknown'}`);
    console.log(`     - Email: ${p.student_enrollment?.email || 'Unknown'}`);
    console.log(`     - Absence confirmed: ${p.absence_confirmed === true ? '✅ YES' : '❌ NO'}`);
    console.log(`     - Is substitute: ${p.is_substitute ? 'YES' : 'NO'}`);
    console.log('');
  });

  console.log(`\n📈 Total active participants: ${allParticipants.length}`);

  // Count excluding absences
  const participantsNotAbsent = allParticipants.filter(p => p.absence_confirmed !== true);
  console.log(`📈 Participants NOT absent: ${participantsNotAbsent.length}`);

  // Count with .neq filter like in the code
  const { count } = await supabase
    .from('class_participants')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('status', 'active')
    .neq('absence_confirmed', true);

  console.log(`📈 Count with .neq('absence_confirmed', true): ${count}`);

  console.log('\n✅ Available spots should be:', 4 - participantsNotAbsent.length);
}

checkParticipants();
