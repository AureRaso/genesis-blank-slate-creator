// Check if the participation was updated in the database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzQxNzM4OSwiZXhwIjoyMDQ4OTkzMzg5fQ.yWyB61RO18K7DwH-cUWCgGLuDsXYrHfTZP-zCM09WiQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const participationId = '43edffea-9583-408a-ba59-0b4e34cee8ea';

console.log('🔍 Checking participation status in database...\n');

supabase
  .from('class_participants')
  .select('id, absence_confirmed, absence_confirmed_at, attendance_confirmed_at, status')
  .eq('id', participationId)
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 Participation data:');
    console.log('  - ID:', data.id);
    console.log('  - Status:', data.status);
    console.log('  - Absence confirmed:', data.absence_confirmed);
    console.log('  - Absence confirmed at:', data.absence_confirmed_at);
    console.log('  - Attendance confirmed at:', data.attendance_confirmed_at);

    if (data.absence_confirmed && !data.attendance_confirmed_at) {
      console.log('\n✅ Absence was successfully marked in the database!');
    } else {
      console.log('\n❌ Absence was NOT marked correctly');
    }
  });
