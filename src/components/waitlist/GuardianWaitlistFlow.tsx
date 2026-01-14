import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import {
  useGuardianCanJoinWaitlist,
  useGuardianJoinWaitlist,
  EligibleChild
} from '@/hooks/useGuardianWaitlist';

interface Props {
  classId: string;
  classDate: string;
}

/**
 * Componente específico para el flujo de waitlist de guardianes.
 * Permite a un guardian apuntar a sus hijos a la lista de espera.
 * Completamente aislado del flujo de jugadores normales.
 */
export const GuardianWaitlistFlow = ({ classId, classDate }: Props) => {
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinedChildName, setJoinedChildName] = useState<string>('');

  const { data, isLoading, error: queryError } = useGuardianCanJoinWaitlist(classId, classDate);
  const { mutate: joinWaitlist, isPending: isJoining } = useGuardianJoinWaitlist();

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Error general o de query
  if (queryError || data?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              No disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{data?.error || 'Error al cargar la información'}</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success - después de unirse
  if (joinSuccess) {
    // Redirigir después de 3 segundos
    setTimeout(() => navigate('/dashboard'), 3000);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Solicitud enviada</h2>
            <p className="text-gray-600 mb-4">
              <strong>{joinedChildName}</strong> se ha unido a la lista de espera correctamente.
            </p>
            <p className="text-sm text-gray-500">
              El profesor evaluará la solicitud y recibirás una notificación.
            </p>
            <p className="text-xs text-gray-400 mt-4">Redirigiendo al inicio...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eligibleToJoin = data?.eligibleChildren.filter(c => c.canJoin) || [];
  const notEligible = data?.eligibleChildren.filter(c => !c.canJoin) || [];

  // No hay hijos elegibles
  if (eligibleToJoin.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de espera
            </CardTitle>
            {data?.classData && (
              <p className="text-sm text-gray-500">
                {data.classData.name} - {formatDate(classDate)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ninguno de tus hijos puede unirse a esta lista de espera en este momento.
              </AlertDescription>
            </Alert>

            {notEligible.length > 0 && (
              <div className="space-y-2">
                {notEligible.map(child => (
                  <div
                    key={child.profileId}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                  >
                    <span className="font-medium">{child.fullName}</span>
                    <span className="text-sm text-gray-500">{child.message}</span>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handler para unirse
  const handleJoin = (child: EligibleChild) => {
    setSelectedChildId(child.enrollmentId);
    joinWaitlist(
      {
        classId,
        classDate,
        enrollmentId: child.enrollmentId,
        childName: child.fullName
      },
      {
        onSuccess: () => {
          setJoinedChildName(child.fullName);
          setJoinSuccess(true);
        }
      }
    );
  };

  // Mostrar selector de hijos
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de espera
          </CardTitle>
          {data?.classData && (
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium">{data.classData.name}</p>
              <p>{formatDate(classDate)} - {data.classData.start_time.substring(0, 5)}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            {eligibleToJoin.length === 1
              ? 'Apunta a tu hijo a la lista de espera:'
              : 'Selecciona a quién quieres apuntar:'
            }
          </p>

          {/* Hijos que pueden unirse */}
          <div className="space-y-2">
            {eligibleToJoin.map(child => (
              <Button
                key={child.enrollmentId}
                variant="default"
                className="w-full justify-start gap-2 h-auto py-3"
                disabled={isJoining}
                onClick={() => handleJoin(child)}
              >
                {isJoining && selectedChildId === child.enrollmentId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                <span>Apuntar a <strong>{child.fullName}</strong></span>
              </Button>
            ))}
          </div>

          {/* Hijos que no pueden unirse */}
          {notEligible.length > 0 && (
            <>
              <hr className="my-4" />
              <p className="text-sm text-gray-500">No pueden unirse:</p>
              <div className="space-y-2">
                {notEligible.map(child => (
                  <div
                    key={child.profileId}
                    className="flex items-center justify-between p-2 bg-gray-100 rounded text-sm"
                  >
                    <span className="text-gray-700">{child.fullName}</span>
                    <span className="text-gray-500 text-xs">{child.message}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
