
import { useState } from "react";
import { UserCheck, UserX, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeaguePlayers, useUpdatePlayerStatus } from "@/hooks/useLeaguePlayers";
import { useAuth } from "@/contexts/AuthContext";

interface LeaguePlayersTableProps {
  leagueId: string;
  leagueName?: string;
}

const LeaguePlayersTable = ({ leagueId, leagueName }: LeaguePlayersTableProps) => {
  const { isAdmin } = useAuth();
  const { data: leaguePlayers, isLoading } = useLeaguePlayers(leagueId);
  const updatePlayerStatus = useUpdatePlayerStatus();

  const handleStatusUpdate = (profileId: string, status: 'approved' | 'rejected') => {
    updatePlayerStatus.mutate({ leagueId, profileId, status });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">Cargando inscripciones...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserCheck className="h-5 w-5 mr-2" />
          Jugadores Inscritos
          {leagueName && <span className="ml-2 text-muted-foreground">- {leagueName}</span>}
        </CardTitle>
        <CardDescription>
          {leaguePlayers?.length || 0} jugadores inscritos en esta liga
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!leaguePlayers || leaguePlayers.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay inscripciones</h3>
            <p className="text-muted-foreground">
              Aún no hay jugadores inscritos en esta liga
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Inscripción</TableHead>
                {isAdmin && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaguePlayers.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    {registration.profile?.full_name}
                  </TableCell>
                  <TableCell>{registration.profile?.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Nivel {registration.profile?.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(registration.status)}
                      {getStatusBadge(registration.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(registration.created_at).toLocaleDateString()}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {registration.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(registration.profile_id, 'approved')}
                            disabled={updatePlayerStatus.isPending}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(registration.profile_id, 'rejected')}
                            disabled={updatePlayerStatus.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaguePlayersTable;
