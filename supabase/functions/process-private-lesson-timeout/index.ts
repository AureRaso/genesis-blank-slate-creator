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
    console.log('Processing private lesson booking timeouts...');

    // Find pending bookings that have expired (auto_cancel_at < NOW)
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('private_lesson_bookings')
      .select('id, booker_name, lesson_date, start_time, trainer_profile_id, payment_method, stripe_payment_intent_id, stripe_payment_status')
      .eq('status', 'pending')
      .lt('auto_cancel_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired bookings:', fetchError);
      throw fetchError;
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      console.log('No expired private lesson bookings found');
      return new Response(JSON.stringify({ message: 'No expired bookings' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${expiredBookings.length} expired bookings`);

    let processed = 0;

    for (const booking of expiredBookings) {
      const { error: updateError } = await supabase
        .from('private_lesson_bookings')
        .update({
          status: 'auto_cancelled',
          rejection_reason: 'Sin respuesta del entrenador (cancelación automática)',
          responded_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('status', 'pending'); // Double-check to avoid race conditions

      if (updateError) {
        console.error(`Error cancelling booking ${booking.id}:`, updateError);
        continue;
      }

      // Cancel Stripe hold if applicable
      if (booking.payment_method === 'stripe' && booking.stripe_payment_status === 'hold_placed') {
        try {
          await fetch(`${supabaseUrl}/functions/v1/manage-private-lesson-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              bookingId: booking.id,
              action: 'cancel',
            }),
          });
          console.log(`Stripe hold cancelled for booking ${booking.id}`);
        } catch (stripeError) {
          console.error(`Error cancelling Stripe hold for ${booking.id}:`, stripeError);
          // Don't stop processing other bookings
        }
      }

      processed++;
      console.log(`Auto-cancelled booking ${booking.id} for ${booking.booker_name} on ${booking.lesson_date}`);
    }

    console.log(`Successfully auto-cancelled ${processed} bookings`);

    return new Response(JSON.stringify({
      message: `Auto-cancelled ${processed} expired bookings`,
      processed,
      total: expiredBookings.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in process-private-lesson-timeout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
