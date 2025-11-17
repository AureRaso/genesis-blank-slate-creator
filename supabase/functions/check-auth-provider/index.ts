import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Create Supabase client with service role key (admin access)
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

    // Get user by email
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Find user with matching email
    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      // Don't reveal if user exists or not (security)
      return new Response(
        JSON.stringify({
          canResetPassword: true,
          message: 'User not found, but don\'t reveal this to client'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Check auth providers
    const providers = user.app_metadata?.providers || []
    const hasEmailProvider = providers.includes('email')
    const hasGoogleProvider = providers.includes('google')

    console.log('User auth check:', {
      email: user.email,
      providers,
      hasEmailProvider,
      hasGoogleProvider
    })

    // User can reset password if they signed up with email/password
    // Users who signed up with Google cannot reset password
    const canResetPassword = hasEmailProvider && !hasGoogleProvider

    return new Response(
      JSON.stringify({
        canResetPassword,
        provider: hasGoogleProvider ? 'google' : hasEmailProvider ? 'email' : 'unknown',
        message: canResetPassword
          ? 'User can reset password'
          : 'User signed up with OAuth provider'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in check-auth-provider:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
