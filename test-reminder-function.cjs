const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReminderFunction() {
  console.log('🧪 Testing send-attendance-reminders function with updated code...\n');

  try {
    const { data, error } = await supabase.functions.invoke('send-attendance-reminders', {
      body: {}
    });

    if (error) {
      console.error('❌ Error invoking function:', error);
      return;
    }

    console.log('✅ Function executed successfully!');
    console.log('\n📊 Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testReminderFunction();
