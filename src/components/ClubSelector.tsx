
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  console.log('ClubSelector - Component rendering');

  const { data: clubs, isLoading, error } = useQuery({
    queryKey: ['active-clubs'],
    queryFn: async () => {
      console.log('ClubSelector - Fetching clubs...');
      
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      console.log('ClubSelector - Query result:', { data, error });
      
      if (error) {
        console.error('ClubSelector - Error:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  console.log('ClubSelector - State:', { clubs, isLoading, error, value });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-12 bg-gray-100 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    console.error('ClubSelector - Render error:', error);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-12 bg-red-50 border border-red-200 rounded-xl flex items-center px-3">
          <span className="text-red-600 text-sm">Error al cargar clubes</span>
        </div>
      </div>
    );
  }

  if (!clubs || clubs.length === 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="h-12 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center px-3">
          <span className="text-yellow-600 text-sm">No hay clubes disponibles</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="club-selector" className="text-gray-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id="club-selector" className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white/50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50 rounded-xl">
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id} className="cursor-pointer">
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
