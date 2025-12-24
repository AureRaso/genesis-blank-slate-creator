import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, SlidersHorizontal, X, Video, VideoOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  EjercicioFilters as FiltersType,
  CATEGORIAS,
  NIVELES,
  INTENSIDADES,
  JUGADORES_OPTIONS,
  CategoriaEjercicio,
  NivelEjercicio,
  IntensidadEjercicio
} from "@/types/ejercicios";

interface EjercicioFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

const EjercicioFilters = ({ filters, onFiltersChange }: EjercicioFiltersProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FiltersType>(filters);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempFilters(filters);
    }
    setIsOpen(open);
  };

  const toggleCategoria = (cat: CategoriaEjercicio) => {
    setTempFilters(prev => ({
      ...prev,
      categoria: prev.categoria === cat ? undefined : cat
    }));
  };

  const toggleNivel = (niv: NivelEjercicio) => {
    setTempFilters(prev => ({
      ...prev,
      nivel: prev.nivel === niv ? undefined : niv
    }));
  };

  const toggleIntensidad = (int: IntensidadEjercicio) => {
    setTempFilters(prev => ({
      ...prev,
      intensidad: prev.intensidad === int ? undefined : int
    }));
  };

  const toggleJugadores = (num: number) => {
    setTempFilters(prev => ({
      ...prev,
      jugadores: prev.jugadores === num ? undefined : num
    }));
  };

  const toggleTieneVideo = (value: boolean) => {
    setTempFilters(prev => ({
      ...prev,
      tieneVideo: prev.tieneVideo === value ? undefined : value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange({ ...tempFilters, search: filters.search });
    setIsOpen(false);
  };

  const handleClearTempFilters = () => {
    setTempFilters({ search: filters.search });
  };

  const handleClearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = [
    filters.categoria,
    filters.nivel,
    filters.intensidad,
    filters.jugadores,
    filters.tieneVideo !== undefined ? filters.tieneVideo : null
  ].filter(val => val !== null && val !== undefined).length;

  const hasActiveFilters = filters.search || activeFiltersCount > 0;

  return (
    <div className="flex flex-row gap-2 items-center">
      {/* Búsqueda */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('ejerciciosPage.filters.searchPlaceholder', 'Buscar ejercicio...')}
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Botón de filtros con Popover */}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex-shrink-0 gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t('ejerciciosPage.filters.advancedFilters', 'Filtros')}</span>
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 sm:w-96 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{t('ejerciciosPage.filters.advancedFiltersTitle', 'Filtros avanzados')}</h4>
              {(tempFilters.categoria || tempFilters.nivel || tempFilters.intensidad || tempFilters.jugadores || tempFilters.tieneVideo !== undefined) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearTempFilters}
                  className="text-muted-foreground h-8 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  {t('ejerciciosPage.filters.clearFilters', 'Limpiar')}
                </Button>
              )}
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">{t('ejerciciosPage.filters.categoria', 'Categoría')}</h5>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS.map((cat) => (
                  <Badge
                    key={cat}
                    variant={tempFilters.categoria === cat ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-colors ${
                      tempFilters.categoria === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleCategoria(cat)}
                  >
                    {t(`ejerciciosPage.categories.${cat.toLowerCase()}`, cat)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Nivel */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">{t('ejerciciosPage.filters.nivel', 'Nivel')}</h5>
              <div className="flex flex-wrap gap-1.5">
                {NIVELES.map((niv) => (
                  <Badge
                    key={niv}
                    variant={tempFilters.nivel === niv ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-colors ${
                      tempFilters.nivel === niv
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleNivel(niv)}
                  >
                    {t(`ejerciciosPage.levels.${niv.toLowerCase()}`, niv)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Intensidad */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">{t('ejerciciosPage.filters.intensidad', 'Intensidad')}</h5>
              <div className="flex flex-wrap gap-1.5">
                {INTENSIDADES.map((int) => (
                  <Badge
                    key={int}
                    variant={tempFilters.intensidad === int ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-colors ${
                      tempFilters.intensidad === int
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleIntensidad(int)}
                  >
                    {t(`ejerciciosPage.intensities.${int.toLowerCase()}`, int)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Jugadores */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">{t('ejerciciosPage.filters.jugadores', 'Jugadores')}</h5>
              <div className="flex flex-wrap gap-1.5">
                {JUGADORES_OPTIONS.map((num) => (
                  <Badge
                    key={num}
                    variant={tempFilters.jugadores === num ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-colors ${
                      tempFilters.jugadores === num
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleJugadores(num)}
                  >
                    {num}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Video */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">{t('ejerciciosPage.filters.video', 'Video')}</h5>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={tempFilters.tieneVideo === true ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-colors ${
                    tempFilters.tieneVideo === true
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleTieneVideo(true)}
                >
                  <Video className="w-3 h-3 mr-1" />
                  {t('ejerciciosPage.filters.withVideo', 'Con video')}
                </Badge>
                <Badge
                  variant={tempFilters.tieneVideo === false ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-colors ${
                    tempFilters.tieneVideo === false
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleTieneVideo(false)}
                >
                  <VideoOff className="w-3 h-3 mr-1" />
                  {t('ejerciciosPage.filters.withoutVideo', 'Sin video')}
                </Badge>
              </div>
            </div>

            {/* Botón aplicar */}
            <Button
              onClick={handleApplyFilters}
              className="w-full bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
            >
              {t('ejerciciosPage.filters.applyFilters', 'Aplicar filtros')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Botón limpiar todos los filtros */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearAllFilters}
          className="text-muted-foreground flex-shrink-0"
          title={t('ejerciciosPage.filters.clearFilters', 'Limpiar filtros')}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default EjercicioFilters;
