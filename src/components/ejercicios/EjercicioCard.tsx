import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Zap, Target, Pencil, Trash2, Eye, Video } from "lucide-react";
import { Ejercicio } from "@/types/ejercicios";
import { useTranslation } from "react-i18next";

interface EjercicioCardProps {
  ejercicio: Ejercicio;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (ejercicio: Ejercicio) => void;
  onDelete: (id: string) => void;
  onView: (ejercicio: Ejercicio) => void;
}

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

const EjercicioCard = ({
  ejercicio,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onView
}: EjercicioCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{ejercicio.nombre}</CardTitle>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge className={getCategoriaColor(ejercicio.categoria)}>
                {t(`ejerciciosPage.categories.${ejercicio.categoria.toLowerCase()}`, ejercicio.categoria)}
              </Badge>
              <Badge className={getNivelColor(ejercicio.nivel)}>
                {t(`ejerciciosPage.levels.${ejercicio.nivel.toLowerCase()}`, ejercicio.nivel)}
              </Badge>
              {ejercicio.video_status === 'ready' && (
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(ejercicio)}
              className="h-8 w-8"
              title={t('common.view', 'Ver')}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(ejercicio)}
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
                onClick={() => onDelete(ejercicio.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
                title={t('common.delete', 'Eliminar')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Objetivo */}
        <div className="flex items-start gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground line-clamp-2">{ejercicio.objetivo}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{ejercicio.duracion} min</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{ejercicio.jugadores}</span>
          </div>
          <div className="flex items-center justify-end">
            <Badge variant="outline" className={getIntensidadColor(ejercicio.intensidad)}>
              <Zap className="h-3 w-3 mr-1" />
              {t(`ejerciciosPage.intensities.${ejercicio.intensidad.toLowerCase()}`, ejercicio.intensidad)}
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {ejercicio.tags && ejercicio.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
            {ejercicio.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {ejercicio.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{ejercicio.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EjercicioCard;
