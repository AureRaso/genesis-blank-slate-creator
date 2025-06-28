
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCanCreateMatch, useCreatePlayerMatch } from "@/hooks/usePlayerMatchCreation";
import { useToast } from "@/hooks/use-toast";
import { useLeagueTeams } from "@/hooks/useLeagueTeams";
import { Calendar, Clock, Trophy } from "lucide-react";

const formSchema = z.object({
  leagueId: z.string().min(1, "Selecciona una liga"),
  team1Id: z.string().min(1, "Selecciona el primer equipo"),
  team2Id: z.string().min(1, "Selecciona el segundo equipo"),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

interface CreateMatchFormProps {
  leagues: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateMatchForm = ({ leagues, onSuccess, onCancel }: CreateMatchFormProps) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const { profile } = useAuth();
  const { data: teams } = useLeagueTeams(selectedLeagueId);
  const createMatch = useCreatePlayerMatch();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leagueId: "",
      team1Id: "",
      team2Id: "",
      scheduledDate: "",
      scheduledTime: "",
    },
  });

  // Filter teams to only show those where the current player is involved
  const availableTeams = teams?.filter(teamData => {
    const team = teamData.teams;
    if (!team || !profile) return false;
    return team.player1?.email === profile.email || team.player2?.email === profile.email;
  }) || [];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear un partido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMatch.mutateAsync({
        leagueId: values.leagueId,
        team1Id: values.team1Id,
        team2Id: values.team2Id,
        scheduledDate: values.scheduledDate || undefined,
        scheduledTime: values.scheduledTime || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          Crear Nuevo Partido
        </CardTitle>
        <CardDescription>
          Propón un partido con otro equipo de tu liga
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {selectedLeagueId && (
              <>
                <FormField
                  control={form.control}
                  name="team1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu Equipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu equipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTeams.map((teamData) => {
                            const team = teamData.teams;
                            return (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name} ({team.player1?.full_name} & {team.player2?.full_name})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="team2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipo Rival</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el equipo rival" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams?.filter(teamData => teamData.teams.id !== form.watch("team1Id")).map((teamData) => {
                            const team = teamData.teams;
                            return (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name} ({team.player1?.full_name} & {team.player2?.full_name})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fecha (Opcional)
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
                      Hora (Opcional)
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateMatchForm;
