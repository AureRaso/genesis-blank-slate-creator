
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Euro, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentIntegrationProps {
  leagueId: string;
  leagueName: string;
  price: number;
  onPaymentSuccess?: () => void;
}

const PaymentIntegration = ({ leagueId, leagueName, price, onPaymentSuccess }: PaymentIntegrationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // For now, simulate payment processing
      // TODO: Integrate with Stripe when ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Pago simulado exitoso",
        description: `Te has inscrito en ${leagueName}. En producción, esto se integrará con Stripe.`,
      });
      
      onPaymentSuccess?.();
    } catch (error) {
      toast({
        title: "Error en el pago",
        description: "No se pudo procesar el pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (price === 0) {
    return null; // No payment needed for free leagues
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-800">
          <CreditCard className="h-5 w-5 mr-2" />
          Pago de Inscripción
        </CardTitle>
        <CardDescription className="text-blue-700">
          Completa el pago para confirmar tu inscripción en {leagueName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Total a pagar:</span>
          <Badge variant="secondary" className="text-lg">
            <Euro className="h-4 w-4 mr-1" />
            {price}€
          </Badge>
        </div>
        <Button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando pago...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar {price}€ y confirmar inscripción
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🔒 Pago seguro con Stripe (próximamente)
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentIntegration;
