
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, X } from "lucide-react";
import { useCreateLeague } from "@/hooks/useLeagues";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface QuickLeagueFormProps {
  onClose: () => void;
}

const QuickLeagueForm = ({ onClose }: QuickLeagueFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    registration_price: "25.00",
    start_date: "",
    end_date: "",
  });

  const createLeague = useCreateLeague();
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    // For players, automatically assign their club_id
    const club_id = !isAdmin && profile?.club_id ? profile.club_id : undefined;

    if (!club_id && !isAdmin) {
      toast({
        title: "Error",
        description: "No tienes un club asignado. Contacta con el administrador.",
        variant: "destructive",
      });
      return;
    }

    createLeague.mutate({
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date,
      registration_price: parseFloat(formData.registration_price),
      points_victory: 3,
      points_defeat: 0,
      points_per_set: true,
      status: "upcoming" as const,
      club_id: club_id || "", // For admins, they need to complete in full form
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Crear Liga Rápida
            </CardTitle>
            <CardDescription>
              Crea una nueva liga con configuración predeterminada
              {!isAdmin && profile?.club_id && " para tu club"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Liga *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Liga Primavera 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_price">Precio de Inscripción (€)</Label>
              <Input
                id="registration_price"
                name="registration_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.registration_price}
                onChange={handleChange}
                placeholder="25.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Fecha Inicio *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Fecha Fin *</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Configuración predeterminada:</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Puntos victoria: 3</li>
                <li>• Puntos derrota: 0</li>
                <li>• Punto extra por set ganado: Sí</li>
                {!isAdmin && profile?.club_id && (
                  <li>• Club: Asignado automáticamente a tu club</li>
                )}
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createLeague.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {createLeague.isPending ? "Creando..." : "Crear Liga"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickLeagueForm;
