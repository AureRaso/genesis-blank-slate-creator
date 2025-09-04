import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  groups?: Array<{
    id: string;
    name: string;
    level: string;
  }>;
  trainers?: Array<{
    name: string;
  }>;
}
export default function ClassFilters({
  filters,
  onFiltersChange,
  groups,
  trainers
}: ClassFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    t
  } = useTranslation();
  const updateFilter = (key: keyof ClassFiltersData, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };
  const clearFilter = (key: keyof ClassFiltersData) => {
    let defaultValue: any = "";
    if (key === 'customLevels' || key === 'weekDays') defaultValue = [];
    if (key === 'withDiscountOnly') defaultValue = false;
    if (key === 'minGroupSize' || key === 'maxGroupSize' || key === 'levelFrom' || key === 'levelTo') defaultValue = undefined;
    onFiltersChange({
      ...filters,
      [key]: defaultValue
    });
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
    if (filters.search) active.push({
      key: "search",
      label: t('classes.searchBy', {
        value: filters.search
      })
    });
    if (filters.level) active.push({
      key: "level",
      label: t('classes.levelBy', {
        value: filters.level
      })
    });
    if (filters.dayOfWeek) active.push({
      key: "dayOfWeek",
      label: t('classes.dayBy', {
        value: filters.dayOfWeek
      })
    });
    if (filters.groupId) {
      const group = groups?.find(g => g.id === filters.groupId);
      active.push({
        key: "groupId",
        label: t('classes.groupBy', {
          value: group?.name || filters.groupId
        })
      });
    }
    if (filters.trainerName) active.push({
      key: "trainerName",
      label: t('classes.trainerBy', {
        value: filters.trainerName
      })
    });
    if (filters.status) active.push({
      key: "status",
      label: t('classes.stateBy', {
        value: filters.status
      })
    });
    if (filters.minGroupSize !== undefined) active.push({
      key: "minGroupSize",
      label: t('classes.minStudentsBy', {
        value: filters.minGroupSize
      })
    });
    if (filters.maxGroupSize !== undefined) active.push({
      key: "maxGroupSize",
      label: t('classes.maxStudentsBy', {
        value: filters.maxGroupSize
      })
    });
    if (filters.levelFrom !== undefined) active.push({
      key: "levelFrom",
      label: t('classes.levelFromBy', {
        value: filters.levelFrom
      })
    });
    if (filters.levelTo !== undefined) active.push({
      key: "levelTo",
      label: t('classes.levelToBy', {
        value: filters.levelTo
      })
    });
    if (filters.customLevels.length > 0) active.push({
      key: "customLevels",
      label: t('classes.levelsBy', {
        count: filters.customLevels.length
      })
    });
    if (filters.weekDays.length > 0) active.push({
      key: "weekDays",
      label: t('classes.daysBy', {
        count: filters.weekDays.length
      })
    });
    if (filters.studentName) active.push({
      key: "studentName",
      label: t('classes.studentBy', {
        value: filters.studentName
      })
    });
    if (filters.withDiscountOnly) active.push({
      key: "withDiscountOnly",
      label: t('classes.withDiscount')
    });
    return active;
  };
  const activeFiltersCount = getActiveFiltersCount();
  const activeFilters = getActiveFilters();
  return <div className="space-y-4">
      {/* Search bar and filter button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('classes.searchPlaceholder')} value={filters.search} onChange={e => updateFilter("search", e.target.value)} className="pl-10" />
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t('classes.filters')}
              {activeFiltersCount > 0 && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Advanced filters card */}
      
    </div>;
}