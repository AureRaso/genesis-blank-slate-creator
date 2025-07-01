
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft } from "lucide-react";
import PaymentIntegration from "./PaymentIntegration";

interface LeagueRegistrationWithPaymentProps {
  league: {
    id: string;
    name: string;
    registration_price: number;
    start_date: string;
    end_date: string;
  };
  onBack: () => void;
  onPaymentSuccess: () => void;
}

const LeagueRegistrationWithPayment = ({ 
  league, 
  onBack, 
  onPaymentSuccess 
}: LeagueRegistrationWithPaymentProps) => {
  const [showPayment, setShowPayment] = useState(false);

  if (showPayment) {
    return (
      <PaymentIntegration
        leagueId={league.id}
        leagueName={league.name}
        price={league.registration_price}
        onPaymentSuccess={onPaymentSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Inscripción a Liga</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{league.name}</CardTitle>
          <CardDescription>
            {league.start_date} - {league.end_date}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-lg font-medium">Precio de inscripción:</span>
            <span className="text-2xl font-bold text-playtomic-green">
              €{league.registration_price}
            </span>
          </div>

          <Button 
            onClick={() => setShowPayment(true)}
            className="w-full bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange"
            size="lg"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Proceder al Pago
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeagueRegistrationWithPayment;
