import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useVerifyClassPayment } from "@/hooks/useClassPayment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const verifyPayment = useVerifyClassPayment();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId && verificationStatus === 'loading') {
      verifyPayment.mutate(
        { sessionId },
        {
          onSuccess: (data) => {
            if (data.success) {
              setVerificationStatus('success');
            } else {
              setVerificationStatus('error');
            }
          },
          onError: () => {
            setVerificationStatus('error');
          }
        }
      );
    } else if (!sessionId) {
      setVerificationStatus('error');
    }
  }, [location.search, verificationStatus]);

  const handleGoToClasses = () => {
    navigate('/dashboard/my-classes');
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verificando pago...</h2>
              <p className="text-sm text-muted-foreground text-center">
                Por favor espera mientras verificamos tu pago
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-green-800">¡Pago exitoso!</CardTitle>
            <CardDescription className="text-green-700">
              Te has inscrito correctamente en la clase
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-sm text-green-600">
                Recibirás un email de confirmación en breve.
              </p>
              <Button onClick={handleGoToClasses} className="w-full">
                Ver mis clases
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle className="text-red-800">Error en el pago</CardTitle>
          <CardDescription className="text-red-700">
            No se pudo verificar tu pago
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-red-600">
              Por favor, contacta con el soporte si el problema persiste.
            </p>
            <div className="space-y-2">
              <Button onClick={handleGoToClasses} variant="outline" className="w-full">
                Volver a clases
              </Button>
              <Button onClick={() => window.location.reload()} className="w-full">
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;