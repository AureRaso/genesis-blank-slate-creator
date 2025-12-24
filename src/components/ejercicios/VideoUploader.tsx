import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Video, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";

interface VideoUploaderProps {
  ejercicioId?: string;
  currentVideoUrl?: string | null;
  currentThumbnail?: string | null;
  videoStatus?: string | null;
  onVideoUploaded?: (videoId: string) => void;
  onVideoDeleted?: () => void;
  onVideoReady?: (videoData: { videoId: string; videoUrl: string; thumbnailUrl: string }) => void;
  disabled?: boolean;
}

type UploadStatus = "idle" | "creating" | "uploading" | "processing" | "ready" | "error";

const VideoUploader = ({
  ejercicioId,
  currentVideoUrl,
  currentThumbnail,
  videoStatus,
  onVideoUploaded,
  onVideoDeleted,
  onVideoReady,
  disabled = false,
}: VideoUploaderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<UploadStatus>(
    videoStatus === "ready" ? "ready" : videoStatus === "processing" ? "processing" : "idle"
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string | null>(null);
  const [pendingThumbnailUrl, setPendingThumbnailUrl] = useState<string | null>(null);

  // Configurar HLS cuando hay video listo
  useEffect(() => {
    const videoElement = videoRef.current;
    const videoSrc = currentVideoUrl || pendingVideoUrl;

    if (!videoElement || !videoSrc || (status !== "ready" && videoStatus !== "ready")) {
      return;
    }

    // Limpiar HLS previo
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Si es un stream HLS (m3u8)
    if (videoSrc.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari nativo soporta HLS
        videoElement.src = videoSrc;
      }
    } else {
      // Video normal (mp4)
      videoElement.src = videoSrc;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentVideoUrl, pendingVideoUrl, status, videoStatus]);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith("video/")) {
      toast({
        title: t("ejerciciosPage.video.invalidType", "Tipo de archivo inválido"),
        description: t("ejerciciosPage.video.onlyVideos", "Solo se permiten archivos de video"),
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: t("ejerciciosPage.video.fileTooLarge", "Archivo demasiado grande"),
        description: t("ejerciciosPage.video.maxSize", "El tamaño máximo es 100MB"),
        variant: "destructive",
      });
      return;
    }

    try {
      setStatus("creating");

      // 1. Crear video en Bunny via Edge Function
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No hay sesión activa. Por favor, vuelve a iniciar sesión.");
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-video?action=create-video`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          title: file.name,
          ejercicioId,
        }),
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text());
        throw new Error("Error del servidor. Por favor, inténtalo de nuevo.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear video");
      }

      const { videoId, uploadUrl, apiKey } = await response.json();
      setCurrentVideoId(videoId);

      // 2. Subir video directamente a Bunny
      setStatus("uploading");

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("AccessKey", apiKey);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          setStatus("processing");
          onVideoUploaded?.(videoId);
          // Iniciar polling del estado
          pollVideoStatus(videoId);
        } else {
          throw new Error("Upload failed");
        }
      };

      xhr.onerror = () => {
        setStatus("error");
        toast({
          title: t("ejerciciosPage.video.uploadError", "Error al subir"),
          description: t("ejerciciosPage.video.tryAgain", "Por favor, inténtalo de nuevo"),
          variant: "destructive",
        });
      };

      xhr.send(file);
    } catch (error) {
      console.error("Upload error:", error);
      setStatus("error");
      toast({
        title: t("ejerciciosPage.video.uploadError", "Error al subir"),
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  }, [ejercicioId, onVideoUploaded, toast, t]);

  const pollVideoStatus = useCallback(async (videoId: string) => {
    const { data: session } = await supabase.auth.getSession();

    const checkStatus = async () => {
      try {
        // Si no hay ejercicioId, no lo pasamos - el video se subirá sin asociar
        const ejercicioParam = ejercicioId ? `&ejercicioId=${ejercicioId}` : '';
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-video?action=check-status&videoId=${videoId}${ejercicioParam}`;
        const statusResponse = await fetch(functionUrl, {
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error("Failed to check status");
        }

        const data = await statusResponse.json();

        setProcessingProgress(data.progress || 0);

        if (data.status === "ready") {
          setStatus("ready");
          // Guardar URLs para preview y para pasar al formulario
          if (data.videoUrl) {
            setPendingVideoUrl(data.videoUrl);
            setPendingThumbnailUrl(data.thumbnailUrl);
            // Notificar al padre con los datos del video listo
            onVideoReady?.({
              videoId,
              videoUrl: data.videoUrl,
              thumbnailUrl: data.thumbnailUrl,
            });
          }
          toast({
            title: t("ejerciciosPage.video.ready", "Video listo"),
            description: t("ejerciciosPage.video.readyDesc", "El video se ha procesado correctamente"),
          });
          return; // Stop polling
        } else if (data.status === "error") {
          setStatus("error");
          toast({
            title: t("ejerciciosPage.video.processingError", "Error de procesamiento"),
            description: t("ejerciciosPage.video.processingErrorDesc", "El video no se pudo procesar"),
            variant: "destructive",
          });
          return; // Stop polling
        }

        // Continue polling
        setTimeout(checkStatus, 5000);
      } catch (error) {
        console.error("Status check error:", error);
        // Continue polling on transient errors
        setTimeout(checkStatus, 10000);
      }
    };

    // Start polling after a brief delay
    setTimeout(checkStatus, 3000);
  }, [ejercicioId, toast, t, onVideoReady]);

  const handleDeleteVideo = useCallback(async () => {
    if (!currentVideoId && !currentVideoUrl && !pendingVideoUrl) return;

    try {
      const { data: session } = await supabase.auth.getSession();

      // Extract videoId from URL if needed
      const urlToCheck = currentVideoUrl || pendingVideoUrl;
      const videoId = currentVideoId || urlToCheck?.split("/").find((part) => part.length === 36);

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-video?action=delete-video`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          videoId,
          ejercicioId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al eliminar video");
      }

      setStatus("idle");
      setCurrentVideoId(null);
      setUploadProgress(0);
      setProcessingProgress(0);
      setPendingVideoUrl(null);
      setPendingThumbnailUrl(null);
      onVideoDeleted?.();

      toast({
        title: t("ejerciciosPage.video.deleted", "Video eliminado"),
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: t("ejerciciosPage.video.deleteError", "Error al eliminar"),
        variant: "destructive",
      });
    }
  }, [currentVideoId, currentVideoUrl, pendingVideoUrl, ejercicioId, onVideoDeleted, toast, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Si hay video listo, mostrar preview
  if (status === "ready" || (currentVideoUrl && videoStatus === "ready") || pendingVideoUrl) {
    return (
      <div className="max-w-md">
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            poster={currentThumbnail || pendingThumbnailUrl || undefined}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleDeleteVideo}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Estados de carga
  if (status === "creating" || status === "uploading" || status === "processing") {
    return (
      <div className="max-w-md">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center aspect-video flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            {status === "creating" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {t("ejerciciosPage.video.preparing", "Preparando...")}
                </span>
              </>
            )}

            {status === "uploading" && (
              <>
                <Upload className="h-6 w-6 text-primary animate-pulse" />
                <div className="w-full max-w-[200px]">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {t("ejerciciosPage.video.uploading", "Subiendo...")} {uploadProgress}%
                  </span>
                </div>
              </>
            )}

            {status === "processing" && (
              <>
                <Video className="h-6 w-6 text-primary animate-pulse" />
                <div className="w-full max-w-[200px]">
                  <Progress value={processingProgress} className="h-1.5" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {t("ejerciciosPage.video.processing", "Procesando...")} {processingProgress}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (status === "error") {
    return (
      <div className="max-w-md">
        <div className="border-2 border-dashed border-red-300 rounded-lg p-4 text-center bg-red-50 aspect-video flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <span className="text-sm text-red-600">
              {t("ejerciciosPage.video.errorOccurred", "Ocurrió un error")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("idle");
                setUploadProgress(0);
              }}
            >
              {t("ejerciciosPage.video.retry", "Reintentar")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado idle - zona de drop
  return (
    <div className="max-w-md">
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors aspect-video flex items-center justify-center ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary cursor-pointer"
        }`}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
        onClick={disabled ? undefined : () => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-1.5">
          <Video className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("ejerciciosPage.video.dropOrClick", "Arrastra un video o haz clic para seleccionar")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("ejerciciosPage.video.maxSizeHint", "Máximo 100MB, 1 minuto")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
