
import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GroupSizeFilter } from "./filters/GroupSizeFilter";
import { LevelFilter } from "./filters/LevelFilter";
import { WeekDaysFilter } from "./filters/WeekDaysFilter";
import { StudentNameFilter } from "./filters/StudentNameFilter";
import { DiscountFilter } from "./filters/DiscountFilter";
import type { ClassFiltersData } from "@/contexts/ClassFiltersContext";

interface ClassFiltersProps {
  filters: ClassFiltersData;
  onFiltersChange: (filters: ClassFiltersData) => void;
  groups?: Array<{ id: string; name: string; level: string }>;
  trainers?: Array<{ name: string }>;
}

export default function ClassFilters({ filters, onFiltersChange, groups, trainers }: ClassFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof ClassFiltersData, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof ClassFiltersData) => {
    let defaultValue: any = "";
    if (key === 'customLevels' || key === 'weekDays') defaultValue = [];
    if (key === 'withDiscountOnly') defaultValue = false;
    if (key === 'minGroupSize' || key === 'maxGroupSize' || key === 'levelFrom' || key === 'levelTo') defaultValue = undefined;
    
    onFiltersChange({ ...filters, [key]: defaultValue });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      level: "",
      dayOfWeek: "",
      groupId: "",
      trainerName: "",
      status: "",
      minGroupSize: undefined,
      maxGroupSize: undefined,
      levelFrom: undefined,
      levelTo: undefined,
      customLevels: [],
      weekDays: [],
      studentName: "",
      withDiscountOnly: false
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.level) count++;
    if (filters.dayOfWeek) count++;
    if (filters.groupId) count++;
    if (filters.trainerName) count++;
    if (filters.status) count++;
    if (filters.minGroupSize !== undefined) count++;
    if (filters.maxGroupSize !== undefined) count++;
    if (filters.levelFrom !== undefined) count++;
    if (filters.levelTo !== undefined) count++;
    if (filters.customLevels.length > 0) count++;
    if (filters.weekDays.length > 0) count++;
    if (filters.studentName) count++;
    if (filters.withDiscountOnly) count++;
    return count;
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.search) active.push({ key: "search", label: `Búsqueda: ${filters.search}` });
    if (filters.level) active.push({ key: "level", label: `Nivel: ${filters.level}` });
    if (filters.dayOfWeek) active.push({ key: "dayOfWeek", label: `Día: ${filters.dayOfWeek}` });
    if (filters.groupId) {
      const group = groups?.find(g => g.id === filters.groupId);
      active.push({ key: "groupId", label: `Grupo: ${group?.name || filters.groupId}` });
    }
    if (filters.trainerName) active.push({ key: "trainerName", label: `Entrenador: ${filters.trainerName}` });
    if (filters.status) active.push({ key: "status", label: `Estado: ${filters.status}` });
    if (filters.minGroupSize !== undefined) active.push({ key: "minGroupSize", label: `Min. alumnos: ${filters.minGroupSize}` });
    if (filters.maxGroupSize !== undefined) active.push({ key: "maxGroupSize", label: `Max. alumnos: ${filters.maxGroupSize}` });
    if (filters.levelFrom !== undefined) active.push({ key: "levelFrom", label: `Nivel desde: ${filters.levelFrom}` });
    if (filters.levelTo !== undefined) active.push({ key: "levelTo", label: `Nivel hasta: ${filters.levelTo}` });
    if (filters.customLevels.length > 0) active.push({ key: "customLevels", label: `Niveles: ${filters.customLevels.length}` });
    if (filters.weekDays.length > 0) active.push({ key: "weekDays", label: `Días: ${filters.weekDays.length}` });
    if (filters.studentName) active.push({ key: "studentName", label: `Alumno: ${filters.studentName}` });
    if (filters.withDiscountOnly) active.push({ key: "withDiscountOnly", label: "Con descuento" });
    return active;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const activeFilters = getActiveFilters();

  return (
    <Card>
      <CardContent className="p-4">
        {/* Search bar always visible */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clases, alumnos, grupos..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
          </div>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {activeFilters.map((filter) => (
              <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
                {filter.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => clearFilter(filter.key as keyof ClassFiltersData)}
                />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Limpiar todo
            </Button>
          </div>
        )}

        {/* Collapsible advanced filters */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-4">
            {/* Nuevos filtros avanzados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <GroupSizeFilter
                minSize={filters.minGroupSize}
                maxSize={filters.maxGroupSize}
                onMinChange={(value) => updateFilter("minGroupSize", value)}
                onMaxChange={(value) => updateFilter("maxGroupSize", value)}
              />

              <LevelFilter
                levelFrom={filters.levelFrom}
                levelTo={filters.levelTo}
                customLevels={filters.customLevels}
                onLevelFromChange={(value) => updateFilter("levelFrom", value)}
                onLevelToChange={(value) => updateFilter("levelTo", value)}
                onCustomLevelsChange={(levels) => updateFilter("customLevels", levels)}
              />

              <WeekDaysFilter
                selectedDays={filters.weekDays}
                onDaysChange={(days) => updateFilter("weekDays", days)}
              />

              <StudentNameFilter
                value={filters.studentName}
                onChange={(value) => updateFilter("studentName", value)}
              />

              <DiscountFilter
                withDiscountOnly={filters.withDiscountOnly}
                onChange={(value) => updateFilter("withDiscountOnly", value)}
              />
            </div>

            {/* Filtros originales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {groups && groups.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Grupo</label>
                  <Select value={filters.groupId} onValueChange={(value) => updateFilter("groupId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los grupos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los grupos</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} - {group.level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {trainers && trainers.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Entrenador</label>
                  <Select value={filters.trainerName} onValueChange={(value) => updateFilter("trainerName", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los entrenadores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los entrenadores</SelectItem>
                      {trainers.map((trainer, index) => (
                        <SelectItem key={index} value={trainer.name}>
                          {trainer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
