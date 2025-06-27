
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users2 } from "lucide-react";
import { useTeams, useDeleteTeam } from "@/hooks/useTeams";

const TeamsList = () => {
  const { data: teams, isLoading, error } = useTeams();
  const deleteTeamMutation = useDeleteTeam();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando parejas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">Error al cargar las parejas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users2 className="h-5 w-5" />
          Parejas Formadas
        </CardTitle>
        <CardDescription>
          {teams?.length || 0} parejas registradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!teams || teams.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay parejas formadas
          </p>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{team.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {team.player1.full_name}
                    </Badge>
                    <Badge variant="outline">
                      {team.player2.full_name}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteTeamMutation.mutate(team.id)}
                  disabled={deleteTeamMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamsList;
