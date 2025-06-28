
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Users, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { usePlayerTeams } from "@/hooks/usePlayerTeams";
import { usePlayerMatchCreation } from "@/hooks/usePlayerMatchCreation";

const formSchema = z.object({
  leagueId: z.string().min(1, "Selecciona una liga"),
  opponentTeamId: z.string().min(1, "Selecciona un equipo rival"),
  scheduledDate: z.string().min(1, "Selecciona una fecha"),
  scheduledTime: z.string().min(1, "Selecciona una hora"),
});

interface CreateMatchFormProps {
  leagues: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedOpponentTeamId?: string | null;
}

const CreateMatchForm = ({ leagues, onSuccess, onCancel, preselectedOpponentTeamId }: CreateMatchFormProps) => {
  const { profile } = useAuth();
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagues[0]?.id || "");
  const { data: leagueTeams } = useLeagueTeams(selectedLeagueId);
  const { data: playerTeam } = usePlayerTeams(selectedLeagueId, profile?.id);
  const { createMatch } = usePlayerMatchCreation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leagueId: leagues[0]?.id || "",
      opponentTeamId: preselectedOpponentTeamId || "",
      scheduledDate: "",
      scheduledTime: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!playerTeam) {
      console.error('No player team found');
      return;
    }

    try {
      await createMatch.mutateAsync({
        leagueId: values.leagueId,
        team1Id: playerTeam.id,
        team2Id: values.opponentTeamId,
        scheduledDate: values.scheduledDate,
        scheduledTime: values.scheduledTime,
        createdByProfileId: profile?.id || "",
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  // Filtrar equipos disponibles (excluir el equipo del jugador actual)
  const availableOpponentTeams = leagueTeams?.filter(teamData => {
    const team = teamData.teams;
    return team && team.id !== playerTeam?.id;
  }) || [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Crear Nuevo Partido
        </CardTitle>
        <CardDescription>
          Programa un partido contra otro equipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {leagues.length > 1 && (
              <FormField
                control={form.control}
                name="leagueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liga</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedLeagueId(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una liga" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leagues.map((league) => (
                          <SelectItem key={league.id} value={league.id}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="opponentTeamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo Rival</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un equipo rival" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableOpponentTeams.map((teamData) => {
                        const team = teamData.teams;
                        if (!team) return null;
                        
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center">
                              <span className="font-medium">{team.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({team.player1?.full_name} + {team.player2?.full_name})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fecha
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Hora
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMatch.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {createMatch.isPending ? "Creando..." : "Crear Partido"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateMatchForm;
