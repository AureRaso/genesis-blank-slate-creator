import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkClassConfig {
  name: string;
  level_from: number;
  level_to: number;
  duration_minutes: number;
  trainer_profile_id: string;
  club_id: string;
  court_number: number;
  monthly_price: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  recurrence_type: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  days_of_week: string[];
}

interface BulkCreateRequest {
  config: BulkClassConfig;
  preview_count: number;
}

function generateClassSchedule(config: BulkClassConfig) {
  console.log('Generating class schedule with config:', config);
  
  const classes = [];
  const [startHour, startMin] = config.start_time.split(':').map(Number);
  const [endHour, endMin] = config.end_time.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  for (const day of config.days_of_week) {
    for (let time = startMinutes; time < endMinutes; time += config.interval_minutes) {
      const hour = Math.floor(time / 60);
      const min = time % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      classes.push({
        name: `${config.name} - Pista ${config.court_number}`,
        level_from: config.level_from,
        level_to: config.level_to,
        duration_minutes: config.duration_minutes,
        start_time: timeStr,
        days_of_week: [day],
        start_date: config.start_date,
        end_date: config.end_date,
        recurrence_type: config.recurrence_type,
        trainer_profile_id: config.trainer_profile_id,
        club_id: config.club_id,
        court_number: config.court_number,
        monthly_price: config.monthly_price,
        max_participants: config.max_participants
      });
    }
  }
  
  console.log(`Generated ${classes.length} class schedules`);
  return classes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', user.id);

    const { config, preview_count }: BulkCreateRequest = await req.json();
    
    console.log('Bulk create classes request:', {
      userId: user.id,
      clubId: config.club_id,
      className: config.name,
      previewCount: preview_count,
      daysOfWeek: config.days_of_week,
      timeRange: `${config.start_time}-${config.end_time}`,
      interval: config.interval_minutes
    });

    // Verificar permisos del usuario para este club
    const { data: clubCheck, error: clubError } = await supabaseClient
      .from('clubs')
      .select('id, created_by_profile_id')
      .eq('id', config.club_id)
      .single();

    if (clubError || !clubCheck) {
      throw new Error('Club no encontrado');
    }

    // Verificar si es admin del club o trainer asignado
    const isAdmin = clubCheck.created_by_profile_id === user.id;
    
    let isTrainer = false;
    if (!isAdmin) {
      const { data: trainerCheck } = await supabaseClient
        .from('trainer_clubs')
        .select('id')
        .eq('club_id', config.club_id)
        .eq('trainer_profile_id', user.id)
        .single();
      
      isTrainer = !!trainerCheck;
    }

    if (!isAdmin && !isTrainer) {
      throw new Error('No tienes permisos para crear clases en este club');
    }

    console.log('User permissions verified:', { isAdmin, isTrainer });

    // Generar todas las clases programadas
    const classesToCreate = generateClassSchedule(config);
    
    if (classesToCreate.length === 0) {
      throw new Error('No se generaron clases con la configuración proporcionada');
    }

    console.log(`Creating ${classesToCreate.length} classes...`);

    // Crear las clases en lotes para mejor rendimiento
    const batchSize = 10;
    const results = [];
    const errors = [];

    for (let i = 0; i < classesToCreate.length; i += batchSize) {
      const batch = classesToCreate.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(classesToCreate.length / batchSize)}`);

      try {
        const { data: batchResult, error: batchError } = await supabaseClient
          .from('programmed_classes')
          .insert(batch)
          .select('id, name');

        if (batchError) {
          console.error('Batch error:', batchError);
          errors.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${batchError.message}`);
        } else {
          results.push(...(batchResult || []));
          console.log(`Successfully created batch of ${batch.length} classes`);
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        errors.push(`Error procesando lote ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    console.log(`Bulk creation completed. Success: ${results.length}, Errors: ${errors.length}`);

    // Preparar respuesta
    const response = {
      success: true,
      message: `Se crearon ${results.length} clases exitosamente`,
      created_count: results.length,
      total_attempted: classesToCreate.length,
      errors: errors.length > 0 ? errors : undefined,
      created_classes: results
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in bulk-create-classes function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});