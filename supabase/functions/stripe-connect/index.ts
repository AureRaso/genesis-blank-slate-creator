import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log(`stripe-connect: ${req.method} request received`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("stripe-connect: Handling OPTIONS request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    console.log("stripe-connect: Starting function");
    
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
      console.log("stripe-connect: No authorization header");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("stripe-connect: Authenticating user");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.log("stripe-connect: User authentication error:", userError.message);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      console.log("stripe-connect: User not authenticated");
      throw new Error("User not authenticated");
    }

    console.log("stripe-connect: User authenticated:", user.email);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.log("stripe-connect: Error parsing JSON:", e);
      throw new Error("Invalid JSON in request body");
    }

    const { clubId } = requestBody;
    
    if (!clubId) {
      console.log("stripe-connect: No clubId provided");
      throw new Error("Club ID is required");
    }

    console.log("stripe-connect: Club ID:", clubId);

    // Get user profile to verify admin role
    console.log("stripe-connect: Fetching user profile");
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, club_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log("stripe-connect: Profile error:", profileError);
      throw new Error("Could not verify user profile");
    }

    console.log("stripe-connect: User profile:", profile);

    // Verify user is admin
    if (profile.role !== 'admin') {
      console.log("stripe-connect: User is not admin");
      throw new Error("Unauthorized: Only admins can connect Stripe accounts");
    }

    // Check if the admin is associated with this club (owner or club_id match)
    const { data: clubOwnership, error: ownershipError } = await supabaseAdmin
      .from('clubs')
      .select('id, created_by_profile_id')
      .eq('id', clubId)
      .single();

    if (ownershipError || !clubOwnership) {
      console.log("stripe-connect: Club not found:", ownershipError);
      throw new Error("Club not found");
    }

    // Allow if user created the club OR their profile.club_id matches
    const isOwner = clubOwnership.created_by_profile_id === user.id;
    const isClubAdmin = profile.club_id === clubId;

    if (!isOwner && !isClubAdmin) {
      console.log("stripe-connect: User does not own/belong to this club. created_by:", clubOwnership.created_by_profile_id, "user:", user.id, "profile.club_id:", profile.club_id);
      throw new Error("Unauthorized: You can only connect Stripe accounts for your clubs");
    }

    // Get club information
    console.log("stripe-connect: Fetching club information");
    const { data: club, error: clubError } = await supabaseAdmin
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      console.log("stripe-connect: Club error:", clubError);
      throw new Error("Club not found");
    }

    console.log("stripe-connect: Club found:", club.name);

    // Check Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.log("stripe-connect: No Stripe secret key");
      throw new Error("Stripe secret key not configured");
    }

    // Initialize Stripe
    console.log("stripe-connect: Initializing Stripe");
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { action } = requestBody;
    let accountId = club.stripe_account_id;

    // Action: check-status — verify Stripe account status and update DB
    if (action === 'check-status') {
      if (!accountId) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      console.log("stripe-connect: Checking account status for:", accountId);
      const account = await stripe.accounts.retrieve(accountId);
      const isComplete = account.charges_enabled && account.payouts_enabled;

      if (isComplete) {
        await supabaseAdmin
          .from('clubs')
          .update({ stripe_onboarding_completed: true, stripe_account_status: 'active' })
          .eq('id', clubId);
        console.log("stripe-connect: Account fully onboarded, updated DB");
      }

      return new Response(JSON.stringify({
        connected: isComplete,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      console.log("stripe-connect: Creating new Stripe account");
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'ES', // Assuming Spain, adjust as needed
        email: user.email,
        business_profile: {
          name: club.name,
          product_description: 'Servicios de club de pádel',
        },
      });

      accountId = account.id;
      console.log("stripe-connect: Created account:", accountId);

      // Update club with new Stripe account ID
      const { error: updateError } = await supabaseAdmin
        .from('clubs')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
        })
        .eq('id', clubId);

      if (updateError) {
        console.log("stripe-connect: Error updating club:", updateError);
      } else {
        console.log("stripe-connect: Club updated with Stripe account");
      }
    }

    // Create account link for onboarding
    const origin = req.headers.get("origin") || "http://localhost:3000";
    console.log("stripe-connect: Creating account link for origin:", origin);
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/settings?stripe_connect=refresh`,
      return_url: `${origin}/dashboard/settings?stripe_connect=success`,
      type: 'account_onboarding',
    });

    console.log("stripe-connect: Account link created:", accountLink.url);

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('stripe-connect: Error occurred:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});