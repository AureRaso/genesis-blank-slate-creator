const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.log('SUPABASE_SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateClass() {
    const classId = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';
    const clubId = 'bbc10821-1c94-4b62-97ac-2fde0708cefd';

    console.log('=== INVESTIGACION CLASE DESAPARECIDA ===\n');

    // 1. Buscar la clase específica
    console.log('1. BUSCANDO CLASE POR ID:');
    const { data: classData, error: classError } = await supabase
        .from('scheduled_classes')
        .select('*')
        .eq('id', classId);

    if (classError) {
        console.log('Error:', classError.message);
    } else if (!classData || classData.length === 0) {
        console.log('LA CLASE NO EXISTE EN LA BASE DE DATOS');
    } else {
        console.log('Clase encontrada:');
        console.log(JSON.stringify(classData[0], null, 2));
    }

    // 2. Listar TODAS las clases del club (incluyendo inactivas/eliminadas)
    console.log('\n2. TODAS LAS CLASES DEL CLUB La Red 21 Galisport:');
    const { data: allClasses, error: allError } = await supabase
        .from('scheduled_classes')
        .select('id, name, day_of_week, start_time, end_time, is_active, deleted_at, capacity')
        .eq('club_id', clubId)
        .order('day_of_week')
        .order('start_time');

    if (allError) {
        console.log('Error:', allError.message);
    } else {
        console.log('Total clases en el club: ' + allClasses.length);
        allClasses.forEach(function(c) {
            var status = c.deleted_at ? 'ELIMINADA' : (c.is_active ? 'ACTIVA' : 'INACTIVA');
            console.log('  ' + status + ' | Dia ' + c.day_of_week + ' | ' + c.start_time + '-' + c.end_time + ' | ' + c.name + ' | ID: ' + c.id);
        });
    }

    // 3. Verificar si hay clases con nombres similares
    console.log('\n3. NOMBRES DE CLASES EN ESTE CLUB:');
    const { data: similarClasses } = await supabase
        .from('scheduled_classes')
        .select('id, name, club_id, is_active, deleted_at')
        .eq('club_id', clubId);

    if (similarClasses) {
        similarClasses.forEach(function(c) {
            var deleted = c.deleted_at ? c.deleted_at : 'NO';
            console.log('  - "' + c.name + '" (ID: ' + c.id + ', active: ' + c.is_active + ', deleted: ' + deleted + ')');
        });
    }

    // 4. Verificar participantes de la clase
    console.log('\n4. PARTICIPANTES EN LA CLASE:');
    const { data: participants, error: partError } = await supabase
        .from('class_participants')
        .select('id, student_id, status, created_at, students (id, name)')
        .eq('scheduled_class_id', classId);

    if (partError) {
        console.log('Error:', partError.message);
    } else if (!participants || participants.length === 0) {
        console.log('No hay participantes registrados en esta clase');
    } else {
        console.log('Participantes encontrados: ' + participants.length);
        participants.forEach(function(p) {
            var name = p.students ? p.students.name : 'Unknown';
            console.log('  - ' + name + ' (status: ' + p.status + ')');
        });
    }

    // 5. Ver últimas modificaciones en scheduled_classes del club
    console.log('\n5. ULTIMAS CLASES MODIFICADAS/CREADAS EN EL CLUB:');
    const { data: recentClasses } = await supabase
        .from('scheduled_classes')
        .select('id, name, is_active, deleted_at, created_at, updated_at')
        .eq('club_id', clubId)
        .order('updated_at', { ascending: false })
        .limit(10);

    if (recentClasses) {
        recentClasses.forEach(function(c) {
            var deleted = c.deleted_at ? c.deleted_at : 'NO';
            console.log('  - "' + c.name + '" updated: ' + c.updated_at + ', created: ' + c.created_at + ', deleted: ' + deleted);
        });
    }
}

investigateClass().catch(console.error);
