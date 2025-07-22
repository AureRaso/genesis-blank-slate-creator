
import React, { createContext, useContext, useState } from "react";

export interface ClassFiltersData {
  search: string;
  level: string;
  dayOfWeek: string;
  groupId: string;
  trainerName: string;
  status: string;
  // Nuevos filtros
  minGroupSize: number | undefined;
  maxGroupSize: number | undefined;
  levelFrom: number | undefined;
  levelTo: number | undefined;
  customLevels: string[];
  weekDays: string[];
  studentName: string;
  withDiscountOnly: boolean;
}

interface ClassFiltersContextType {
  filters: ClassFiltersData;
  setFilters: (filters: ClassFiltersData) => void;
  updateFilter: (key: keyof ClassFiltersData, value: any) => void;
  clearFilters: () => void;
}

const ClassFiltersContext = createContext<ClassFiltersContextType | undefined>(undefined);

const defaultFilters: ClassFiltersData = {
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
};

export function ClassFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<ClassFiltersData>(defaultFilters);

  const updateFilter = (key: keyof ClassFiltersData, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <ClassFiltersContext.Provider value={{
      filters,
      setFilters,
      updateFilter,
      clearFilters
    }}>
      {children}
    </ClassFiltersContext.Provider>
  );
}

export function useClassFilters() {
  const context = useContext(ClassFiltersContext);
  if (context === undefined) {
    throw new Error('useClassFilters must be used within a ClassFiltersProvider');
  }
  return context;
}
