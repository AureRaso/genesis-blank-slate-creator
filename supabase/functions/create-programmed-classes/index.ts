import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateClassData {
  name: string;
  level_from?: number;
  level_to?: number;
  custom_level?: string;
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
  group_id?: string;
  selected_students?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const classData: CreateClassData = await req.json()
    console.log('Creating programmed classes with data:', classData)

    // Generate all class dates based on recurrence
    const classDates = generateClassDates(classData)
    console.log(`Generated ${classDates.length} class dates`)

    // Create the base programmed class
    const { data: createdClass, error: classError } = await supabase
      .from("programmed_classes")
      .insert([{
        name: classData.name,
        level_from: classData.level_from,
        level_to: classData.level_to,
        custom_level: classData.custom_level,
        duration_minutes: classData.duration_minutes,
        start_time: classData.start_time,
        days_of_week: classData.days_of_week,
        start_date: classData.start_date,
        end_date: classData.end_date,
        recurrence_type: classData.recurrence_type,
        trainer_profile_id: classData.trainer_profile_id,
        club_id: classData.club_id,
        court_number: classData.court_number,
        monthly_price: classData.monthly_price || 0,
        max_participants: classData.max_participants || 8,
        group_id: classData.group_id,
        created_by: user.id
      }])
      .select()
      .single()

    if (classError) {
      console.error('Error creating programmed class:', classError)
      throw classError
    }

    console.log('Created programmed class:', createdClass.id)

    // Handle participants if needed
    if (classData.group_id || (classData.selected_students && classData.selected_students.length > 0)) {
      let participantsData: any[] = []

      if (classData.group_id) {
        // Get group members
        const { data: groupMembers, error: groupError } = await supabase
          .from("group_members")
          .select("student_enrollment_id")
          .eq("group_id", classData.group_id)
          .eq("is_active", true)

        if (groupError) {
          console.error('Error fetching group members:', groupError)
          throw groupError
        }

        participantsData = groupMembers.map(member => ({
          class_id: createdClass.id,
          student_enrollment_id: member.student_enrollment_id,
          status: 'active'
        }))
      } else if (classData.selected_students && classData.selected_students.length > 0) {
        participantsData = classData.selected_students.map(studentId => ({
          class_id: createdClass.id,
          student_enrollment_id: studentId,
          status: 'active'
        }))
      }

      // Insert participants in batches to avoid timeout
      if (participantsData.length > 0) {
        console.log(`Creating ${participantsData.length} participants`)
        const { error: participantsError } = await supabase
          .from("class_participants")
          .insert(participantsData)

        if (participantsError) {
          console.error('Error creating participants:', participantsError)
          throw participantsError
        }
      }
    }

    console.log('Successfully created programmed class and participants')

    return new Response(
      JSON.stringify({ 
        success: true, 
        class_id: createdClass.id,
        total_dates: classDates.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-programmed-classes function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateClassDates(classData: CreateClassData): string[] {
  const dates: string[] = []
  const startDate = new Date(classData.start_date)
  const endDate = new Date(classData.end_date)
  
  const dayMap: Record<string, number> = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  }

  classData.days_of_week.forEach(day => {
    const targetDay = dayMap[day]
    let currentDate = new Date(startDate)

    // Find first occurrence of target day
    while (currentDate.getDay() !== targetDay && currentDate <= endDate) {
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Generate dates based on recurrence
    const intervalDays = classData.recurrence_type === 'weekly' ? 7 : 
                        classData.recurrence_type === 'biweekly' ? 14 : 30

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + intervalDays)
    }
  })

  return dates.sort()
}