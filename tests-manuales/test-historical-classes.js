import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY0OTQ4NTksImV4cCI6MjA0MjA3MDg1OX0.tpopulația0G0sV_pZQ-OqLpxLHHnhyNLLhqNdGZmxvI9yk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHistoricalClasses() {
  const userId = 'd7a0172f-83b4-46b3-9647-d01821fc670a';
  const userEmail = 'mark0@gmail.com';

  console.log('🔍 Testing historical classes query for user:');
  console.log('   User ID:', userId);
  console.log('   Email:', userEmail);
  console.log('');

  // Step 1: Get student enrollment IDs
  console.log('📍 STEP 1: Getting student enrollment IDs...');
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('student_enrollments')
    .select('id, email, full_name, student_profile_id')
    .or(`student_profile_id.eq.${userId},email.eq.${userEmail}`);

  if (enrollmentError) {
    console.error('❌ Error fetching enrollments:', enrollmentError);
    return;
  }

  console.log('✅ Enrollments found:', enrollments);
  console.log('   Count:', enrollments?.length || 0);
  console.log('');

  if (!enrollments || enrollments.length === 0) {
    console.log('❌ No enrollments found for this user');
    return;
  }

  const enrollmentIds = enrollments.map(e => e.id);
  console.log('📊 Enrollment IDs:', enrollmentIds);
  console.log('');

  // Step 2: Get class participants
  console.log('📍 STEP 2: Getting class participants...');
  const today = new Date().toISOString().split('T')[0];
  console.log('   Today:', today);
  console.log('');

  const { data: classParticipants, error: participantsError } = await supabase
    .from('class_participants')
    .select(`
      id,
      class_date,
      programmed_class:programmed_classes (
        id,
        name,
        start_time,
        end_time,
        location
      )
    `)
    .in('student_enrollment_id', enrollmentIds)
    .lt('class_date', today)
    .order('class_date', { ascending: false });

  if (participantsError) {
    console.error('❌ Error fetching class participants:', participantsError);
    return;
  }

  console.log('✅ Historical classes found:', classParticipants);
  console.log('   Count:', classParticipants?.length || 0);
  console.log('');

  if (classParticipants && classParticipants.length > 0) {
    console.log('📚 Classes detail:');
    classParticipants.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.programmed_class?.name || 'Unknown'}`);
      console.log(`      Date: ${item.class_date}`);
      console.log(`      Time: ${item.programmed_class?.start_time} - ${item.programmed_class?.end_time}`);
      console.log(`      Location: ${item.programmed_class?.location || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('ℹ️ No historical classes found (classes before today)');
  }

  // Also check ALL classes (including future ones) to verify enrollment
  console.log('📍 STEP 3: Checking ALL classes (including future) to verify enrollment...');
  const { data: allClasses, error: allClassesError } = await supabase
    .from('class_participants')
    .select(`
      id,
      class_date,
      programmed_class:programmed_classes (
        id,
        name,
        start_time,
        end_time,
        location
      )
    `)
    .in('student_enrollment_id', enrollmentIds)
    .order('class_date', { ascending: false });

  if (allClassesError) {
    console.error('❌ Error fetching all classes:', allClassesError);
    return;
  }

  console.log('✅ Total classes (all dates):', allClasses?.length || 0);
  if (allClasses && allClasses.length > 0) {
    console.log('📚 All classes:');
    allClasses.forEach((item, index) => {
      const isPast = item.class_date < today;
      console.log(`   ${index + 1}. ${item.programmed_class?.name || 'Unknown'} ${isPast ? '(PAST)' : '(FUTURE/TODAY)'}`);
      console.log(`      Date: ${item.class_date}`);
      console.log('');
    });
  }
}

testHistoricalClasses();
