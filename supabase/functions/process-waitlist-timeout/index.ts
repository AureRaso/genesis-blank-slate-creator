import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing waitlist timeouts...');

    // Buscar entradas notificadas que han expirado (más de 15 minutos sin respuesta)
    const { data: expiredEntries, error: expiredError } = await supabase
      .from('waitlists')
      .select('*')
      .eq('status', 'notified')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (expiredError) {
      console.error('Error fetching expired entries:', expiredError);
      throw expiredError;
    }

    if (!expiredEntries || expiredEntries.length === 0) {
      console.log('No expired waitlist entries found');
      return new Response(JSON.stringify({ message: 'No expired entries' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${expiredEntries.length} expired entries`);

    const processedClasses = new Set<string>();
    const results = [];

    for (const entry of expiredEntries) {
      // Marcar como expirado
      const { error: expireError } = await supabase
        .from('waitlists')
        .update({ status: 'expired' })
        .eq('id', entry.id);

      if (expireError) {
        console.error('Error marking entry as expired:', expireError);
        continue;
      }

      results.push({
        userId: entry.user_id,
        classId: entry.class_id,
        expiredAt: new Date().toISOString()
      });

      // Evitar procesar la misma clase múltiples veces
      if (!processedClasses.has(entry.class_id)) {
        processedClasses.add(entry.class_id);

        // Verificar si hay más usuarios en lista de espera para esta clase
        const { data: nextInLine, error: nextError } = await supabase
          .from('waitlists')
          .select('*')
          .eq('class_id', entry.class_id)
          .eq('status', 'waiting')
          .order('position', { ascending: true })
          .limit(1);

        if (nextError) {
          console.error('Error fetching next in line:', nextError);
          continue;
        }

        // Si hay alguien más esperando, notificar
        if (nextInLine && nextInLine.length > 0) {
          console.log(`Notifying next user in line for class ${entry.class_id}`);
          
          // Llamar a la función notify-waitlist para el siguiente usuario
          const notifyResponse = await supabase.functions.invoke('notify-waitlist', {
            body: { classId: entry.class_id, availableSpots: 1 }
          });

          if (notifyResponse.error) {
            console.error('Error notifying next user:', notifyResponse.error);
          }
        }
      }
    }

    console.log(`Successfully processed ${results.length} expired entries`);

    return new Response(JSON.stringify({
      message: `Processed ${results.length} expired entries`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in process-waitlist-timeout function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});