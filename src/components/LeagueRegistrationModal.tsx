
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Trophy, Users, MapPin } from "lucide-react";
import { League } from "@/types/padel";
import { useLeagueRegistration } from "@/hooks/useLeagueRegistration";

interface LeagueRegistrationModalProps {
  league: League | null;
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
}

const LeagueRegistrationModal = ({ league, isOpen, onClose, profileId }: LeagueRegistrationModalProps) => {
  const leagueRegistration = useLeagueRegistration();

  if (!league) return null;

  const handleConfirmRegistration = () => {
    leagueRegistration.mutate({
      league_id: league.id,
      profile_id: profileId,
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'upcoming': return 'Próximamente';
      case 'completed': return 'Finalizada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            Inscribirse en Liga
          </DialogTitle>
          <DialogDescription>
            Confirma tu inscripción en la siguiente liga
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">{league.name}</h3>
              <Badge className={getStatusColor(league.status)}>
                {getStatusText(league.status)}
              </Badge>
            </div>
            
            {league.clubs && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                {league.clubs.name}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <span className="text-muted-foreground">Inicio:</span>
                  <div className="font-medium">{league.start_date}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-red-600" />
                <div>
                  <span className="text-muted-foreground">Fin:</span>
                  <div className="font-medium">{league.end_date}</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="text-sm space-y-1">
                <div>• Victoria: {league.points_victory} puntos</div>
                <div>• Derrota: {league.points_defeat} puntos</div>
                {league.points_per_set && (
                  <div>• Puntos adicionales por sets ganados</div>
                )}
              </div>
            </div>

            {league.registration_price > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-700">
                    €{league.registration_price}
                  </span>
                  <span className="text-sm text-green-600">precio de inscripción</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Tu solicitud de inscripción quedará pendiente de aprobación por el administrador. 
              {league.registration_price > 0 && " En el futuro, aquí se procesará el pago automáticamente."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={leagueRegistration.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmRegistration}
            disabled={leagueRegistration.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {leagueRegistration.isPending ? "Inscribiendo..." : 
             league.registration_price > 0 ? `Confirmar Inscripción - €${league.registration_price}` : 
             "Confirmar Inscripción"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeagueRegistrationModal;
