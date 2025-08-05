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
    const url = new URL(req.url);
    const entryId = url.searchParams.get('entry');
    const action = url.searchParams.get('action') || 'confirm';

    if (!entryId) {
      return new Response('Missing entry ID', { status: 400 });
    }

    console.log(`Processing waitlist confirmation for entry ${entryId}, action: ${action}`);

    // Buscar la entrada de lista de espera
    const { data: waitlistEntry, error: fetchError } = await supabase
      .from('waitlists')
      .select(`
        *,
        programmed_classes!inner(id, name, max_participants)
      `)
      .eq('id', entryId)
      .eq('status', 'notified')
      .single();

    if (fetchError || !waitlistEntry) {
      console.error('Waitlist entry not found or expired:', fetchError);
      return new Response('Entry not found or expired', { status: 404 });
    }

    // Verificar que no haya expirado
    if (waitlistEntry.expires_at && new Date(waitlistEntry.expires_at) < new Date()) {
      return new Response('Confirmation window has expired', { status: 410 });
    }

    if (action === 'confirm') {
      // Verificar disponibilidad en la clase
      const { data: currentParticipants, error: participantsError } = await supabase
        .from('class_participants')
        .select('id')
        .eq('class_id', waitlistEntry.class_id)
        .eq('status', 'active');

      if (participantsError) {
        console.error('Error checking participants:', participantsError);
        throw participantsError;
      }

      const currentCount = currentParticipants?.length || 0;
      const maxParticipants = waitlistEntry.programmed_classes.max_participants || 8;

      if (currentCount >= maxParticipants) {
        return new Response('Class is already full', { status: 409 });
      }

      // Agregar a la clase
      const { error: addError } = await supabase
        .from('class_participants')
        .insert({
          class_id: waitlistEntry.class_id,
          student_enrollment_id: waitlistEntry.user_id, // Esto necesitará ajustarse según tu esquema
          status: 'active'
        });

      if (addError) {
        console.error('Error adding to class:', addError);
        throw addError;
      }

      // Marcar como aceptado y eliminar de lista de espera
      const { error: updateError } = await supabase
        .from('waitlists')
        .update({ status: 'accepted' })
        .eq('id', entryId);

      if (updateError) {
        console.error('Error updating waitlist status:', updateError);
        throw updateError;
      }

      console.log(`User ${waitlistEntry.user_id} successfully added to class ${waitlistEntry.class_id}`);

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>¡Confirmación exitosa!</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
            .details { color: #666; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ ¡Confirmación exitosa!</div>
            <h2>Te has inscrito correctamente en la clase</h2>
            <div class="details">
              <strong>${waitlistEntry.programmed_classes.name}</strong>
            </div>
            <p>Recibirás más detalles pronto. ¡Nos vemos en la cancha! 🎾</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });

    } else if (action === 'decline') {
      // Marcar como rechazado
      const { error: updateError } = await supabase
        .from('waitlists')
        .update({ status: 'skipped' })
        .eq('id', entryId);

      if (updateError) {
        console.error('Error updating waitlist status:', updateError);
        throw updateError;
      }

      // Notificar al siguiente en la lista
      const notifyResponse = await supabase.functions.invoke('notify-waitlist', {
        body: { classId: waitlistEntry.class_id, availableSpots: 1 }
      });

      if (notifyResponse.error) {
        console.error('Error notifying next user:', notifyResponse.error);
      }

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Inscripción rechazada</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .info { color: #17a2b8; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="info">ℹ️ Inscripción rechazada</div>
            <p>Has rechazado la inscripción a esta clase.</p>
            <p>La plaza ha sido ofrecida al siguiente en la lista de espera.</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    return new Response('Invalid action', { status: 400 });

  } catch (error: any) {
    console.error('Error in confirm-waitlist function:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">❌ Error</div>
          <p>Hubo un problema procesando tu solicitud.</p>
          <p>Por favor, contacta al administrador.</p>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
});