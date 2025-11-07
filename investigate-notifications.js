import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMzNzUsImV4cCI6MjA2NjQ0OTM3NX0.At3ieLAkb6bfS46mnPfZ-pzxF7Ghv_kXFmUdiluMjlY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateNotifications() {
  console.log('🔍 Investigating automatic WhatsApp notifications...\n');

  // 1. Check recent pending_whatsapp_notifications
  console.log('📊 1. RECENT PENDING_WHATSAPP_NOTIFICATIONS:');
  console.log('=' .repeat(80));

  const { data: notifications, error: notifError } = await supabase
    .from('pending_whatsapp_notifications')
    .select(`
      id,
      class_id,
      student_profile_id,
      status,
      scheduled_for,
      created_at,
      sent_at,
      class_data
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (notifError) {
    console.error('❌ Error fetching notifications:', notifError);
  } else {
    console.log(`Found ${notifications.length} recent notifications:\n`);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. Notification ID: ${notif.id}`);
      console.log(`   Status: ${notif.status}`);
      console.log(`   Created at: ${notif.created_at}`);
      console.log(`   Scheduled for: ${notif.scheduled_for}`);
      console.log(`   Sent at: ${notif.sent_at || 'Not sent yet'}`);

      if (notif.class_data) {
        console.log(`   Class: ${notif.class_data.class_name}`);
        console.log(`   Class Date: ${notif.class_data.class_date}`);
        console.log(`   Class Time: ${notif.class_data.start_time}`);
        console.log(`   Student: ${notif.class_data.student_name}`);

        // Calculate time difference
        const classDateTime = new Date(`${notif.class_data.class_date}T${notif.class_data.start_time}`);
        const scheduledFor = new Date(notif.scheduled_for);
        const createdAt = new Date(notif.created_at);

        const hoursDiff = (classDateTime - scheduledFor) / (1000 * 60 * 60);
        const minsDiffFromCreation = (scheduledFor - createdAt) / (1000 * 60);

        console.log(`   ⏰ Time from scheduled_for to class: ${hoursDiff.toFixed(2)} hours`);
        console.log(`   ⏰ Delay from creation to scheduled_for: ${minsDiffFromCreation.toFixed(2)} minutes`);
      }
      console.log('');
    });
  }

  // 2. Check class_participants with recent absences
  console.log('\n📊 2. RECENT ABSENCE CONFIRMATIONS:');
  console.log('=' .repeat(80));

  const { data: absences, error: absenceError } = await supabase
    .from('class_participants')
    .select(`
      id,
      class_id,
      student_enrollment_id,
      absence_confirmed,
      absence_confirmed_at,
      absence_locked,
      programmed_classes (
        id,
        name,
        start_time,
        days_of_week
      ),
      student_enrollments (
        full_name
      )
    `)
    .eq('absence_confirmed', true)
    .order('absence_confirmed_at', { ascending: false })
    .limit(10);

  if (absenceError) {
    console.error('❌ Error fetching absences:', absenceError);
  } else {
    console.log(`Found ${absences.length} recent absences:\n`);
    absences.forEach((absence, index) => {
      console.log(`${index + 1}. Student: ${absence.student_enrollments?.full_name}`);
      console.log(`   Class: ${absence.programmed_classes?.name}`);
      console.log(`   Absence confirmed at: ${absence.absence_confirmed_at}`);
      console.log(`   Absence locked: ${absence.absence_locked}`);
      console.log('');
    });
  }

  // 3. Try to get the trigger definition (this might fail due to permissions)
  console.log('\n📊 3. ATTEMPTING TO FETCH DATABASE TRIGGERS:');
  console.log('=' .repeat(80));

  const { data: triggers, error: triggerError } = await supabase
    .rpc('get_triggers_info');

  if (triggerError) {
    console.log('⚠️ Cannot fetch triggers (expected - need service role key)');
    console.log('   Error:', triggerError.message);
  } else {
    console.log('Triggers:', triggers);
  }

  console.log('\n✅ Investigation complete!');
}

investigateNotifications().catch(console.error);
