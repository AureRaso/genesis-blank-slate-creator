
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MessageCircle, Building2, MapPin } from "lucide-react";

interface LeagueHeaderProps {
  league: {
    name: string;
    start_date: string;
    end_date: string;
    clubs?: {
      id: string;
      name: string;
      address: string;
      phone: string;
    };
  };
  onBack: () => void;
}

const LeagueHeader = ({ league, onBack }: LeagueHeaderProps) => {
  const handleContactAdmin = () => {
    // Usar el teléfono del club si está disponible, sino el número temporal
    const clubPhoneNumber = league.clubs?.phone || "+34666123456";
    const message = `Hola, necesito información sobre la liga ${league.name}`;
    const whatsappUrl = `https://wa.me/${clubPhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {league.start_date} - {league.end_date}
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={handleContactAdmin}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contactar Admin
        </Button>
      </div>

      {league.clubs && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">{league.clubs.name}</h3>
              <p className="text-sm text-green-700 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {league.clubs.address}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueHeader;
