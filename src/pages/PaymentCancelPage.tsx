import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  const handleGoToClasses = () => {
    navigate('/scheduled-classes');
  };

  const handleTryAgain = () => {
    navigate('/scheduled-classes');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-amber-200 bg-amber-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-amber-600" />
          </div>
          <CardTitle className="text-amber-800">Pago cancelado</CardTitle>
          <CardDescription className="text-amber-700">
            Has cancelado el proceso de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-amber-600">
              No se realizó ningún cargo. Puedes intentar de nuevo cuando quieras.
            </p>
            <div className="space-y-2">
              <Button onClick={handleTryAgain} className="w-full">
                Intentar de nuevo
              </Button>
              <Button onClick={handleGoToClasses} variant="outline" className="w-full">
                Volver a clases
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;