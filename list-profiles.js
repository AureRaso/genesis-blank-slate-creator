import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwwvtxyezhgmhyxjpnvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzMzNzUsImV4cCI6MjA2NjQ0OTM3NX0.At3ieLAkb6bfS46mnPfZ-pzxF7Ghv_kXFmUdiluMjlY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProfiles() {
  console.log('=== LISTANDO PERFILES ===\n');

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No se encontraron perfiles');
      return;
    }

    console.log(`Total de perfiles (últimos 20): ${profiles.length}\n`);
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email || 'Sin email'}`);
      console.log(`   - Nombre: ${profile.full_name || 'N/A'}`);
      console.log(`   - Rol: ${profile.role || 'N/A'}`);
      console.log(`   - ID: ${profile.id}\n`);
    });

    // Buscar específicamente por emails que contengan "gal"
    const { data: galProfiles, error: galError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', '%gal%');

    if (!galError && galProfiles && galProfiles.length > 0) {
      console.log('\n=== PERFILES CON "gal" EN EL EMAIL ===\n');
      galProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.email}`);
        console.log(`   - Nombre: ${profile.full_name || 'N/A'}`);
        console.log(`   - Rol: ${profile.role || 'N/A'}`);
        console.log(`   - ID: ${profile.id}\n`);
      });
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

listProfiles().then(() => {
  console.log('=== COMPLETADO ===');
  process.exit(0);
}).catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
