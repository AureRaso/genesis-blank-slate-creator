
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
  team1_set1: z.number().min(0).max(7),
  team1_set2: z.number().min(0).max(7),
  team1_set3: z.number().min(0).max(7).optional(),
  team2_set1: z.number().min(0).max(7),
  team2_set2: z.number().min(0).max(7),
  team2_set3: z.number().min(0).max(7).optional(),
}).refine((data) => {
  // Validate that there's a valid winner
  const team1Sets = [
    data.team1_set1 > data.team2_set1 ? 1 : 0,
    data.team1_set2 > data.team2_set2 ? 1 : 0,
    data.team1_set3 !== undefined && data.team2_set3 !== undefined ? (data.team1_set3 > data.team2_set3 ? 1 : 0) : 0
  ].reduce((a, b) => a + b, 0);
  
  const team2Sets = [
    data.team2_set1 > data.team1_set1 ? 1 : 0,
    data.team2_set2 > data.team1_set2 ? 1 : 0,
    data.team2_set3 !== undefined && data.team1_set3 !== undefined ? (data.team2_set3 > data.team1_set3 ? 1 : 0) : 0
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
      team1_set1: 0,
      team1_set2: 0,
      team1_set3: undefined,
      team2_set1: 0,
      team2_set2: 0,
      team2_set3: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Verificar que el partido existe
    if (!match?.id) {
      console.error('No match ID available');
      return;
    }

    // Validar que todos los valores sean números válidos
    const requiredScores = [values.team1_set1, values.team1_set2, values.team2_set1, values.team2_set2];
    const hasInvalidRequired = requiredScores.some(score => isNaN(Number(score)) || Number(score) < 0 || Number(score) > 7);
    
    if (hasInvalidRequired) {
      console.error('Invalid required score values');
      return;
    }

    // Validar valores opcionales si están presentes
    if (values.team1_set3 !== undefined && (isNaN(Number(values.team1_set3)) || Number(values.team1_set3) < 0 || Number(values.team1_set3) > 7)) {
      console.error('Invalid team1_set3 value');
      return;
    }

    if (values.team2_set3 !== undefined && (isNaN(Number(values.team2_set3)) || Number(values.team2_set3) < 0 || Number(values.team2_set3) > 7)) {
      console.error('Invalid team2_set3 value');
      return;
    }

    try {
      await submitResult.mutateAsync({
        matchId: match.id,
        team1_set1: values.team1_set1,
        team1_set2: values.team1_set2,
        team1_set3: values.team1_set3,
        team2_set1: values.team2_set1,
        team2_set2: values.team2_set2,
        team2_set3: values.team2_set3,
      });

      onClose();
    } catch (error) {
      console.error('Error submitting result:', error);
    }
  };

  const handleNumberInput = (onChange: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números válidos o campo vacío
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 7)) {
      onChange(value === '' ? 0 : parseInt(value));
    }
  };

  const handleOptionalNumberInput = (onChange: (value: number | undefined) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onChange(undefined);
    } else if (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 7) {
      onChange(parseInt(value));
    }
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
                name="team1_set1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        value={field.value || ''}
                        onChange={handleNumberInput(field.onChange)}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team2_set1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        value={field.value || ''}
                        onChange={handleNumberInput(field.onChange)}
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
                name="team1_set2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        value={field.value || ''}
                        onChange={handleNumberInput(field.onChange)}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team2_set2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        value={field.value || ''}
                        onChange={handleNumberInput(field.onChange)}
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
                name="team1_set3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        value={field.value || ''}
                        onChange={handleOptionalNumberInput(field.onChange)}
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
                name="team2_set3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="7" 
                        value={field.value || ''}
                        onChange={handleOptionalNumberInput(field.onChange)}
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
