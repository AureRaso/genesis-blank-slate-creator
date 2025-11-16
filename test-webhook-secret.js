// Script para verificar el webhook secret
// Este script te ayudará a confirmar que el secret está configurado correctamente

console.log('=== VERIFICACIÓN DE WEBHOOK SECRET ===\n');

console.log('Pasos para verificar:');
console.log('\n1. En Stripe Dashboard:');
console.log('   - Ve a: https://dashboard.stripe.com/test/webhooks');
console.log('   - Busca el webhook que apunta a: hwwvtxyezhgmhyxjpnvl.supabase.co');
console.log('   - Haz clic en él');
console.log('   - En la sección "Signing secret", haz clic en "Reveal"');
console.log('   - COPIA EXACTAMENTE el valor (debe empezar con "whsec_")');
console.log('\n2. En Supabase Dashboard:');
console.log('   - Ve a: https://supabase.com/dashboard/project/hwwvtxyezhgmhyxjpnvl/settings/functions');
console.log('   - Busca la variable: STRIPE_WEBHOOK_SECRET');
console.log('   - Asegúrate de que el valor es EXACTAMENTE igual al de Stripe');
console.log('   - NO debe tener espacios al inicio o al final');
console.log('   - Debe empezar con "whsec_"');
console.log('\n3. IMPORTANTE:');
console.log('   - Si acabas de cambiar el secret en Supabase, espera 1-2 minutos');
console.log('   - Las Edge Functions pueden tardar un poco en actualizar las variables');
console.log('\n4. Si el problema persiste:');
console.log('   - Elimina el webhook en Stripe completamente');
console.log('   - Crea uno NUEVO desde cero');
console.log('   - Usa el nuevo signing secret en Supabase');
console.log('\n=================================\n');
