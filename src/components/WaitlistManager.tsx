import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassWaitlistWithDetails, useNotifyWaitlist, useClassCapacity } from "@/hooks/useWaitlist";
import { Users, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface WaitlistManagerProps {
  classId: string;
  className?: string;
}

export const WaitlistManager = ({ classId, className }: WaitlistManagerProps) => {
  const { data: waitlist = [], isLoading: waitlistLoading } = useClassWaitlistWithDetails(classId);
  const { data: capacity, isLoading: capacityLoading } = useClassCapacity(classId);
  const notifyWaitlist = useNotifyWaitlist();

  const isLoading = waitlistLoading || capacityLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">Esperando</Badge>;
      case 'notified':
        return <Badge variant="default">Notificado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeLeft = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    
    if (expiry < now) {
      return <span className="text-destructive">Expirado</span>;
    }
    
    return (
      <span className="text-muted-foreground">
        Expira {formatDistanceToNow(expiry, { locale: es, addSuffix: true })}
      </span>
    );
  };

  const handleNotifyNext = () => {
    if (capacity && capacity.availableSpots > 0) {
      notifyWaitlist.mutate({ classId, availableSpots: capacity.availableSpots });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lista de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Cargando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Lista de Espera
        </CardTitle>
        {capacity && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {capacity.currentParticipants}/{capacity.maxParticipants} plazas ocupadas
            </div>
            {capacity.availableSpots > 0 && (
              <Button
                size="sm"
                onClick={handleNotifyNext}
                disabled={waitlist.length === 0 || notifyWaitlist.isPending}
                className="ml-auto"
              >
                {notifyWaitlist.isPending ? "Notificando..." : "Notificar Siguiente"}
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {waitlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay usuarios en lista de espera</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitlist.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-medium">
                    {entry.position}
                  </div>
                  <div>
                    <p className="font-medium">
                      {entry.profiles?.full_name || 'Usuario'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Se unió {formatDistanceToNow(new Date(entry.joined_at), { 
                        locale: es, 
                        addSuffix: true 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(entry.status)}
                  {entry.status === 'notified' && entry.expires_at && (
                    <div className="text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getTimeLeft(entry.expires_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {capacity && capacity.isFull && waitlist.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Clase completa - {waitlist.length} persona(s) en lista de espera
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};