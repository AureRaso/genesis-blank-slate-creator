import { useState, useRef, useEffect } from "react";
import { Plus, BookOpen, Pencil, Trash2, Clock, Users, ArrowLeft, Play, MoreVertical, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useEjercicios, useDeleteEjercicio } from "@/hooks/useEjercicios";
import { Ejercicio, EjercicioFilters as FiltersType } from "@/types/ejercicios";
import EjercicioFilters from "@/components/ejercicios/EjercicioFilters";
import EjercicioFormInline from "@/components/ejercicios/EjercicioFormInline";
import PistaMiniatura from "@/components/ejercicios/PistaMiniatura";
import Hls from "hls.js";

// Colores para las categorías
const getCategoriaColor = (categoria: string): string => {
  const colors: Record<string, string> = {
    'Volea': 'bg-blue-100 text-blue-800',
    'Bandeja': 'bg-purple-100 text-purple-800',
    'Defensa': 'bg-green-100 text-green-800',
    'Táctica': 'bg-orange-100 text-orange-800',
    'Calentamiento': 'bg-yellow-100 text-yellow-800',
    'Remate': 'bg-red-100 text-red-800',
    'Saque': 'bg-indigo-100 text-indigo-800',
    'Globo': 'bg-cyan-100 text-cyan-800',
    'Dejada': 'bg-pink-100 text-pink-800',
    'Víbora': 'bg-lime-100 text-lime-800',
    'Ataque': 'bg-rose-100 text-rose-800',
    'Transiciones': 'bg-slate-100 text-slate-800',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-800';
};

// Colores para niveles
const getNivelColor = (nivel: string): string => {
  const colors: Record<string, string> = {
    'Iniciación': 'bg-emerald-100 text-emerald-800',
    'Intermedio': 'bg-amber-100 text-amber-800',
    'Avanzado': 'bg-rose-100 text-rose-800',
  };
  return colors[nivel] || 'bg-gray-100 text-gray-800';
};

// Colores para intensidad
const getIntensidadColor = (intensidad: string): string => {
  const colors: Record<string, string> = {
    'Baja': 'bg-teal-100 text-teal-800',
    'Media': 'bg-orange-100 text-orange-800',
    'Alta': 'bg-red-100 text-red-800',
  };
  return colors[intensidad] || 'bg-gray-100 text-gray-800';
};

const EjerciciosPage = () => {
  const { t } = useTranslation();
  const { isAdmin, isTrainer } = useAuth();

  const [filters, setFilters] = useState<FiltersType>({});
  const [viewOnlyEjercicio, setViewOnlyEjercicio] = useState<Ejercicio | null>(null);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [ejercicioToDelete, setEjercicioToDelete] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Video player refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Setup HLS when video modal opens
  useEffect(() => {
    if (!showVideoModal || !viewOnlyEjercicio?.video_url) {
      // Cleanup when modal closes
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    const videoSrc = viewOnlyEjercicio.video_url;

    if (!videoElement || !videoSrc) return;

    // Si es un stream HLS (m3u8)
    if (videoSrc.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoElement.play().catch(() => {});
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
  }, [showVideoModal, viewOnlyEjercicio?.video_url]);

  const { data: ejercicios, isLoading } = useEjercicios(filters);
  const deleteMutation = useDeleteEjercicio();

  const canEdit = isAdmin || isTrainer;
  const canDelete = isAdmin;

  const handleCreateNew = () => {
    setIsCreatingNew(true);
  };

  const handleEdit = (ejercicio: Ejercicio) => {
    // Si estamos viendo el detalle, activar modo edición inline
    if (viewOnlyEjercicio) {
      setIsEditingInline(true);
    }
  };

  const handleEditInlineClose = () => {
    setIsEditingInline(false);
  };

  const handleCreateNewClose = () => {
    setIsCreatingNew(false);
  };

  const handleView = (ejercicio: Ejercicio) => {
    setViewOnlyEjercicio(ejercicio);
  };

  const handleDelete = (id: string) => {
    setEjercicioToDelete(id);
  };

  const confirmDelete = () => {
    if (ejercicioToDelete) {
      deleteMutation.mutate(ejercicioToDelete);
      setEjercicioToDelete(null);
    }
  };

  const handleCloseViewModal = () => {
    setViewOnlyEjercicio(null);
    setIsEditingInline(false);
  };

  // Si estamos creando nuevo ejercicio, mostrar formulario a pantalla completa
  if (isCreatingNew) {
    return (
      <EjercicioFormInline
        ejercicio={null}
        onClose={handleCreateNewClose}
        onSaveSuccess={() => {
          // Refrescar datos - el hook ya invalida la caché
        }}
      />
    );
  }

  // Si estamos editando inline, mostrar formulario de edición
  if (viewOnlyEjercicio && isEditingInline) {
    return (
      <EjercicioFormInline
        ejercicio={viewOnlyEjercicio}
        onClose={handleEditInlineClose}
        onSaveSuccess={() => {
          // Refrescar datos - el hook ya invalida la caché
        }}
      />
    );
  }

  // Si hay un ejercicio seleccionado para ver, mostrar vista de detalle
  if (viewOnlyEjercicio) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header con botón volver */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseViewModal}
            className="h-10 w-10 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-black">
                  {viewOnlyEjercicio.nombre}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2 pointer-events-none">
                  <Badge className={`${getCategoriaColor(viewOnlyEjercicio.categoria)} cursor-default`}>
                    {t(`ejerciciosPage.categories.${viewOnlyEjercicio.categoria.toLowerCase()}`, viewOnlyEjercicio.categoria)}
                  </Badge>
                  <Badge className={`${getNivelColor(viewOnlyEjercicio.nivel)} cursor-default`}>
                    {t(`ejerciciosPage.levels.${viewOnlyEjercicio.nivel.toLowerCase()}`, viewOnlyEjercicio.nivel)}
                  </Badge>
                  <Badge className={`${getIntensidadColor(viewOnlyEjercicio.intensidad)} cursor-default`}>
                    {t(`ejerciciosPage.intensities.${viewOnlyEjercicio.intensidad.toLowerCase()}`, viewOnlyEjercicio.intensidad)}
                  </Badge>
                </div>
              </div>
              {/* Datos básicos - solo desktop */}
              <div className="hidden lg:flex items-center gap-2">
                {viewOnlyEjercicio.video_status === 'ready' && viewOnlyEjercicio.video_url ? (
                  <Button
                    variant="default"
                    className="bg-sidebar hover:bg-sidebar/90"
                    onClick={() => setShowVideoModal(true)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {t('ejerciciosPage.watchVideo', 'Ver Video')}
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground py-2 px-3">
                    <Video className="mr-2 h-4 w-4" />
                    {t('ejerciciosPage.noVideo', 'Sin video')}
                  </Badge>
                )}
                <div className="flex items-center divide-x border rounded-lg px-2 py-2 bg-card">
                  <div className="text-center px-4">
                    <div className="text-muted-foreground text-xs">
                      {t('ejerciciosPage.form.duracion', 'Duración')}
                    </div>
                    <p className="font-semibold">{viewOnlyEjercicio.duracion} min</p>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-muted-foreground text-xs">
                      {t('ejerciciosPage.form.jugadores', 'Jugadores')}
                    </div>
                    <p className="font-semibold">{viewOnlyEjercicio.jugadores}</p>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-muted-foreground text-xs">
                      {t('ejerciciosPage.form.intensidad', 'Intensidad')}
                    </div>
                    <p className="font-semibold">{viewOnlyEjercicio.intensidad}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => handleEdit(viewOnlyEjercicio)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('common.edit', 'Editar')}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => handleDelete(viewOnlyEjercicio.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common.delete', 'Eliminar')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Datos básicos y botón Ver Video - solo mobile */}
        <div className="lg:hidden space-y-3">
          <div className="flex items-center justify-center divide-x border rounded-lg px-2 py-2 bg-card">
            <div className="text-center px-4">
              <div className="text-muted-foreground text-xs">
                {t('ejerciciosPage.form.duracion', 'Duración')}
              </div>
              <p className="font-semibold">{viewOnlyEjercicio.duracion} min</p>
            </div>
            <div className="text-center px-4">
              <div className="text-muted-foreground text-xs">
                {t('ejerciciosPage.form.jugadores', 'Jugadores')}
              </div>
              <p className="font-semibold">{viewOnlyEjercicio.jugadores}</p>
            </div>
            <div className="text-center px-4">
              <div className="text-muted-foreground text-xs">
                {t('ejerciciosPage.form.intensidad', 'Intensidad')}
              </div>
              <p className="font-semibold">{viewOnlyEjercicio.intensidad}</p>
            </div>
          </div>
          {viewOnlyEjercicio.video_status === 'ready' && viewOnlyEjercicio.video_url ? (
            <Button
              variant="default"
              className="w-full bg-sidebar hover:bg-sidebar/90"
              onClick={() => setShowVideoModal(true)}
            >
              <Play className="mr-2 h-4 w-4" />
              {t('ejerciciosPage.watchVideo', 'Ver Video')}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
              <Video className="h-4 w-4" />
              <span className="text-sm">{t('ejerciciosPage.noVideo', 'Sin video')}</span>
            </div>
          )}
        </div>

        {/* Contenido del ejercicio - dos columnas iguales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda - Objetivo, Etiquetas, Descripción */}
          <div className="space-y-4 lg:min-h-0">
            {/* Objetivo */}
            <div>
              <h3 className="font-semibold mb-2">{t('ejerciciosPage.form.objetivo', 'Objetivo')}</h3>
              <p className="text-muted-foreground">{viewOnlyEjercicio.objetivo}</p>
            </div>

            {/* Tags */}
            {viewOnlyEjercicio.tags && viewOnlyEjercicio.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">{t('ejerciciosPage.form.tags', 'Etiquetas')}</h3>
                <div className="flex flex-wrap gap-2">
                  {viewOnlyEjercicio.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Materiales */}
            {viewOnlyEjercicio.materiales && viewOnlyEjercicio.materiales.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">{t('ejerciciosPage.form.materiales', 'Materiales necesarios')}</h3>
                <div className="flex flex-wrap gap-2">
                  {viewOnlyEjercicio.materiales.map((material, i) => (
                    <Badge key={i} variant="outline">{material}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción */}
            {viewOnlyEjercicio.descripcion && (
              <div>
                <h3 className="font-semibold mb-2">{t('ejerciciosPage.form.descripcion', 'Descripción')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{viewOnlyEjercicio.descripcion}</p>
              </div>
            )}
          </div>

          {/* Columna derecha - Pista */}
          <div>
            <svg
              viewBox="0 0 200 100"
              className="bg-[#1e3a5f] rounded w-full"
              style={{ aspectRatio: '2/1' }}
            >
              {/* Fondo de pista */}
              <rect x="0" y="0" width="200" height="100" fill="#1e3a5f" />

              {/* Líneas de la pista (rotadas 90°) */}
              <rect x="5" y="2.5" width="190" height="95" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />

              {/* Línea central */}
              <line x1="100" y1="2.5" x2="100" y2="97.5" stroke="white" strokeWidth="0.5" opacity="0.7" />

              {/* Líneas de servicio (cerca de la pared de fondo) */}
              <line x1="35" y1="2.5" x2="35" y2="97.5" stroke="white" strokeWidth="0.5" opacity="0.7" />
              <line x1="165" y1="2.5" x2="165" y2="97.5" stroke="white" strokeWidth="0.5" opacity="0.7" />

              {/* Líneas centrales de servicio (desde línea de servicio hasta la red) */}
              <line x1="35" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" opacity="0.7" />
              <line x1="100" y1="50" x2="165" y2="50" stroke="white" strokeWidth="0.5" opacity="0.7" />

              {/* Red */}
              <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="1" strokeDasharray="2,1" opacity="0.7" />

              {/* Cristales (paredes) */}
              <rect x="0" y="0" width="200" height="2.5" fill="rgba(200,200,200,0.2)" />
              <rect x="0" y="97.5" width="200" height="2.5" fill="rgba(200,200,200,0.2)" />
              <rect x="0" y="0" width="5" height="100" fill="rgba(200,200,200,0.2)" />
              <rect x="195" y="0" width="5" height="100" fill="rgba(200,200,200,0.2)" />

              {/* Movimientos (flechas) */}
              <defs>
                <marker id="arrowhead-detail" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill="#F59E0B" />
                </marker>
              </defs>

              {(viewOnlyEjercicio.movimientos || []).map((mov, i) => (
                <line
                  key={i}
                  x1={mov.from.y * 2}
                  y1={mov.from.x}
                  x2={mov.to.y * 2}
                  y2={mov.to.x}
                  stroke={mov.color || '#F59E0B'}
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead-detail)"
                  strokeDasharray={mov.type === 'globo' ? '3,2' : undefined}
                />
              ))}

              {/* Jugadores */}
              {(viewOnlyEjercicio.posiciones || []).map((pos, i) => (
                <g key={i} transform={`translate(${pos.y * 2}, ${pos.x})`}>
                  <circle r="6" fill={pos.color} />
                  <text
                    textAnchor="middle"
                    dy="2"
                    fill="white"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    {pos.label}
                  </text>
                </g>
              ))}

              {/* Indicador de pista vacía */}
              {(viewOnlyEjercicio.posiciones || []).length === 0 && (viewOnlyEjercicio.movimientos || []).length === 0 && (
                <text
                  x="100"
                  y="50"
                  textAnchor="middle"
                  dy="3"
                  fill="rgba(255,255,255,0.3)"
                  fontSize="10"
                >
                  -
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={!!ejercicioToDelete} onOpenChange={() => setEjercicioToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('ejerciciosPage.deleteDialog.title', '¿Eliminar ejercicio?')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('ejerciciosPage.deleteDialog.description', 'Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common.cancel', 'Cancelar')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (ejercicioToDelete) {
                    deleteMutation.mutate(ejercicioToDelete);
                    setEjercicioToDelete(null);
                    handleCloseViewModal();
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t('common.delete', 'Eliminar')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de video */}
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent
            className="max-w-3xl p-0 overflow-hidden"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{viewOnlyEjercicio.nombre}</DialogTitle>
            </DialogHeader>
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                poster={viewOnlyEjercicio.video_thumbnail || undefined}
                controls
                className="w-full h-full relative z-50"
                playsInline
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black">
            {t('ejerciciosPage.title', 'Biblioteca de Ejercicios')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('ejerciciosPage.subtitle', 'Gestiona los ejercicios de entrenamiento de tu club')}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('ejerciciosPage.newExercise', 'Nuevo Ejercicio')}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <EjercicioFilters filters={filters} onFiltersChange={setFilters} />

      {/* Lista de ejercicios */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            {t('ejerciciosPage.loading', 'Cargando ejercicios...')}
          </div>
        </div>
      ) : ejercicios && ejercicios.length > 0 ? (
        <div className="flex flex-col gap-3">
          {ejercicios.map((ejercicio) => (
            <div
              key={ejercicio.id}
              className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleView(ejercicio)}
            >
              <PistaMiniatura
                posiciones={ejercicio.posiciones || []}
                movimientos={ejercicio.movimientos || []}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ejercicio.nombre}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge className={`${getCategoriaColor(ejercicio.categoria)} text-xs`}>
                    {t(`ejerciciosPage.categories.${ejercicio.categoria.toLowerCase()}`, ejercicio.categoria)}
                  </Badge>
                  <Badge className={`${getNivelColor(ejercicio.nivel)} text-xs`}>
                    {t(`ejerciciosPage.levels.${ejercicio.nivel.toLowerCase()}`, ejercicio.nivel)}
                  </Badge>
                  <Badge className={`${getIntensidadColor(ejercicio.intensidad)} text-xs`}>
                    {t(`ejerciciosPage.intensities.${ejercicio.intensidad.toLowerCase()}`, ejercicio.intensidad)}
                  </Badge>
                  {ejercicio.video_status === 'ready' && (
                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ejercicio.duracion} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {ejercicio.jugadores} {t('ejerciciosPage.filters.players', 'jugadores')}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(ejercicio);
                    }}
                    className="h-8 w-8"
                    title={t('common.edit', 'Editar')}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ejercicio.id);
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title={t('common.delete', 'Eliminar')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {filters.search || filters.categoria || filters.nivel || filters.intensidad || filters.jugadores
                ? t('ejerciciosPage.noExercisesFiltered', 'No se encontraron ejercicios con los filtros aplicados')
                : t('ejerciciosPage.noExercises', 'No hay ejercicios en tu biblioteca')
              }
            </p>
            {canEdit && !filters.search && !filters.categoria && (
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('ejerciciosPage.createFirstExercise', 'Crear Primer Ejercicio')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!ejercicioToDelete} onOpenChange={() => setEjercicioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('ejerciciosPage.deleteDialog.title', '¿Eliminar ejercicio?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('ejerciciosPage.deleteDialog.description', 'Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel', 'Cancelar')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete', 'Eliminar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EjerciciosPage;
