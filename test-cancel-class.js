// Script para probar la funcionalidad de cancelar clases
// Este script simula la cancelación de una clase

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hwwvtxyezhgmhyxjpnvl.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3Z0eHllemhnbWh5eGpwbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg3MzM3NSwiZXhwIjoyMDY2NDQ5Mzc1fQ.DxTYTpMHnMdU60qv_L38hJx3Yq7Bn6m_Q5L46yWtLvg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCancelClass() {
  console.log('🚀 Iniciando prueba de cancelación de clase...\n');

  // PASO 1: Obtener una clase existente para probar
  const { data: classes, error: classesError } = await supabase
    .from('programmed_classes')
    .select('id, name, start_date, end_date')
    .eq('is_active', true)
    .limit(1);

  if (classesError) {
    console.error('❌ Error al obtener clases:', classesError);
    return;
  }

  if (!classes || classes.length === 0) {
    console.log('⚠️ No hay clases activas para probar');
    return;
  }

  const testClass = classes[0];
  console.log('📋 Clase de prueba:', {
    id: testClass.id,
    nombre: testClass.name,
    fecha_inicio: testClass.start_date,
    fecha_fin: testClass.end_date
  });

  // PASO 2: Obtener un usuario admin/trainer para hacer la cancelación
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .or('role.eq.admin,role.eq.trainer')
    .limit(1);

  if (profilesError) {
    console.error('❌ Error al obtener perfiles:', profilesError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️ No hay usuarios admin/trainer para probar');
    return;
  }

  const testUser = profiles[0];
  console.log('\n👤 Usuario de prueba:', {
    id: testUser.id,
    nombre: testUser.full_name,
    rol: testUser.role
  });

  // PASO 3: Cancelar la clase para hoy
  const today = new Date().toISOString().split('T')[0];
  console.log('\n📅 Fecha de cancelación:', today);

  const { data: cancelledClass, error: cancelError } = await supabase
    .from('cancelled_classes')
    .insert({
      programmed_class_id: testClass.id,
      cancelled_date: today,
      cancelled_by: testUser.id,
      cancellation_reason: 'Test de funcionalidad - Cancelación automática'
    })
    .select()
    .single();

  if (cancelError) {
    if (cancelError.code === '23505') {
      console.log('⚠️ Esta clase ya está cancelada para hoy');

      // Obtener la cancelación existente
      const { data: existing } = await supabase
        .from('cancelled_classes')
        .select('*, profiles!cancelled_classes_cancelled_by_fkey(full_name)')
        .eq('programmed_class_id', testClass.id)
        .eq('cancelled_date', today)
        .single();

      if (existing) {
        console.log('\n✓ Detalles de cancelación existente:', {
          id: existing.id,
          fecha_cancelacion: existing.cancelled_date,
          cancelada_por: existing.profiles?.full_name,
          razon: existing.cancellation_reason,
          creada_el: existing.created_at
        });
      }
    } else {
      console.error('❌ Error al cancelar clase:', cancelError);
    }
    return;
  }

  console.log('\n✅ Clase cancelada exitosamente:', {
    id: cancelledClass.id,
    clase_id: cancelledClass.programmed_class_id,
    fecha_cancelacion: cancelledClass.cancelled_date,
    cancelada_por: testUser.full_name,
    razon: cancelledClass.cancellation_reason
  });

  // PASO 4: Verificar que la cancelación se guardó correctamente
  const { data: verification, error: verifyError } = await supabase
    .from('cancelled_classes')
    .select('*, profiles!cancelled_classes_cancelled_by_fkey(full_name)')
    .eq('id', cancelledClass.id)
    .single();

  if (verifyError) {
    console.error('❌ Error al verificar cancelación:', verifyError);
    return;
  }

  console.log('\n✓ Verificación exitosa:', {
    id: verification.id,
    clase_id: verification.programmed_class_id,
    fecha: verification.cancelled_date,
    usuario: verification.profiles?.full_name,
    razon: verification.cancellation_reason
  });

  // PASO 5: Listar todas las clases canceladas para hoy
  const { data: allCancelled, error: allCancelledError } = await supabase
    .from('cancelled_classes')
    .select('*, programmed_classes(name), profiles!cancelled_classes_cancelled_by_fkey(full_name)')
    .eq('cancelled_date', today);

  if (allCancelledError) {
    console.error('❌ Error al listar clases canceladas:', allCancelledError);
    return;
  }

  console.log(`\n📊 Total de clases canceladas para hoy (${today}):`, allCancelled?.length || 0);
  if (allCancelled && allCancelled.length > 0) {
    allCancelled.forEach((cancelled, index) => {
      console.log(`   ${index + 1}. ${cancelled.programmed_classes?.name} - Cancelada por: ${cancelled.profiles?.full_name}`);
    });
  }

  console.log('\n✅ Prueba completada exitosamente');
}

testCancelClass().catch(console.error);
