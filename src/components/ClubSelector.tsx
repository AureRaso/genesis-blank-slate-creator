
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useActiveClubs } from "@/hooks/useActiveClubs";

interface ClubSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const ClubSelector = ({ 
  value, 
  onValueChange, 
  label = "Club", 
  placeholder = "Selecciona un club",
  required = false 
}: ClubSelectorProps) => {
  const { data: clubs, isLoading, error } = useActiveClubs();

  console.log('ClubSelector - Rendering component');
  console.log('ClubSelector - clubs data:', clubs);
  console.log('ClubSelector - loading:', isLoading);
  console.log('ClubSelector - error:', error);
  console.log('ClubSelector - value:', value);

  if (isLoading) {
    console.log('ClubSelector - Showing loading state');
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (error) {
    console.error('ClubSelector - Error loading clubs:', error);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-10 bg-red-50 border border-red-200 rounded-md flex items-center px-3">
          <span className="text-red-600 text-sm">Error al cargar clubes</span>
        </div>
      </div>
    );
  }

  if (!clubs || clubs.length === 0) {
    console.log('ClubSelector - No clubs found');
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-10 bg-yellow-50 border border-yellow-200 rounded-md flex items-center px-3">
          <span className="text-yellow-600 text-sm">No hay clubes disponibles</span>
        </div>
      </div>
    );
  }

  console.log('ClubSelector - Rendering select with', clubs.length, 'clubs');

  return (
    <div className="space-y-2">
      <Label htmlFor="club-selector">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="club-selector" className="bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id}>
              <div className="flex flex-col">
                <span className="font-medium">{club.name}</span>
                <span className="text-xs text-gray-500">{club.address}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClubSelector;
