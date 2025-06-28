
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Trophy, ArrowLeft } from "lucide-react";
import { useSubmitMatchResult } from "@/hooks/useSubmitMatchResult";

const formSchema = z.object({
  team1Set1: z.number().min(0).max(7),
  team1Set2: z.number().min(0).max(7),
  team1Set3: z.number().min(0).max(7).optional(),
  team2Set1: z.number().min(0).max(7),
  team2Set2: z.number().min(0).max(7),
  team2Set3: z.number().min(0).max(7).optional(),
}).refine((data) => {
  // Validate that there's a valid winner
  const team1Sets = [
    data.team1Set1 > data.team2Set1 ? 1 : 0,
    data.team1Set2 > data.team2Set2 ? 1 : 0,
    data.team1Set3 !== undefined && data.team2Set3 !== undefined ? (data.team1Set3 > data.team2Set3 ? 1 : 0) : 0
  ].reduce((a, b) => a + b, 0);
  
  const team2Sets = [
    data.team2Set1 > data.team1Set1 ? 1 : 0,
    data.team2Set2 > data.team1Set2 ? 1 : 0,
    data.team2Set3 !== undefined && data.team1Set3 !== undefined ? (data.team2Set3 > data.team1Set3 ? 1 : 0) : 0
  ].reduce((a, b) => a + b, 0);
  
  return team1Sets !== team2Sets; // Must have a clear winner
}, {
  message: "Debe haber un ganador claro",
});

interface MatchResultFormProps {
  match: any;
  onClose: () => void;
}

const MatchResultForm = ({ match, onClose }: MatchResultFormProps) => {
  const submitResult = useSubmitMatchResult();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team1Set1: 0,
      team1Set2: 0,
      team1Set3: undefined,
      team2Set1: 0,
      team2Set2: 0,
      team2Set3: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Calculate winner
    const team1Sets = [
      values.team1Set1 > values.team2Set1 ? 1 : 0,
      values.team1Set2 > values.team2Set2 ? 1 : 0,
      values.team1Set3 !== undefined && values.team2Set3 !== undefined ? (values.team1Set3 > values.team2Set3 ? 1 : 0) : 0
    ].reduce((a, b) => a + b, 0);
    
    const team2Sets = [
      values.team2Set1 > values.team1Set1 ? 1 : 0,
      values.team2Set2 > values.team1Set2 ? 1 : 0,
      values.team2Set3 !== undefined && values.team1Set3 !== undefined ? (values.team2Set3 > values.team1Set3 ? 1 : 0) : 0
    ].reduce((a, b) => a + b, 0);

    const winnerTeamId = team1Sets > team2Sets ? match.team1_id : match.team2_id;

    // Calculate points (this would depend on your league scoring system)
    const pointsTeam1 = team1Sets > team2Sets ? 3 : 0;
    const pointsTeam2 = team2Sets > team1Sets ? 3 : 0;

    await submitResult.mutateAsync({
      matchId: match.id,
      team1Set1: values.team1Set1,
      team1Set2: values.team1Set2,
      team1Set3: values.team1Set3,
      team2Set1: values.team2Set1,
      team2Set2: values.team2Set2,
      team2Set3: values.team2Set3,
      winnerTeamId,
      pointsTeam1,
      pointsTeam2,
    });

    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            <CardTitle>Subir Resultado</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {match.team1?.name} vs {match.team2?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center font-medium">Set</div>
              <div className="text-center font-medium">{match.team1?.name}</div>
              <div className="text-center font-medium">{match.team2?.name}</div>
              
              {/* Set 1 */}
              <div className="flex items-center justify-center">Set 1</div>
              <FormField
                control={form.control}
                name="team1Set1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team2Set1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Set 2 */}
              <div className="flex items-center justify-center">Set 2</div>
              <FormField
                control={form.control}
                name="team1Set2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team2Set2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Set 3 (optional) */}
              <div className="flex items-center justify-center">Set 3 (Opcional)</div>
              <FormField
                control={form.control}
                name="team1Set3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="text-center"
                        placeholder="--"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team2Set3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="text-center"
                        placeholder="--"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={submitResult.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {submitResult.isPending ? "Enviando..." : "Enviar Resultado"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
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

export default MatchResultForm;
