
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useActiveClubs } from "@/hooks/useActiveClubs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");

  console.log('ClubSelector - clubs data:', clubs);
  console.log('ClubSelector - loading:', isLoading);
  console.log('ClubSelector - error:', error);

  // Filtrar clubes por término de búsqueda
  const filteredClubs = clubs?.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
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

  return (
    <div className="space-y-2">
      <Label htmlFor="club-selector">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="club-selector">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          {clubs && clubs.length > 5 && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar club..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          )}
          {filteredClubs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? "No se encontraron clubes" : "No hay clubes activos disponibles"}
            </div>
          ) : (
            filteredClubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{club.name}</span>
                  <span className="text-xs text-gray-500">{club.address}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClubSelector;
