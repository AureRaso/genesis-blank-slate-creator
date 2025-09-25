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
const ultramsgToken = Deno.env.get('ULTRAMSG_TOKEN')!;
const ultramsgInstanceId = Deno.env.get('ULTRAMSG_INSTANCE_ID')!;
const groupId = Deno.env.get('WHATSAPP_GROUP_ID')!;

console.log('Environment variables loaded:', {
  supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
  supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING',
  ultramsgToken: ultramsgToken ? `SET (${ultramsgToken.substring(0, 4)}...)` : 'MISSING',
  ultramsgInstanceId: ultramsgInstanceId || 'MISSING',
  groupId: groupId || 'MISSING'
});

// Validar que todas las variables requeridas estén configuradas
if (!ultramsgToken || !ultramsgInstanceId || !groupId) {
  console.error('Missing required environment variables:', {
    ultramsgToken: !ultramsgToken,
    ultramsgInstanceId: !ultramsgInstanceId,
    groupId: !groupId
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendWhatsAppMessage(message: string): Promise<boolean> {
  try {
    console.log('Sending WhatsApp message with config:', {
      instanceId: ultramsgInstanceId,
      groupId: groupId,
      messageLength: message.length
    });

    const response = await fetch(`https://api.ultramsg.com/${ultramsgInstanceId}/messages/chat?token=${ultramsgToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        to: groupId,
        body: message
      }),
    });

    const responseText = await response.text();
    console.log('UltraMsg Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      console.error('UltraMsg Error Response:', responseText);
      return false;
    }

    console.log('WhatsApp message sent successfully via UltraMsg');
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
🏟️ Club: ${(classInfo as any).clubs?.name || 'Club'}
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