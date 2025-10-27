import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_EMAIL = 'ivan@gmail.com';

interface AIClassRequest {
  natural_language_input: string;
  club_id: string;
  available_students?: Array<{ id: string; name: string }>;
  available_trainers?: Array<{ id: string; name: string }>;
}

interface ParsedClass {
  count: number;
  days_of_week: string[];
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  participant_names: string[];
  trainer_name?: string;
  level?: string;
  court_number?: number;
  monthly_price?: number;
  max_participants?: number;
  start_date?: string;
  end_date?: string;
}

async function callOpenAI(prompt: string, userEmail: string): Promise<ParsedClass> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada');
  }

  console.log(`Calling OpenAI API for user: ${userEmail}`);

  const systemPrompt = `Eres un asistente que parsea instrucciones en lenguaje natural para crear clases de pádel.

Tu tarea es extraer la información de la solicitud del usuario y devolver un JSON válido con la siguiente estructura:

{
  "count": número de clases a crear,
  "days_of_week": array de días en español ["lunes", "martes", etc],
  "start_time": hora de inicio en formato HH:MM (24h),
  "end_time": hora de fin en formato HH:MM (opcional),
  "duration_minutes": duración en minutos (si no se especifica end_time),
  "participant_names": array de nombres de participantes/alumnos,
  "trainer_name": nombre del entrenador (opcional),
  "level": nivel de la clase ("iniciacion", "intermedio", "avanzado") - opcional,
  "court_number": número de pista (opcional, default 1),
  "monthly_price": precio mensual (opcional, default 60),
  "max_participants": máximo de participantes (opcional, default 4),
  "start_date": fecha de inicio en formato YYYY-MM-DD (opcional),
  "end_date": fecha de fin en formato YYYY-MM-DD (opcional),
  "staggered_times": boolean - true si las clases deben ser consecutivas con horarios diferentes (opcional)
}

REGLAS IMPORTANTES:
1. Los días de la semana DEBEN estar en español minúsculas: lunes, martes, miercoles, jueves, viernes, sabado, domingo
2. Si el usuario dice "de X a Y" con duración específica (ej: "de 10 a 13 de 1 hora cada una"), interpreta que quiere múltiples clases consecutivas
3. Si el usuario dice "de Xh" o "de X minutos" es duración
4. Si no se especifica duración ni hora fin, calcula duration_minutes basado en el contexto (default 60 minutos)
5. Los nombres de participantes deben extraerse exactamente como aparecen
6. Si no se menciona nivel, no lo incluyas en el JSON
7. Si el usuario menciona "todos los [día]", count debe ser el número de semanas hasta fin de mes actual
8. Devuelve SOLO el JSON, sin texto adicional ni markdown
9. IMPORTANTE: Si el usuario dice "X clases de [hora inicio] a [hora fin] de Y duración cada una", significa que quiere X clases CONSECUTIVAS:
   - count debe ser X (el número de clases)
   - start_time es la hora de la primera clase
   - duration_minutes es la duración de cada clase individual
   - staggered_times: true (para indicar que deben crearse con horarios consecutivos)

Ejemplos:
Input: "3 clases los lunes de 10 a 11 con sergio y fran"
Output: {"count": 3, "days_of_week": ["lunes"], "start_time": "10:00", "end_time": "11:00", "participant_names": ["sergio", "fran"]}

Input: "crear 5 clases de martes y jueves de 18:00 a 19:30 con maria, nivel intermedio"
Output: {"count": 5, "days_of_week": ["martes", "jueves"], "start_time": "18:00", "end_time": "19:30", "participant_names": ["maria"], "level": "intermedio"}

Input: "clase los viernes a las 16h de 1 hora con pedro y ana en la pista 2"
Output: {"count": 1, "days_of_week": ["viernes"], "start_time": "16:00", "duration_minutes": 60, "participant_names": ["pedro", "ana"], "court_number": 2}

Input: "3 clases para el jueves de 10 a 13 con una duración de 1 hora cada una"
Output: {"count": 3, "days_of_week": ["jueves"], "start_time": "10:00", "duration_minutes": 60, "participant_names": [], "staggered_times": true}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Usuario: "${prompt}"\n\nExtrae la información y devuelve el JSON.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`Error llamando a OpenAI API: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('OpenAI API response:', JSON.stringify(result));

  if (!result.choices || !result.choices[0] || !result.choices[0].message || !result.choices[0].message.content) {
    throw new Error('Respuesta inválida de OpenAI API');
  }

  let jsonText = result.choices[0].message.content.trim();
  console.log('Parsed JSON text:', jsonText);

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
  }

  try {
    const parsed = JSON.parse(jsonText);

    // Validate and set defaults
    if (!parsed.count || parsed.count < 1) {
      throw new Error('El número de clases debe ser al menos 1');
    }

    if (!parsed.days_of_week || parsed.days_of_week.length === 0) {
      throw new Error('Debes especificar al menos un día de la semana');
    }

    if (!parsed.start_time) {
      throw new Error('Debes especificar una hora de inicio');
    }

    // Calculate duration if not provided
    if (!parsed.duration_minutes) {
      if (parsed.end_time) {
        const [startHour, startMin] = parsed.start_time.split(':').map(Number);
        const [endHour, endMin] = parsed.end_time.split(':').map(Number);
        parsed.duration_minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      } else {
        parsed.duration_minutes = 60; // Default 1 hour
      }
    }

    // Set defaults
    parsed.max_participants = parsed.max_participants || 4;
    parsed.monthly_price = parsed.monthly_price || 60;
    parsed.court_number = parsed.court_number || 1;

    return parsed;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error(`No se pudo parsear la respuesta de la IA: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Class Creator function called');

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

    console.log('Authenticated user:', user.email);

    // SECURITY: Only allow ivan@gmail.com to use this function
    if (user.email !== ALLOWED_EMAIL) {
      console.warn(`Unauthorized access attempt by: ${user.email}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Esta funcionalidad solo está disponible para usuarios autorizados'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { natural_language_input, club_id, available_students, available_trainers }: AIClassRequest = await req.json();

    console.log('AI Class Creator request:', {
      userEmail: user.email,
      clubId: club_id,
      input: natural_language_input,
    });

    if (!natural_language_input || natural_language_input.trim().length === 0) {
      throw new Error('Debes proporcionar una descripción de las clases a crear');
    }

    if (!club_id) {
      throw new Error('Debes seleccionar un club');
    }

    // Verify user has permissions for this club
    const { data: clubCheck, error: clubError } = await supabaseClient
      .from('clubs')
      .select('id, name, created_by_profile_id')
      .eq('id', club_id)
      .single();

    if (clubError || !clubCheck) {
      throw new Error('Club no encontrado');
    }

    // Get user's profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    const isAdmin = clubCheck.created_by_profile_id === profile?.id;

    if (!isAdmin) {
      const { data: trainerCheck } = await supabaseClient
        .from('trainer_clubs')
        .select('id')
        .eq('club_id', club_id)
        .eq('trainer_profile_id', profile?.id)
        .single();

      if (!trainerCheck) {
        throw new Error('No tienes permisos para crear clases en este club');
      }
    }

    console.log('User has permissions for club:', clubCheck.name);

    // Call OpenAI API to parse the natural language input
    const parsedClass = await callOpenAI(natural_language_input, user.email);

    console.log('Parsed class data:', parsedClass);

    // Return the parsed data for preview in the frontend
    const response = {
      success: true,
      parsed_data: parsedClass,
      club_info: {
        id: clubCheck.id,
        name: clubCheck.name,
      },
      message: 'Datos parseados exitosamente. Revisa la información antes de crear las clases.',
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in ai-class-creator function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
