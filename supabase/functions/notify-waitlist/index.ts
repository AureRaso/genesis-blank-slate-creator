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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { classId, availableSpots = 1 }: NotifyWaitlistRequest = await req.json();
    
    console.log(`Processing waitlist notifications for class ${classId}, ${availableSpots} spot(s) available`);

    // Obtener los próximos en la lista de espera
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from('waitlists')
      .select(`
        *,
        programmed_classes!inner(name, start_time, days_of_week),
        auth.users!user_id(email)
      `)
      .eq('class_id', classId)
      .eq('status', 'waiting')
      .order('position', { ascending: true })
      .limit(availableSpots);

    if (waitlistError) {
      console.error('Error fetching waitlist:', waitlistError);
      throw waitlistError;
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log('No users in waitlist for this class');
      return new Response(JSON.stringify({ message: 'No users in waitlist' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Procesar cada entrada de lista de espera
    const results = [];
    
    for (const entry of waitlistEntries) {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Actualizar estado a 'notified'
      const { error: updateError } = await supabase
        .from('waitlists')
        .update({
          status: 'notified',
          notified_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('id', entry.id);

      if (updateError) {
        console.error('Error updating waitlist entry:', updateError);
        continue;
      }

      // Crear token de confirmación único
      const confirmationToken = crypto.randomUUID();
      
      // Aquí iría la integración con WHAPI
      // Por ahora simulamos el envío de WhatsApp
      console.log(`Sending WhatsApp to user ${entry.user_id} for class ${entry.programmed_classes.name}`);
      
      const whatsappMessage = `¡Hola! 🎾
      
Hay una plaza disponible en la clase "${entry.programmed_classes.name}".

⏰ Tienes 15 minutos para confirmar tu inscripción.

👆 Confirma aquí: ${supabaseUrl}/confirm-waitlist?token=${confirmationToken}&entry=${entry.id}

Si no confirmas en 15 minutos, la plaza pasará al siguiente en la lista.`;

      // TODO: Integrar con WHAPI aquí
      // await sendWhatsAppMessage(phoneNumber, whatsappMessage);

      results.push({
        userId: entry.user_id,
        position: entry.position,
        expiresAt: expiresAt.toISOString(),
        confirmationToken
      });
    }

    console.log(`Successfully notified ${results.length} users`);

    return new Response(JSON.stringify({ 
      message: `Notified ${results.length} users`,
      results 
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