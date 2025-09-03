
import { useState } from "react";
import { Filter, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GroupSizeFilter } from "./filters/GroupSizeFilter";
import { LevelFilter } from "./filters/LevelFilter";
import { WeekDaysFilter } from "./filters/WeekDaysFilter";
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
  const { t } = useTranslation();

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
    if (filters.withDiscountOnly) count++;
    return count;
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.level) active.push({ key: "level", label: t('classes.levelBy', { value: filters.level }) });
    if (filters.dayOfWeek) active.push({ key: "dayOfWeek", label: t('classes.dayBy', { value: filters.dayOfWeek }) });
    if (filters.groupId) {
      const group = groups?.find(g => g.id === filters.groupId);
      active.push({ key: "groupId", label: t('classes.groupBy', { value: group?.name || filters.groupId }) });
    }
    if (filters.trainerName) active.push({ key: "trainerName", label: t('classes.trainerBy', { value: filters.trainerName }) });
    if (filters.status) active.push({ key: "status", label: t('classes.stateBy', { value: filters.status }) });
    if (filters.minGroupSize !== undefined) active.push({ key: "minGroupSize", label: t('classes.minStudentsBy', { value: filters.minGroupSize }) });
    if (filters.maxGroupSize !== undefined) active.push({ key: "maxGroupSize", label: t('classes.maxStudentsBy', { value: filters.maxGroupSize }) });
    if (filters.levelFrom !== undefined) active.push({ key: "levelFrom", label: t('classes.levelFromBy', { value: filters.levelFrom }) });
    if (filters.levelTo !== undefined) active.push({ key: "levelTo", label: t('classes.levelToBy', { value: filters.levelTo }) });
    if (filters.customLevels.length > 0) active.push({ key: "customLevels", label: t('classes.levelsBy', { count: filters.customLevels.length }) });
    if (filters.weekDays.length > 0) active.push({ key: "weekDays", label: t('classes.daysBy', { count: filters.weekDays.length }) });
    if (filters.withDiscountOnly) active.push({ key: "withDiscountOnly", label: t('classes.withDiscount') });
    return active;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const activeFilters = getActiveFilters();

  return (
    <Card>
      <CardContent className="p-4">
        {/* Filters button */}
        <div className="flex items-center justify-start mb-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {t('classes.filters')}
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
            <span className="text-sm text-muted-foreground">{t('classes.activeFilters')}:</span>
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
              {t('classes.clearAll')}
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


              <DiscountFilter
                withDiscountOnly={filters.withDiscountOnly}
                onChange={(value) => updateFilter("withDiscountOnly", value)}
              />
            </div>

            {/* Filtros originales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('classes.state')}</label>
                <Select 
                  value={filters.status || "all"} 
                  onValueChange={(value) => updateFilter("status", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('classes.allStates')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    <SelectItem value="all">{t('classes.allStates')}</SelectItem>
                    <SelectItem value="scheduled">{t('classes.scheduled')}</SelectItem>
                    <SelectItem value="completed">{t('classes.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('classes.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {groups && groups.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('classes.group')}</label>
                  <Select 
                    value={filters.groupId || "all"} 
                    onValueChange={(value) => updateFilter("groupId", value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('classes.allGroups')} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="all">{t('classes.allGroups')}</SelectItem>
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
                  <label className="text-sm font-medium mb-2 block">{t('classes.trainer')}</label>
                  <Select 
                    value={filters.trainerName || "all"} 
                    onValueChange={(value) => updateFilter("trainerName", value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('classes.allTrainers')} />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="all">{t('classes.allTrainers')}</SelectItem>
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
