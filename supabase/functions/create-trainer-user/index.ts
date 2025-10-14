
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

    const { full_name, email, club_id, phone, specialty, photo_url, is_active, created_by_id } = await req.json()

    // Validar datos requeridos
    if (!full_name || !email || !club_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: full_name, email, club_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener información del administrador que crea el profesor
    let adminName = 'el administrador'
    if (created_by_id) {
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', created_by_id)
        .single()

      if (adminProfile?.full_name) {
        adminName = adminProfile.full_name
      }
    }

    // Obtener información del club
    const { data: clubData } = await supabaseAdmin
      .from('clubs')
      .select('name')
      .eq('id', club_id)
      .single()

    const clubName = clubData?.name || 'el club'

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
    // El trigger ya creó un perfil con role 'player', lo actualizamos a 'trainer' y asignamos el club
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'trainer',
        club_id: club_id
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

    // 5. Enviar correo de bienvenida
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

      if (RESEND_API_KEY) {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0; }
                .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>¡Bienvenido a Padelock! 🎾</h1>
                </div>
                <div class="content">
                  <p>Hola <strong>${full_name}</strong>,</p>

                  <p>${adminName} te ha dado de alta como <strong>profesor</strong> en <strong>${clubName}</strong>.</p>

                  <p>Ya puedes acceder a la plataforma Padelock para gestionar tus clases y alumnos.</p>

                  <div class="credentials">
                    <h3>🔐 Tus credenciales de acceso:</h3>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Contraseña temporal:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">123456</code></p>
                  </div>

                  <p><strong>⚠️ Importante:</strong></p>
                  <ul>
                    <li>Accede a <a href="https://padelock.com">padelock.com</a></li>
                    <li>Dirígete a <strong>Configuración</strong> desde el menú</li>
                    <li>Cambia tu contraseña por una segura</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="https://padelock.com" class="button">Acceder a Padelock</a>
                  </div>

                  <p>Si tienes alguna pregunta, contacta con el administrador de tu club.</p>

                  <p>¡Que disfrutes enseñando pádel! 🎾</p>

                  <div class="footer">
                    <p>Este es un correo automático de Padelock. Por favor, no respondas a este email.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Padelock <noreply@padelock.com>',
            to: [email],
            subject: '🎾 Bienvenido a Padelock - Acceso de Profesor',
            html: emailHtml,
          }),
        })

        if (!res.ok) {
          console.error('Error sending welcome email:', await res.text())
        } else {
          console.log('Welcome email sent successfully to:', email)
        }
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // No fallar la creación del profesor si falla el email
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
      JSON.stringify({ error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
