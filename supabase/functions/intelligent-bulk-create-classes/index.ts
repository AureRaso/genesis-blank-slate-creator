import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassToCreate {
  name: string;
  level_from: number;
  level_to: number;
  duration_minutes: number;
  start_time: string;
  days_of_week: string[];
  start_date: string;
  end_date: string;
  recurrence_type: string;
  trainer_profile_id: string;
  club_id: string;
  court_number: number;
  monthly_price: number;
  max_participants: number;
  participant_ids?: string[];
}

interface BaseConfig {
  name: string;
  start_date: string;
  end_date: string;
  duration_minutes: number;
}

interface IntelligentBulkCreateRequest {
  classes: ClassToCreate[];
  base_config: BaseConfig;
}

interface CreationResult {
  class_id?: string;
  error?: string;
  class_name: string;
  court_number: number;
  day_of_week: string;
  start_time: string;
}

async function validateUserPermissions(supabaseClient: any, user: any, clubId: string) {
  console.log('Validating user permissions for club:', clubId);
  
  // Check if user is admin of the club
  const { data: clubCheck, error: clubError } = await supabaseClient
    .from('clubs')
    .select('id, created_by_profile_id')
    .eq('id', clubId)
    .single();

  if (clubError || !clubCheck) {
    throw new Error('Club no encontrado');
  }

  const isAdmin = clubCheck.created_by_profile_id === user.id;
  
  let isTrainer = false;
  if (!isAdmin) {
    const { data: trainerCheck } = await supabaseClient
      .from('trainer_clubs')
      .select('id')
      .eq('club_id', clubId)
      .eq('trainer_profile_id', user.id)
      .single();
    
    isTrainer = !!trainerCheck;
  }

  if (!isAdmin && !isTrainer) {
    throw new Error('No tienes permisos para crear clases en este club');
  }

  console.log('User permissions validated:', { isAdmin, isTrainer });
  return { isAdmin, isTrainer };
}

async function validateClassData(classData: ClassToCreate, supabaseClient: any, userId: string) {
  // Check if trainer is the admin who owns the club (can assign themselves)
  const { data: clubCheck } = await supabaseClient
    .from('clubs')
    .select('created_by_profile_id')
    .eq('id', classData.club_id)
    .single();

  const isAdminSelfAssigning = clubCheck?.created_by_profile_id === classData.trainer_profile_id;

  // If not admin self-assigning, validate trainer exists in trainer_clubs
  if (!isAdminSelfAssigning) {
    const { data: trainerCheck, error: trainerError } = await supabaseClient
      .from('trainer_clubs')
      .select('trainer_profile_id')
      .eq('trainer_profile_id', classData.trainer_profile_id)
      .eq('club_id', classData.club_id)
      .single();

    if (trainerError || !trainerCheck) {
      throw new Error(`Entrenador no válido para el club en clase ${classData.name}`);
    }
  }

  // Validate time format
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(classData.start_time)) {
    throw new Error(`Formato de hora inválido en clase ${classData.name}: ${classData.start_time}`);
  }

  // Validate dates (allow same date for single-day classes)
  const startDate = new Date(classData.start_date);
  const endDate = new Date(classData.end_date);

  if (startDate > endDate) {
    throw new Error(`Fecha de inicio debe ser anterior o igual a fecha de fin en clase ${classData.name}`);
  }

  // Validate court number
  if (classData.court_number < 1 || classData.court_number > 50) {
    throw new Error(`Número de pista inválido en clase ${classData.name}: ${classData.court_number}`);
  }

  return true;
}

async function createClassParticipants(programmedClassId: string, participantIds: string[], supabaseClient: any) {
  if (!participantIds || participantIds.length === 0) {
    return 0;
  }

  console.log(`🔵 Creating participants for class ${programmedClassId}:`, participantIds);

  const participants = participantIds.map(studentEnrollmentId => ({
    class_id: programmedClassId,
    student_enrollment_id: studentEnrollmentId,
    status: 'active'
  }));

  console.log(`🔵 Participants to insert:`, participants);

  const { data: insertedData, error: insertError } = await supabaseClient
    .from('class_participants')
    .insert(participants)
    .select();

  if (insertError) {
    console.error('Error inserting class participants:', insertError);
    throw new Error(`Error al asignar participantes: ${insertError.message}`);
  }

  console.log(`✅ Successfully assigned ${participants.length} participants to programmed class ${programmedClassId}`);
  console.log(`🔵 Inserted data:`, insertedData);
  return participants.length;
}

