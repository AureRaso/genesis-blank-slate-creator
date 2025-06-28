import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Users, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { usePlayerTeamsInLeague } from "@/hooks/usePlayerTeams";
import { usePlayerMatchCreation } from "@/hooks/usePlayerMatchCreation";
import MatchCreationStatus from "./match/MatchCreationStatus";
import { useCanCreateMatch } from "@/hooks/usePlayerMatchCreation";

const formSchema = z.object({
  leagueId: z.string().min(1, "Selecciona una liga"),
  myTeamId: z.string().min(1, "Selecciona tu equipo"),
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
  const { data: playerTeamsInLeague } = usePlayerTeamsInLeague(selectedLeagueId, profile?.id);
  const { createMatch } = usePlayerMatchCreation();
  const { data: canCreateMatch, isLoading: isCheckingPermission } = useCanCreateMatch();

  console.log('CreateMatchForm - Can create match:', canCreateMatch);
  console.log('CreateMatchForm - leagueTeams:', leagueTeams);
  console.log('CreateMatchForm - playerTeamsInLeague:', playerTeamsInLeague);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leagueId: leagues[0]?.id || "",
      myTeamId: "",
      opponentTeamId: preselectedOpponentTeamId || "",
      scheduledDate: "",
      scheduledTime: "",
    },
  });

  // Auto-select player's team when league changes or data loads
  useEffect(() => {
    if (playerTeamsInLeague && playerTeamsInLeague.length > 0) {
      const currentMyTeamId = form.getValues('myTeamId');
      // Only auto-select if no team is currently selected or if the current selection is not valid for this league
      if (!currentMyTeamId || !playerTeamsInLeague.find(team => team.id === currentMyTeamId)) {
        form.setValue('myTeamId', playerTeamsInLeague[0].id);
      }
    } else {
      form.setValue('myTeamId', '');
    }
  }, [selectedLeagueId, playerTeamsInLeague, form]);

  // Update league when selected league changes
  useEffect(() => {
    form.setValue('leagueId', selectedLeagueId);
  }, [selectedLeagueId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!canCreateMatch) {
      console.error('Cannot create match - weekly limit reached');
      return;
    }

    try {
      await createMatch.mutateAsync({
        leagueId: values.leagueId,
        team1Id: values.myTeamId,
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

  // Filter available opponent teams (exclude current player's team)
  const selectedMyTeamId = form.watch('myTeamId');
  const availableOpponentTeams = leagueTeams?.filter(teamData => {
    const team = teamData.teams;
    return team && team.id !== selectedMyTeamId;
  }) || [];

  console.log('All teams in league:', leagueTeams);
  console.log('My team ID:', selectedMyTeamId);
  console.log('Available opponent teams:', availableOpponentTeams);

  return (
    <div className="space-y-6">
      <MatchCreationStatus />
      
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
                name="myTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Equipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {playerTeamsInLeague?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opponentTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo Rival</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un equipo rival" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableOpponentTeams.map((teamData) => {
                          const team = teamData.teams;
                          if (!team) return null;
                          
                          const player1Name = team.player1?.full_name || 'Jugador 1';
                          const player2Name = team.player2?.full_name || 'Jugador 2';
                          
                          return (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({player1Name} & {player2Name})
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
                  disabled={createMatch.isPending || !canCreateMatch || isCheckingPermission}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50"
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
    </div>
  );
};

export default CreateMatchForm;
