import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SubscriptionBlockedPage = () => {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const handleGoToPayment = () => {
    window.location.href = "/dashboard/payment";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Acceso Bloqueado</CardTitle>
          <CardDescription>
            La suscripción de tu club ha sido cancelada o ha vencido
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Suscripción Inactiva</AlertTitle>
            <AlertDescription>
              Tu club no tiene una suscripción activa en este momento. Para continuar usando PadeLock,
              es necesario renovar la suscripción mensual.
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Por qué veo este mensaje?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• La suscripción mensual de tu club ha vencido</li>
              <li>• El pago no pudo ser procesado correctamente</li>
              <li>• El administrador del club canceló la suscripción</li>
            </ul>
          </div>

          {isAdmin && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">¿Qué puedes hacer?</h3>
              <p className="text-sm text-green-800 mb-3">
                Como administrador del club, puedes renovar la suscripción para restaurar el acceso
                inmediatamente a todos los miembros de tu club.
              </p>
              <Button
                onClick={handleGoToPayment}
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Renovar Suscripción
              </Button>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">¿Qué puedes hacer?</h3>
              <p className="text-sm text-amber-800">
                Por favor, contacta con el administrador de tu club para que renueve la suscripción.
                Solo los administradores pueden gestionar los pagos.
              </p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>¿Necesitas ayuda? Contacta con nuestro soporte:</p>
            <a href="mailto:infopadelock@gmail.com" className="text-primary hover:underline">
              infopadelock@gmail.com
            </a>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={signOut}>
            Cerrar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionBlockedPage;