async function createSingleClass(classData: ClassToCreate, supabaseClient: any, userId: string): Promise<CreationResult> {
  const result: CreationResult = {
    class_name: classData.name,
    court_number: classData.court_number,
    day_of_week: classData.days_of_week[0] || 'lunes',
    start_time: classData.start_time
  };

  try {
    console.log(`Creating class: ${classData.name} - Court ${classData.court_number} - ${classData.start_time}`);
    console.log(`🔵 Participants to assign: ${classData.participant_ids?.length || 0}`, classData.participant_ids);

    // Validate the class data before creating
    await validateClassData(classData, supabaseClient, userId);

    // Insert the programmed class
    const { data: createdClass, error: createError } = await supabaseClient
      .from('programmed_classes')
      .insert([{
        name: classData.name,
        level_from: classData.level_from,
        level_to: classData.level_to,
        duration_minutes: classData.duration_minutes,
        start_time: classData.start_time,
        days_of_week: classData.days_of_week,
        start_date: classData.start_date,
        end_date: classData.end_date,
        recurrence_type: classData.recurrence_type,
        trainer_profile_id: classData.trainer_profile_id,
        club_id: classData.club_id,
        court_number: classData.court_number,
        monthly_price: classData.monthly_price,
        max_participants: classData.max_participants,
        is_active: true
      }])
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating class:', createError);
      result.error = createError.message;
      return result;
    }

    result.class_id = createdClass.id;
    console.log(`Successfully created programmed class with ID: ${createdClass.id}`);

    // Create class participants if provided
    if (classData.participant_ids && classData.participant_ids.length > 0) {
      const participantsCount = await createClassParticipants(createdClass.id, classData.participant_ids, supabaseClient);
      console.log(`✅ Assigned ${participantsCount} participants to programmed class ${createdClass.id}`);
    }

    console.log(`✅ Successfully created programmed class ${classData.name} with ID: ${createdClass.id}`);
    return result;

  } catch (error) {
    console.error(`Error creating class ${classData.name}:`, error);
    result.error = error instanceof Error ? error.message : 'Error desconocido';
    return result;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Intelligent bulk create classes function called');
    
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

    const { classes, base_config }: IntelligentBulkCreateRequest = await req.json();
    
    console.log('Intelligent bulk create request:', {
      userId: user.id,
      classCount: classes.length,
      baseConfig: base_config
    });

    if (!classes || classes.length === 0) {
      throw new Error('No classes provided');
    }

    // Validate permissions for the first club (all classes should be for the same club)
    const firstClass = classes[0];
    await validateUserPermissions(supabaseClient, user, firstClass.club_id);

    // Validate all classes belong to the same club
    const allSameClub = classes.every(cls => cls.club_id === firstClass.club_id);
    if (!allSameClub) {
      throw new Error('Todas las clases deben pertenecer al mismo club');
    }

    console.log(`Processing ${classes.length} classes for club ${firstClass.club_id}`);

    // Process classes in smaller batches for better performance and reliability
    const batchSize = 5;
    const results: CreationResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < classes.length; i += batchSize) {
      const batch = classes.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(classes.length / batchSize)}`);

      // Process batch in parallel for better performance
      const batchPromises = batch.map(classData => createSingleClass(classData, supabaseClient, user.id));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Count results
      batchResults.forEach(result => {
        if (result.error) {
          errorCount++;
        } else {
          successCount++;
        }
      });

      console.log(`Batch completed. Success: ${successCount}, Errors: ${errorCount}`);
    }

    console.log(`Intelligent bulk creation completed. Total Success: ${successCount}, Total Errors: ${errorCount}`);

    // Prepare detailed response
    const successfulClasses = results.filter(r => !r.error);
    const failedClasses = results.filter(r => r.error);

    const response = {
      success: errorCount === 0,
      message: errorCount === 0 
        ? `Se crearon ${successCount} clases exitosamente`
        : `Se crearon ${successCount} clases. ${errorCount} fallaron.`,
      summary: {
        total_requested: classes.length,
        created_successfully: successCount,
        failed: errorCount,
        success_rate: Math.round((successCount / classes.length) * 100)
      },
      successful_classes: successfulClasses.map(r => ({
        class_id: r.class_id,
        name: r.class_name,
        court: r.court_number,
        day: r.day_of_week,
        time: r.start_time
      })),
      failed_classes: failedClasses.map(r => ({
        name: r.class_name,
        court: r.court_number,
        day: r.day_of_week,
        time: r.start_time,
        error: r.error
      }))
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in intelligent-bulk-create-classes function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        summary: {
          total_requested: 0,
          created_successfully: 0,
          failed: 1,
          success_rate: 0
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});