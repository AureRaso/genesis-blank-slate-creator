
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { full_name, email, club_id, phone, specialty, photo_url, is_active } = await req.json()

    // Validar datos requeridos
    if (!full_name || !email || !club_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: full_name, email, club_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Crear usuario en Auth con la contraseña fija
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: '123456',
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        phone: phone || '',
        role: 'trainer'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: `Error creating auth user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'No user returned from auth creation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Actualizar el perfil automáticamente creado por el trigger
    // El trigger ya creó un perfil con role 'player', lo actualizamos a 'trainer'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'trainer'
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Si falla la actualización del perfil, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return new Response(
        JSON.stringify({ error: `Error updating profile to trainer: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Crear registro de trainer directamente
    const { data: trainerData, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .insert({
        profile_id: authUser.user.id,
        specialty: specialty || null,
        photo_url: photo_url || null,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (trainerError) {
      console.error('Trainer error:', trainerError)
      // Si falla el trainer, limpiar usuario y perfil
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ error: `Error creating trainer: ${trainerError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Crear relación trainer-club
    const { error: trainerClubError } = await supabaseAdmin
      .from('trainer_clubs')
      .insert({
        trainer_profile_id: authUser.user.id,
        club_id: club_id
      })

    if (trainerClubError) {
      console.error('Trainer club error:', trainerClubError)
      // Si falla la relación trainer-club, limpiar todo
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ error: `Error creating trainer-club relationship: ${trainerClubError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Profesor creado correctamente',
        temporary_password: '123456',
        user_id: authUser.user.id,
        trainer_data: trainerData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
