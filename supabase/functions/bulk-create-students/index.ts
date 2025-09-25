import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentData {
  full_name: string;
  email: string;
  phone: string;
  level: number;
  club_id: string;
  weekly_days?: string[];
  preferred_times?: string[];
  enrollment_period?: string;
  enrollment_date?: string;
  expected_end_date?: string;
  course?: string;
  discount_1?: number;
  discount_2?: number;
  first_payment?: number;
  payment_method?: string;
  observations?: string;
}

interface BulkCreateRequest {
  students: StudentData[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Bulk create students - Request started");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      throw new Error("Missing Supabase configuration");
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authenticated user (trainer/admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create regular client for auth verification
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { students }: BulkCreateRequest = await req.json();
    console.log(`Processing ${students.length} students`);

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ error: "No students data provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const results = {
      success_count: 0,
      failed_count: 0,
      errors: [] as Array<{
        row: number;
        email: string;
        error: string;
      }>
    };

    // Process students in batches
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (student, batchIndex) => {
          const rowIndex = i + batchIndex + 1;
          
          try {
            console.log(`Processing student ${rowIndex}: ${student.email}`);
            
            // Validate required fields
            if (!student.email || !student.full_name || !student.phone || !student.club_id || !student.level) {
              throw new Error("Missing required fields: name, email, phone, level");
            }

            // Check if user already exists
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const userExists = existingUser.users.some(u => u.email === student.email);
            
            let userId: string;
            
            if (userExists) {
              // Get existing user ID
              const existingUserData = existingUser.users.find(u => u.email === student.email);
              userId = existingUserData!.id;
              console.log(`User already exists: ${student.email}`);
            } else {
              // Create new user
              const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: student.email,
                password: "123456",
                email_confirm: true,
                user_metadata: {
                  full_name: student.full_name,
                  role: "player"
                }
              });

              if (authError) throw authError;
              if (!authUser?.user?.id) throw new Error("No user ID returned");
              
              userId = authUser.user.id;
              console.log(`Created auth user: ${student.email}`);

              // Ensure profile is created/updated
              await supabaseAdmin
                .from("profiles")
                .upsert({
                  id: userId,
                  email: student.email,
                  full_name: student.full_name,
                  role: "player",
                  club_id: student.club_id,
                });
            }

            // Check if student enrollment already exists
            const { data: existingEnrollment } = await supabaseAdmin
              .from("student_enrollments")
              .select("id")
              .eq("email", student.email)
              .eq("club_id", student.club_id)
              .single();

            if (existingEnrollment) {
              console.log(`Enrollment already exists for: ${student.email}`);
              results.success_count++;
              return;
            }

            // Create student enrollment
            const enrollmentData = {
              full_name: student.full_name,
              email: student.email,
              phone: student.phone,
              level: student.level,
              weekly_days: student.weekly_days || [],
              preferred_times: student.preferred_times || [],
              enrollment_period: student.enrollment_period || 'mensual',
              club_id: student.club_id,
              created_by_profile_id: user.id,
              trainer_profile_id: user.id,
              enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0],
              expected_end_date: student.expected_end_date,
              course: student.course,
              discount_1: student.discount_1,
              discount_2: student.discount_2,
              first_payment: student.first_payment,
              payment_method: student.payment_method,
              observations: student.observations,
            };

            const { error: enrollmentError } = await supabaseAdmin
              .from("student_enrollments")
              .insert(enrollmentData);

            if (enrollmentError) throw enrollmentError;
            
            console.log(`Created enrollment for: ${student.email}`);
            results.success_count++;
            
          } catch (error: any) {
            console.error(`Error processing student ${rowIndex}:`, error);
            results.failed_count++;
            results.errors.push({
              row: rowIndex,
              email: student.email,
              error: error.message || "Unknown error"
            });
          }
        })
      );
      
      // Small delay between batches to avoid overwhelming the database
      if (i + BATCH_SIZE < students.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Bulk processing completed. Success: ${results.success_count}, Failed: ${results.failed_count}`);

    return new Response(
      JSON.stringify(results),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in bulk-create-students function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error interno del servidor",
        success_count: 0,
        failed_count: 0,
        errors: []
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);