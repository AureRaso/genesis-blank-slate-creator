
import React, { createContext, useContext, useState } from "react";
import type { ClassFiltersData } from "@/components/ClassFilters";

interface ClassFiltersContextType {
  filters: ClassFiltersData;
  setFilters: (filters: ClassFiltersData) => void;
  updateFilter: (key: keyof ClassFiltersData, value: string) => void;
  clearFilters: () => void;
}

const ClassFiltersContext = createContext<ClassFiltersContextType | undefined>(undefined);

const defaultFilters: ClassFiltersData = {
  search: "",
  level: "",
  dayOfWeek: "",
  groupId: "",
  trainerName: "",
  status: ""
};

export function ClassFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<ClassFiltersData>(defaultFilters);

  const updateFilter = (key: keyof ClassFiltersData, value: string) => {
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
