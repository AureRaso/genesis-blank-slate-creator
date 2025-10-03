import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateStudentUserRequest {
  email: string;
  full_name: string;
  club_id: string;
  password?: string; // Optional custom password, defaults to "123456"
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating student user - Request started");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      throw new Error("Missing Supabase configuration");
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, full_name, club_id, password }: CreateStudentUserRequest = await req.json();
    const userPassword = password || "123456"; // Use custom password or default
    console.log("Creating student user for:", { email, full_name, club_id, hasCustomPassword: !!password });

    if (!email || !full_name || !club_id) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Email, full_name, and club_id are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === email);
    
    if (userExists) {
      console.log("User already exists:", email);
      return new Response(
        JSON.stringify({ 
          message: "El usuario ya existe y puede acceder con su email",
          email: email,
          password: "123456"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the user with provided or default password
    console.log("Creating auth user...");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: userPassword, // Use custom password or default "123456"
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name,
        role: "player",
        club_id: club_id
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw authError;
    }

    if (!authUser?.user?.id) {
      console.error("No user ID returned from auth creation");
      throw new Error("Failed to create user - no ID returned");
    }

    console.log("Auth user created with ID:", authUser.user.id);
    
    // Check if profile was created automatically by trigger
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, club_id")
      .eq("id", authUser.user.id)
      .single();
    
    if (!profile) {
      console.log("Profile not created by trigger, creating manually...");
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authUser.user.id,
          email: email,
          full_name: full_name,
          role: "player", 
          club_id: club_id,
        });
      
      if (profileError) {
        console.error("Error creating profile manually:", profileError);
        // Don't rollback - user creation was successful
      } else {
        console.log("Profile created manually with club_id:", club_id);
      }
    } else {
      console.log("Profile created automatically by trigger");
      // Always update the profile with the club_id
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          club_id: club_id,
          full_name: full_name
        })
        .eq("id", authUser.user.id);
      
      if (updateError) {
        console.error("Error updating profile with club_id:", updateError);
      } else {
        console.log("Profile updated with club_id:", club_id);
      }
    }

    console.log("Student user created successfully");

    return new Response(
      JSON.stringify({
        message: "Cuenta de alumno creada exitosamente",
        email: email,
        password: userPassword,
        user_id: authUser.user.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in create-student-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error interno del servidor" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);