import { useEffect, useState, useRef } from "react";
import Hls from "hls.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ArrowLeft, ChevronDown, Upload, Play, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateEjercicio, useUpdateEjercicio } from "@/hooks/useEjercicios";
import EditorPista from "./EditorPista";
import VideoUploader from "./VideoUploader";
import {
  Ejercicio,
  CATEGORIAS,
  NIVELES,
  INTENSIDADES,
  JUGADORES_OPTIONS,
  MATERIALES_EJERCICIO,
  PosicionJugador,
  Movimiento
} from "@/types/ejercicios";

interface EjercicioFormInlineProps {
  ejercicio?: Ejercicio | null;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.enum(['Volea', 'Bandeja', 'Defensa', 'Táctica', 'Calentamiento', 'Remate', 'Saque', 'Globo', 'Dejada', 'Víbora', 'Ataque', 'Transiciones']),
  nivel: z.enum(['Iniciación', 'Intermedio', 'Avanzado']),
  duracion: z.number().min(1, "La duración debe ser mayor a 0"),
  jugadores: z.number().min(2).max(4),
  intensidad: z.enum(['Baja', 'Media', 'Alta']),
  objetivo: z.string().min(1, "El objetivo es obligatorio"),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const EjercicioFormInline = ({ ejercicio, onClose, onSaveSuccess }: EjercicioFormInlineProps) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const createMutation = useCreateEjercicio();
  const updateMutation = useUpdateEjercicio();

  const isEditing = !!ejercicio;

