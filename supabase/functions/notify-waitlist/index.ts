import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyWaitlistRequest {
  classId: string;
  availableSpots?: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const whapiApiKey = Deno.env.get('WHAPI_API_KEY')!;
const whapiBaseUrl = Deno.env.get('WHAPI_BASE_URL')!;
const groupId = Deno.env.get('WHATSAPP_GROUP_ID')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendWhatsAppMessage(message: string): Promise<boolean> {
  try {
    console.log('Sending WhatsApp message with config:', {
      baseUrl: whapiBaseUrl,
      groupId: groupId,
      messageLength: message.length
    });

    const response = await fetch(`${whapiBaseUrl}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: groupId,
        body: message
      }),
    });

    const responseText = await response.text();
    console.log('WHAPI Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      console.error('WHAPI Error Response:', responseText);
      return false;
    }

    console.log('WhatsApp message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { classId, availableSpots = 1 }: NotifyWaitlistRequest = await req.json();
    
    console.log(`Processing waitlist notifications for class ${classId}, ${availableSpots} spot(s) available`);

    // Primero verificar que la clase existe - con más logging
    console.log('Querying programmed_classes table for class:', classId);
    
    const { data: classInfo, error: classError } = await supabase
      .from('programmed_classes')
      .select(`
        id,
        name,
        start_time,
        days_of_week,
        max_participants,
        club_id,
        clubs!inner(name)
      `)
      .eq('id', classId)
      .maybeSingle();

    console.log('Query result:', { classInfo, classError });

    if (classError) {
      console.error('Database error fetching class info:', classError);
      throw new Error(`Database error: ${classError.message}`);
    }

    if (!classInfo) {
      console.error('Class not found with ID:', classId);
      
      // Intentar buscar la clase sin el join para debugging
      const { data: classOnly, error: classOnlyError } = await supabase
        .from('programmed_classes')
        .select('*')
        .eq('id', classId)
        .maybeSingle();
      
      console.log('Class without join:', { classOnly, classOnlyError });
      
      throw new Error(`Class with ID ${classId} not found`);
    }

    console.log('Class found successfully:', classInfo.name);

    // Crear token único para inscripción
    const enrollmentToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token de inscripción
    const { error: tokenError } = await supabase
      .from('enrollment_tokens')
      .insert({
        token: enrollmentToken,
        class_id: classId,
        expires_at: expiresAt.toISOString(),
        available_spots: availableSpots
      });

    if (tokenError) {
      console.error('Error creating enrollment token:', tokenError);
      throw tokenError;
    }

    // Construir mensaje de WhatsApp
    const daysText = classInfo.days_of_week.join(', ');
    const timeText = classInfo.start_time.substring(0, 5);
    const enrollmentUrl = `${supabaseUrl.replace('supabase.co', 'supabase.app')}/enroll/${enrollmentToken}`;

    const message = `🎾 ¡PLAZA DISPONIBLE!

📋 Clase: ${classInfo.name}
🏟️ Club: ${classInfo.clubs.name}
📅 Días: ${daysText}
⏰ Hora: ${timeText}
👥 Plazas disponibles: ${availableSpots}

💻 Inscríbete aquí (enlace válido 24h):
${enrollmentUrl}

¡No pierdas tu oportunidad! 🚀`;

    // Enviar mensaje a WhatsApp
    const messageSent = await sendWhatsAppMessage(message);

    if (!messageSent) {
      throw new Error('Failed to send WhatsApp message');
    }

    console.log(`Successfully notified group about ${availableSpots} available spot(s) in class ${classInfo.name}`);

    return new Response(JSON.stringify({ 
      message: `Successfully notified group about ${availableSpots} available spot(s)`,
      enrollmentUrl,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in notify-waitlist function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});