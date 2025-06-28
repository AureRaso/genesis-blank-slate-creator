
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Eye, Swords, UserPlus } from "lucide-react";

interface TeamStatusCardProps {
  playerTeam: any;
  partner: any;
  onShowTeamsView: () => void;
  onCreateMatch: () => void;
  onShowPartnerSelection: () => void;
}

const TeamStatusCard = ({ 
  playerTeam, 
  partner, 
  onShowTeamsView, 
  onCreateMatch, 
  onShowPartnerSelection 
}: TeamStatusCardProps) => {
  if (playerTeam && partner) {
    return (
      <Card className="border-2 border-dashed border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Tu Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-green-500 text-white">
                    {partner.full_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-green-800">{partner.full_name || 'Compañero'}</p>
                  <p className="text-sm text-green-600">Tu compañero de equipo</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-800">{playerTeam.name}</p>
                <p className="text-sm text-green-600">Nombre del equipo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={onShowTeamsView}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Equipos
              </Button>
              <Button 
                onClick={onCreateMatch}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <Swords className="h-4 w-4 mr-2" />
                Crear Partido
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Estado de Emparejamiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div className="p-6">
            <Users className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Aún no tienes pareja en esta liga
            </h3>
            <p className="text-green-700 mb-4">
              Elige un compañero para empezar a jugar y crear partidos
            </p>
            <Button 
              onClick={onShowPartnerSelection}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Elegir Compañero
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamStatusCard;
