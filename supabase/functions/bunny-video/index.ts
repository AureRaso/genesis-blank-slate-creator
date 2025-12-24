import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper function to convert bytes to hex
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const BUNNY_API_KEY = Deno.env.get("BUNNY_API_KEY")!;
const BUNNY_LIBRARY_ID = Deno.env.get("BUNNY_LIBRARY_ID")!;
const BUNNY_CDN_HOSTNAME = Deno.env.get("BUNNY_CDN_HOSTNAME")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateVideoResponse {
  guid: string;
  title: string;
  dateUploaded: string;
}

interface VideoStatusResponse {
  guid: string;
  title: string;
  status: number; // 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
  encodeProgress: number;
  thumbnailFileName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar que el usuario está autenticado
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "create-video": {
        // Crear un video en Bunny para obtener URL de upload
        const { title, ejercicioId } = await req.json();

        // Crear video en Bunny
        const createResponse = await fetch(
          `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
          {
            method: "POST",
            headers: {
              "AccessKey": BUNNY_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title }),
          }
        );

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error("Bunny create error:", errorText);
          throw new Error(`Failed to create video in Bunny: ${errorText}`);
        }

        const videoData: CreateVideoResponse = await createResponse.json();

        // Actualizar ejercicio con video_id y estado
        if (ejercicioId) {
          await supabase
            .from("ejercicios")
            .update({
              video_id: videoData.guid,
              video_status: "uploading",
            })
            .eq("id", ejercicioId);
        }

        // Generar firma para TUS upload
        // Bunny requiere: SHA256(library_id + api_key + expiration_time + video_id)
        const expirationTime = Math.floor(Date.now() / 1000) + 7200; // 2 horas
        const signatureString = `${BUNNY_LIBRARY_ID}${BUNNY_API_KEY}${expirationTime}${videoData.guid}`;
        const encoder = new TextEncoder();
        const signatureData = encoder.encode(signatureString);
        const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", signatureData);
        const authSignature = bytesToHex(new Uint8Array(hashBuffer));

        return new Response(
          JSON.stringify({
            videoId: videoData.guid,
            libraryId: BUNNY_LIBRARY_ID,
            tusEndpoint: "https://video.bunnycdn.com/tusupload",
            authSignature,
            authExpire: expirationTime,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "check-status": {
        // Verificar estado del video
        const videoId = url.searchParams.get("videoId");
        const ejercicioId = url.searchParams.get("ejercicioId");

        if (!videoId) {
          throw new Error("videoId is required");
        }

        const statusResponse = await fetch(
          `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
          {
            headers: {
              "AccessKey": BUNNY_API_KEY,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error("Failed to get video status");
        }

        const statusData: VideoStatusResponse = await statusResponse.json();

        // Mapear estado de Bunny a nuestro estado
        let videoStatus = "processing";
        if (statusData.status === 4) {
          videoStatus = "ready";
        } else if (statusData.status === 5) {
          videoStatus = "error";
        }

        // Construir URLs - Bunny Stream usa HLS para streaming
        // Formato: https://vz-{id}.b-cdn.net/{videoId}/playlist.m3u8
        const videoUrl = `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
        const thumbnailUrl = statusData.thumbnailFileName
          ? `https://${BUNNY_CDN_HOSTNAME}/${videoId}/${statusData.thumbnailFileName}`
          : `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;

        // Actualizar ejercicio si está listo
        if (ejercicioId && videoStatus === "ready") {
          await supabase
            .from("ejercicios")
            .update({
              video_url: videoUrl,
              video_thumbnail: thumbnailUrl,
              video_status: "ready",
            })
            .eq("id", ejercicioId);
        } else if (ejercicioId && videoStatus === "error") {
          await supabase
            .from("ejercicios")
            .update({
              video_status: "error",
            })
            .eq("id", ejercicioId);
        }

        return new Response(
          JSON.stringify({
            status: videoStatus,
            progress: statusData.encodeProgress,
            videoUrl: videoStatus === "ready" ? videoUrl : null,
            thumbnailUrl,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "delete-video": {
        // Eliminar video de Bunny
        const { videoId, ejercicioId } = await req.json();

        if (!videoId) {
          throw new Error("videoId is required");
        }

        const deleteResponse = await fetch(
          `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
          {
            method: "DELETE",
            headers: {
              "AccessKey": BUNNY_API_KEY,
            },
          }
        );

        if (!deleteResponse.ok) {
          console.error("Failed to delete video from Bunny");
        }

        // Limpiar campos en ejercicio
        if (ejercicioId) {
          await supabase
            .from("ejercicios")
            .update({
              video_id: null,
              video_url: null,
              video_thumbnail: null,
              video_status: "none",
            })
            .eq("id", ejercicioId);
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
