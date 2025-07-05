
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
  console.log('🔧 ClubSelector - Component rendering with props:', { value, label, placeholder, required });

  const { data: clubs, isLoading, error } = useQuery({
    queryKey: ['active-clubs'],
    queryFn: async () => {
      console.log('🔧 ClubSelector - Starting query for clubs...');
      
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('status', 'active')
          .order('name', { ascending: true });
        
        console.log('🔧 ClubSelector - Query completed:', { data, error, count: data?.length });
        
        if (error) {
          console.error('🔧 ClubSelector - Query error:', error);
          throw error;
        }
        
        return data || [];
      } catch (err) {
        console.error('🔧 ClubSelector - Exception in queryFn:', err);
        throw err;
      }
    },
  });

  console.log('🔧 ClubSelector - Render state:', { 
    clubs: clubs?.length || 0, 
    isLoading, 
    error: error?.message,
    value 
  });

  // Forzar que siempre se renderice algo visible
  return (
    <div 
      className="space-y-2 border-2 border-red-500 p-2 bg-yellow-100" 
      style={{ 
        minHeight: '80px',
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        zIndex: 9999,
        position: 'relative'
      }}
    >
      <div className="text-red-600 font-bold text-xs">
        🔧 DEBUG: ClubSelector renderizado - Loading: {isLoading ? 'SÍ' : 'NO'} | 
        Clubs: {clubs?.length || 0} | 
        Error: {error ? 'SÍ' : 'NO'}
      </div>
      
      <Label htmlFor="club-selector" className="text-gray-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {isLoading && (
        <div className="h-12 bg-blue-100 animate-pulse rounded-xl flex items-center px-3">
          <span className="text-blue-600 text-sm">🔄 Cargando clubes...</span>
        </div>
      )}

      {error && (
        <div className="h-12 bg-red-50 border border-red-200 rounded-xl flex items-center px-3">
          <span className="text-red-600 text-sm">❌ Error: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && (!clubs || clubs.length === 0) && (
        <div className="h-12 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center px-3">
          <span className="text-yellow-600 text-sm">⚠️ No hay clubes disponibles</span>
        </div>
      )}

      {!isLoading && !error && clubs && clubs.length > 0 && (
        <Select value={value} onValueChange={onValueChange} required={required}>
          <SelectTrigger 
            id="club-selector" 
            className="h-12 border-2 border-green-500 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-[10000] rounded-xl">
            {clubs.map((club) => {
              console.log('🔧 ClubSelector - Rendering club option:', club);
              return (
                <SelectItem key={club.id} value={club.id} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">{club.name}</span>
                    <span className="text-xs text-gray-500">{club.address}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

      <div className="text-xs text-gray-500 mt-1">
        🔧 Valor actual: {value || 'ninguno'}
      </div>
    </div>
  );
};

export default ClubSelector;
