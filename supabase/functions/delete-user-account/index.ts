import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { userId } = await req.json()

    // Verify that the user is deleting their own account
    if (user.id !== userId) {
      throw new Error('You can only delete your own account')
    }

    console.log(`🗑️ Deleting account for user: ${userId}`)

    // Step 1: Delete related records from class_participants
    const { error: participantsError } = await supabaseAdmin
      .from('class_participants')
      .delete()
      .eq('student_enrollment_id', userId)

    if (participantsError) {
      console.error('Error deleting class participants:', participantsError)
      // Continue with deletion even if this fails
    }

    // Step 2: Delete from student_enrollments
    const { error: enrollmentsError } = await supabaseAdmin
      .from('student_enrollments')
      .delete()
      .eq('id', userId)

    if (enrollmentsError) {
      console.error('Error deleting student enrollments:', enrollmentsError)
      // Continue with deletion even if this fails
    }

    // Step 3: Delete from profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error('Failed to delete user profile')
    }

    // Step 4: Delete from auth.users (this is the final step)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      throw new Error('Failed to delete user authentication')
    }

    console.log(`✅ Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
