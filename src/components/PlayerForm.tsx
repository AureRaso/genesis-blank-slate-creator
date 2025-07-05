
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Info, Users, Shield } from "lucide-react";

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Gestión de Jugadores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Registro Automático</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Los jugadores se registran directamente seleccionando su club. 
              El sistema les asigna automáticamente el rol de jugador y los asocia al club elegido.
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Contenido por Club</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cada jugador solo verá ligas, clases y entrenadores de su club asignado, 
              creando un entorno privado y seguro por club.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Los jugadores existentes sin club asignado necesitarán 
            que un administrador les asigne un club desde la sección de Jugadores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerForm;
