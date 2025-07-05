
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Info } from "lucide-react";

const PlayerForm = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Solo los administradores pueden ver esta sección.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Registro de Jugadores</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Los jugadores ahora se registran directamente a través del formulario de registro público, 
              donde seleccionan su club de afiliación. Esto asegura que cada jugador esté asociado 
              correctamente a un club desde el momento de su registro.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerForm;
