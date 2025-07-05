
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SimpleClubSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const SimpleClubSelector = ({ 
  value, 
  onValueChange, 
  label = "Club (Simple)", 
  placeholder = "Selecciona un club",
  required = false 
}: SimpleClubSelectorProps) => {
  console.log('🟢 SimpleClubSelector - Rendering with value:', value);

  // Datos hardcodeados para prueba
  const mockClubs = [
    { id: '1', name: 'Club Test 1', address: 'Dirección 1' },
    { id: '2', name: 'Club Test 2', address: 'Dirección 2' },
    { id: '3', name: 'Club Test 3', address: 'Dirección 3' }
  ];

  return (
    <div 
      className="space-y-2 border-2 border-green-500 p-2 bg-green-50" 
      style={{ 
        minHeight: '80px',
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        zIndex: 9998,
        position: 'relative'
      }}
    >
      <div className="text-green-600 font-bold text-xs">
        🟢 SIMPLE SELECTOR - Siempre visible con datos mock
      </div>
      
      <Label htmlFor="simple-club-selector" className="text-gray-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger 
          id="simple-club-selector" 
          className="h-12 border-2 border-green-500 rounded-xl focus:border-blue-500 transition-all duration-300 bg-white"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-[10000] rounded-xl">
          {mockClubs.map((club) => (
            <SelectItem key={club.id} value={club.id} className="cursor-pointer">
              <div className="flex flex-col">
                <span className="font-medium">{club.name}</span>
                <span className="text-xs text-gray-500">{club.address}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="text-xs text-gray-500 mt-1">
        🟢 Valor seleccionado: {value || 'ninguno'}
      </div>
    </div>
  );
};

export default SimpleClubSelector;
