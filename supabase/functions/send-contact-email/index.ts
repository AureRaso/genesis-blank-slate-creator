import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  clubName?: string;
  clubSize?: string;
  role?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: ContactFormData = await req.json();

    console.log("📧 Sending contact form email:", {
      name: formData.name,
      email: formData.email,
      clubName: formData.clubName,
    });

    // Validar campos requeridos
    if (!formData.name || !formData.email) {
      throw new Error("Name and email are required");
    }

    // Construir el HTML del email
    const clubSizeLabel = {
      small: "Pequeño (1-4 pistas)",
      medium: "Mediano (5-10 pistas)",
      large: "Grande (11+ pistas)",
    }[formData.clubSize || ""] || formData.clubSize || "No especificado";

    const roleLabel = {
      owner: "Propietario",
      manager: "Gerente",
      coach: "Entrenador",
      other: "Otro",
    }[formData.role || ""] || formData.role || "No especificado";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #D94E28 0%, #C13B1A 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #ddd;
              border-top: none;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background: white;
              border-radius: 5px;
              border-left: 4px solid #D94E28;
            }
            .label {
              font-weight: bold;
              color: #D94E28;
              display: block;
              margin-bottom: 5px;
            }
            .value {
              color: #333;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎾 Nueva Solicitud de Demo - PadeLock</h1>
          </div>
          <div class="content">
            <p>Se ha recibido una nueva solicitud de demo desde la landing page:</p>

            <div class="field">
              <span class="label">👤 Nombre:</span>
              <span class="value">${formData.name}</span>
            </div>

            <div class="field">
              <span class="label">📧 Email:</span>
              <span class="value">${formData.email}</span>
            </div>

            ${formData.phone ? `
            <div class="field">
              <span class="label">📱 Teléfono:</span>
              <span class="value">${formData.phone}</span>
            </div>
            ` : ''}

            ${formData.clubName ? `
            <div class="field">
              <span class="label">🏢 Nombre del Club:</span>
              <span class="value">${formData.clubName}</span>
            </div>
            ` : ''}

            <div class="field">
              <span class="label">📊 Tamaño del Club:</span>
              <span class="value">${clubSizeLabel}</span>
            </div>

            <div class="field">
              <span class="label">👔 Rol:</span>
              <span class="value">${roleLabel}</span>
            </div>

            ${formData.message ? `
            <div class="field">
              <span class="label">💬 Mensaje:</span>
              <span class="value">${formData.message}</span>
            </div>
            ` : ''}

            <div class="footer">
              <p>Este email fue enviado automáticamente desde el formulario de contacto de PadeLock.</p>
              <p>Por favor, responde a ${formData.email} para continuar la conversación.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email usando Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PadeLock <onboarding@resend.dev>",
        to: ["infopadelock@gmail.com"],
        reply_to: formData.email,
        subject: `🎾 Nueva solicitud de demo - ${formData.name}${formData.clubName ? ` (${formData.clubName})` : ''}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Error from Resend:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();
    console.log("✅ Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error sending contact email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
