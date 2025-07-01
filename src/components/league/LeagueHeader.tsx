
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MessageCircle } from "lucide-react";

interface LeagueHeaderProps {
  league: {
    name: string;
    start_date: string;
    end_date: string;
  };
  onBack: () => void;
}

const LeagueHeader = ({ league, onBack }: LeagueHeaderProps) => {
  const handleContactAdmin = () => {
    // Número temporal del club - en el futuro será un parámetro configurable
    const clubPhoneNumber = "+34666123456";
    const message = `Hola, necesito información sobre la liga ${league.name}`;
    const whatsappUrl = `https://wa.me/${clubPhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
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
  );
};

export default LeagueHeader;
