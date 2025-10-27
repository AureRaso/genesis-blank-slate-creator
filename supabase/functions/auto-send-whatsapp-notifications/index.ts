import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PendingNotification {
  id: string;
  class_participant_id: string;
  class_id: string;
  student_profile_id: string;
  student_level: number;
  target_whatsapp_group_id: string;
  scheduled_for: string;
  created_at: string;
  status: string;
  class_data: {
    class_id: string;
    class_name: string;
    start_time: string;
    duration_minutes: number;
    class_date: string;
    student_name: string;
    student_email: string;
    student_level: number;
    target_group_name: string;
  };
  whatsapp_groups?: {
    group_chat_id: string;
    group_name: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Auto-send WhatsApp notifications function started');

    // Crear cliente Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    console.log('⏰ Current time:', now);

    // 1. Obtener notificaciones pendientes que ya pasaron los 10 minutos
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('pending_whatsapp_notifications')
      .select(`
        *,
        whatsapp_groups(group_chat_id, group_name)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50); // Procesar máximo 50 notificaciones por ejecución

    if (fetchError) {
      console.error('❌ Error fetching pending notifications:', fetchError);
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('✅ No pending notifications to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending notifications',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    console.log(`📨 Processing ${pendingNotifications.length} pending notifications`);

    const results = {
      total: pendingNotifications.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 2. Para cada notificación pendiente
    for (const notification of pendingNotifications as PendingNotification[]) {
      try {
        console.log(`\n📧 Processing notification ${notification.id}:`, {
          class_name: notification.class_data.class_name,
          student_name: notification.class_data.student_name,
          level: notification.student_level,
          group: notification.whatsapp_groups?.group_name,
        });

        // Verificar que tenemos un grupo de WhatsApp válido
        if (!notification.whatsapp_groups?.group_chat_id) {
          throw new Error('No WhatsApp group chat ID found');
        }

        const classData = notification.class_data;
        const groupChatId = notification.whatsapp_groups.group_chat_id;

        // Generar URL de waitlist (sin doble barra)
        const appUrl = Deno.env.get('APP_URL') || 'https://genesis-blank-slate-creator.lovable.app';
        const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
        const waitlistUrl = `${cleanAppUrl}/waitlist/${classData.class_id}/${classData.class_date}`;

        // Formatear fecha en español
        const date = new Date(classData.class_date);
        const formattedDate = new Intl.DateTimeFormat('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date);

        // Formatear hora sin segundos (HH:MM)
        const formattedClassTime = classData.start_time.substring(0, 5);

        // Calcular hora de corte (3 horas antes de la clase)
        const [hours, minutes] = classData.start_time.split(':');
        const classDateTime = new Date(date);
        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
        const cutoffTime = new Date(classDateTime.getTime() - 3 * 60 * 60 * 1000);
        const cutoffTimeStr = cutoffTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        // Construir mensaje de WhatsApp con el formato correcto
        const message = `🎾 ¡Plaza en clase de recuperación disponible!\n\n` +
          `Fecha: ${formattedDate}\n` +
          `Hora: ${formattedClassTime}\n` +
          `Profesor: ${classData.trainer_name || 'Por confirmar'}\n\n` +
          `👉 Apúntate a la lista de espera en el siguiente enlace:\n${waitlistUrl}\n\n` +
          `⏰ Disponible hasta las ${cutoffTimeStr}\n\n` +
          `Las plazas se asignan a criterio del profesor.`;

        console.log('📱 Sending message to group:', groupChatId);

        // 3. Enviar mensaje a WhatsApp via Whapi
        const whapiToken = Deno.env.get('WHAPI_TOKEN');
        if (!whapiToken) {
          throw new Error('WHAPI_TOKEN not configured');
        }

        const whapiResponse = await fetch('https://gate.whapi.cloud/messages/text', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whapiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            typing_time: 0,
            to: groupChatId,
            body: message,
          }),
        });

        const whapiResult = await whapiResponse.json();

        if (!whapiResponse.ok) {
          console.error('❌ Whapi error response:', whapiResult);
          throw new Error(`Whapi error: ${whapiResult.message || 'Unknown error'}`);
        }

        console.log('✅ Message sent successfully:', whapiResult);

        // 4. Marcar como enviado
        const { error: updateError } = await supabase
          .from('pending_whatsapp_notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error('⚠️ Error updating notification status:', updateError);
          throw updateError;
        }

        console.log(`✅ Notification ${notification.id} marked as sent`);
        results.sent++;

      } catch (notifError) {
        const errorMessage = notifError instanceof Error ? notifError.message : 'Unknown error';
        console.error(`❌ Error processing notification ${notification.id}:`, errorMessage);

        results.failed++;
        results.errors.push(`${notification.id}: ${errorMessage}`);

        // Marcar como error en la base de datos
        await supabase
          .from('pending_whatsapp_notifications')
          .update({
            status: 'error',
            error_message: errorMessage,
          })
          .eq('id', notification.id);
      }
    }

    console.log('\n📊 Final results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Fatal error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
