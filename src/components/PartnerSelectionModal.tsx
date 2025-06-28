
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAvailablePlayers, useCreateTeam } from "@/hooks/usePlayerTeams";
import { Users, Trophy } from "lucide-react";

const formSchema = z.object({
  partnerId: z.string().min(1, "Selecciona un compañero"),
  teamName: z.string().min(3, "El nombre del equipo debe tener al menos 3 caracteres"),
});

interface PartnerSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  currentPlayerId: string;
  leagueName: string;
}

const PartnerSelectionModal = ({ 
  open, 
  onOpenChange, 
  leagueId, 
  currentPlayerId, 
  leagueName 
}: PartnerSelectionModalProps) => {
  const { data: availablePlayers } = useAvailablePlayers(leagueId, currentPlayerId);
  const createTeam = useCreateTeam();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partnerId: "",
      teamName: "",
    },
  });

  const selectedPartner = availablePlayers?.find(p => p.id === form.watch("partnerId"));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createTeam.mutateAsync({
        leagueId,
        player1Id: currentPlayerId,
        player2Id: values.partnerId,
        teamName: values.teamName,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Elegir Compañero
          </DialogTitle>
          <DialogDescription>
            Selecciona un compañero para formar tu equipo en {leagueName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compañero disponible</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un jugador..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePlayers?.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-xs">
                                {player.full_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {player.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPartner && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback>
                      {selectedPartner.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-green-800">{selectedPartner.full_name}</p>
                    <p className="text-sm text-green-600">{selectedPartner.email}</p>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Trophy className="h-4 w-4 mr-2" />
                    Nombre del equipo
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Los Increíbles" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createTeam.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {createTeam.isPending ? "Creando..." : "Crear Equipo"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>

        {!availablePlayers?.length && (
          <div className="text-center py-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              No hay jugadores disponibles para formar equipo en este momento.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartnerSelectionModal;
