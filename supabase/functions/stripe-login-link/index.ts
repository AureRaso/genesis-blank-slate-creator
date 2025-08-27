import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log(`stripe-login-link: ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("stripe-login-link: Handling OPTIONS request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize regular Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { clubId } = await req.json();
    
    if (!clubId) {
      throw new Error("Club ID is required");
    }

    // Get user profile to verify admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, club_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Could not verify user profile");
    }

    // Verify user is admin and owns the club
    if (profile.role !== 'admin' || profile.club_id !== clubId) {
      throw new Error("Unauthorized: Only club admins can access Stripe accounts");
    }

    // Get club information
    const { data: club, error: clubError } = await supabaseAdmin
      .from('clubs')
      .select('stripe_account_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club || !club.stripe_account_id) {
      throw new Error("No Stripe account found for this club");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create login link
    const loginLink = await stripe.accounts.createLoginLink(club.stripe_account_id);

    return new Response(JSON.stringify({ url: loginLink.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Stripe Login Link error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});