  const [tags, setTags] = useState<string[]>(ejercicio?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [materiales, setMateriales] = useState<string[]>(ejercicio?.materiales || []);
  const [posiciones, setPosiciones] = useState<PosicionJugador[]>(ejercicio?.posiciones || []);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(ejercicio?.movimientos || []);

  // Estado para video pendiente (cuando se sube antes de crear el ejercicio)
  const [pendingVideo, setPendingVideo] = useState<{
    videoId: string;
    videoUrl: string;
    thumbnailUrl: string;
  } | null>(null);

  // Estados para modales de video
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Refs para video HLS
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Obtener URL y thumbnail del video actual
  const currentVideoUrl = ejercicio?.video_url || pendingVideo?.videoUrl;
  const currentThumbnail = ejercicio?.video_thumbnail || pendingVideo?.thumbnailUrl;
  const hasVideo = !!(currentVideoUrl && (ejercicio?.video_status === 'ready' || pendingVideo));

  // Setup HLS cuando se abre el modal de video
  useEffect(() => {
    if (!showVideoModal || !currentVideoUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (currentVideoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(currentVideoUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch(() => {});
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = currentVideoUrl;
      }
    } else {
      videoElement.src = currentVideoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [showVideoModal, currentVideoUrl]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: ejercicio?.nombre || '',
      categoria: ejercicio?.categoria || 'Volea',
      nivel: ejercicio?.nivel || 'Iniciación',
      duracion: ejercicio?.duracion || 15,
      jugadores: ejercicio?.jugadores || 2,
      intensidad: ejercicio?.intensidad || 'Media',
      objetivo: ejercicio?.objetivo || '',
      descripcion: ejercicio?.descripcion || '',
    },
  });

  // Recargar datos si el ejercicio cambia
  useEffect(() => {
    if (ejercicio) {
      form.reset({
        nombre: ejercicio.nombre,
        categoria: ejercicio.categoria,
        nivel: ejercicio.nivel,
        duracion: ejercicio.duracion,
        jugadores: ejercicio.jugadores,
        intensidad: ejercicio.intensidad,
        objetivo: ejercicio.objetivo,
        descripcion: ejercicio.descripcion || '',
      });
      setTags(ejercicio.tags || []);
      setMateriales(ejercicio.materiales || []);
      setPosiciones(ejercicio.posiciones || []);
      setMovimientos(ejercicio.movimientos || []);
    }
  }, [ejercicio, form]);

  // Manejar tags
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Manejar materiales
  const handleToggleMaterial = (material: string) => {
    if (materiales.includes(material)) {
      setMateriales(materiales.filter(m => m !== material));
    } else {
      setMateriales([...materiales, material]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!profile?.club_id) return;

    const ejercicioData = {
      ...data,
      club_id: profile.club_id,
      tags,
      materiales,
      posiciones,
      movimientos,
      // Incluir datos de video pendiente si existe
      ...(pendingVideo && {
        video_id: pendingVideo.videoId,
        video_url: pendingVideo.videoUrl,
        video_thumbnail: pendingVideo.thumbnailUrl,
        video_status: 'ready' as const,
      }),
    };

    try {
      if (isEditing && ejercicio) {
        await updateMutation.mutateAsync({ id: ejercicio.id, ...ejercicioData });
      } else {
        await createMutation.mutateAsync(ejercicioData);
      }
      onSaveSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving ejercicio:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            {isEditing
              ? t('ejerciciosPage.modal.editTitle', 'Editar Ejercicio')
              : t('ejerciciosPage.modal.newTitle', 'Nuevo Ejercicio')
            }
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing
              ? t('ejerciciosPage.modal.editDescription', 'Modifica los datos del ejercicio')
              : t('ejerciciosPage.modal.newDescription', 'Crea un nuevo ejercicio para tu biblioteca')
            }
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Columna izquierda - Formulario (2/5 = 40%) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ejerciciosPage.form.nombre', 'Nombre del ejercicio')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ejerciciosPage.form.nombrePlaceholder', 'Ej: Volea cruzada en red')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoría y Nivel */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.categoria', 'Categoría')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIAS.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {t(`ejerciciosPage.categories.${cat.toLowerCase()}`, cat)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.nivel', 'Nivel')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NIVELES.map((niv) => (
                            <SelectItem key={niv} value={niv}>
                              {t(`ejerciciosPage.levels.${niv.toLowerCase()}`, niv)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duración, Jugadores, Intensidad */}
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="duracion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.duracion', 'Duración')} (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jugadores"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.jugadores', 'Jugadores')}</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JUGADORES_OPTIONS.map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intensidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('ejerciciosPage.form.intensidad', 'Intensidad')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INTENSIDADES.map((int) => (
                            <SelectItem key={int} value={int}>
                              {t(`ejerciciosPage.intensities.${int.toLowerCase()}`, int)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Objetivo */}
              <FormField
                control={form.control}
                name="objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ejerciciosPage.form.objetivo', 'Objetivo')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('ejerciciosPage.form.objetivoPlaceholder', 'Ej: Mejorar precisión y timing')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ejerciciosPage.form.descripcion', 'Descripción (opcional)')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('ejerciciosPage.form.descripcionPlaceholder', 'Describe el ejercicio en detalle...')}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Materiales - Desplegable */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className="flex items-center gap-2">
                      {t('ejerciciosPage.form.materiales', 'Materiales necesarios')}
                      {materiales.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {materiales.length}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {MATERIALES_EJERCICIO.map((material) => (
                      <Badge
                        key={material}
                        variant={materiales.includes(material) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          materiales.includes(material)
                            ? "bg-primary hover:bg-primary/80"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleToggleMaterial(material)}
                      >
                        {material}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Tags */}
              <div>
                <FormLabel>{t('ejerciciosPage.form.tags', 'Etiquetas')}</FormLabel>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder={t('ejerciciosPage.form.tagsPlaceholder', 'Añadir etiqueta...')}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 max-w-xs h-8 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                    {t('ejerciciosPage.form.addTag', 'Añadir')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      {t('ejerciciosPage.form.noTags', 'Sin etiquetas')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Columna derecha - Editor de pista y Video (3/5 = 60%) */}
            <div className="lg:col-span-3 space-y-4">
              <EditorPista
                posiciones={posiciones}
                movimientos={movimientos}
                onPosicionesChange={setPosiciones}
                onMovimientosChange={setMovimientos}
              />

              {/* Video del ejercicio - Botón centrado debajo de la pista */}
              <div className="flex flex-col items-center">
                {hasVideo ? (
                  // Estado: hay video - mostrar miniatura y botón ver video
                  <div className="relative w-full max-w-xs">
                    <div
                      className="relative rounded-lg overflow-hidden bg-black aspect-video cursor-pointer group"
                      onClick={() => setShowVideoModal(true)}
                    >
                      {currentThumbnail && (
                        <img
                          src={currentThumbnail}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 rounded-full p-3">
                          <Play className="h-6 w-6 text-black" />
                        </div>
                      </div>
                      {/* Botón eliminar */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingVideo(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setShowVideoModal(true)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t('ejerciciosPage.watchVideo', 'Ver Video')}
                    </Button>
                  </div>
                ) : (
                  // Estado: no hay video - botón subir video
                  <Button
                    type="button"
                    variant="outline"
                    className="max-w-xs"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t('ejerciciosPage.form.uploadVideo', 'Subir video')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
            >
              {isLoading
                ? t('common.saving', 'Guardando...')
                : isEditing
                  ? t('ejerciciosPage.modal.saveChanges', 'Guardar Cambios')
                  : t('ejerciciosPage.modal.createExercise', 'Crear Ejercicio')
              }
            </Button>
          </div>
        </form>
      </Form>

      {/* Modal de subir video */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('ejerciciosPage.form.uploadVideo', 'Subir video')}</DialogTitle>
          </DialogHeader>
          <VideoUploader
            ejercicioId={ejercicio?.id}
            currentVideoUrl={currentVideoUrl}
            currentThumbnail={currentThumbnail}
            videoStatus={ejercicio?.video_status || (pendingVideo ? 'ready' : undefined)}
            onVideoReady={(videoData) => {
              setPendingVideo(videoData);
              setShowUploadModal(false);
            }}
            onVideoDeleted={() => {
              setPendingVideo(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de ver video */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{form.watch('nombre') || t('ejerciciosPage.form.video', 'Video del ejercicio')}</DialogTitle>
          </DialogHeader>
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              poster={currentThumbnail || undefined}
              controls
              className="w-full h-full"
              playsInline
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EjercicioFormInline;
