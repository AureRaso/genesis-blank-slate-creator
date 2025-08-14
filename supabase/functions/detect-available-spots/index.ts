import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClassCapacity(classId: string) {
  // Obtener información de la clase
  const { data: classInfo, error: classError } = await supabase
    .from('programmed_classes')
    .select('max_participants, name')
    .eq('id', classId)
    .single();

  if (classError || !classInfo) {
    console.error('Error fetching class info:', classError);
    return null;
  }

  // Contar participantes actuales
  const { count: currentParticipants, error: participantsError } = await supabase
    .from('class_participants')
    .select('*', { count: 'exact' })
    .eq('class_id', classId)
    .eq('status', 'active');

  if (participantsError) {
    console.error('Error counting participants:', participantsError);
    return null;
  }

  const availableSpots = classInfo.max_participants - (currentParticipants || 0);
  
  return {
    classId,
    className: classInfo.name,
    maxParticipants: classInfo.max_participants,
    currentParticipants: currentParticipants || 0,
    availableSpots: Math.max(0, availableSpots)
  };
}

async function notifyAvailableSpots(classId: string, availableSpots: number) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/notify-waitlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classId,
        availableSpots
      }),
    });

    if (!response.ok) {
      console.error('Error calling notify-waitlist:', await response.text());
      return false;
    }

    console.log(`Successfully triggered notification for class ${classId}`);
    return true;
  } catch (error) {
    console.error('Error calling notify-waitlist function:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting available spots detection...');

    // Obtener todas las clases activas
    const { data: activeClasses, error: classesError } = await supabase
      .from('programmed_classes')
      .select('id, name')
      .eq('is_active', true);

    if (classesError) {
      console.error('Error fetching active classes:', classesError);
      throw classesError;
    }

    const results = [];

    for (const classInfo of activeClasses || []) {
      const capacity = await checkClassCapacity(classInfo.id);
      
      if (capacity && capacity.availableSpots > 0) {
        console.log(`Found ${capacity.availableSpots} available spots in class: ${capacity.className}`);
        
        // Verificar si ya existe una notificación reciente para esta clase
        const { data: recentTokens, error: tokenError } = await supabase
          .from('enrollment_tokens')
          .select('created_at')
          .eq('class_id', classInfo.id)
          .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Últimas 2 horas
          .order('created_at', { ascending: false })
          .limit(1);

        if (tokenError) {
          console.error('Error checking recent tokens:', tokenError);
          continue;
        }

        // Solo notificar si no hay tokens recientes
        if (!recentTokens || recentTokens.length === 0) {
          const notified = await notifyAvailableSpots(classInfo.id, capacity.availableSpots);
          
          results.push({
            classId: classInfo.id,
            className: capacity.className,
            availableSpots: capacity.availableSpots,
            notified
          });
        } else {
          console.log(`Skipping notification for class ${capacity.className} - already notified recently`);
        }
      }
    }

    console.log(`Detection complete. Found ${results.length} classes with available spots that needed notification.`);

    return new Response(JSON.stringify({ 
      message: `Processed ${activeClasses?.length || 0} classes`,
      notificationsTriggered: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in detect-available-spots function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});