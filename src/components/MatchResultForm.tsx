
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Trophy, ArrowLeft, Zap } from "lucide-react";
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

    const requiredScores = [values.team1_set1, values.team1_set2, values.team2_set1, values.team2_set2];
    const hasInvalidRequired = requiredScores.some(score => isNaN(Number(score)) || Number(score) < 0 || Number(score) > 7);
    
    if (hasInvalidRequired) {
      console.error('Invalid required score values');
      return;
    }

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

  // Fixed single character numeric input handler
  const handleSingleDigitInput = (onChange: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input value:', value); // Debug log
    
    // Allow empty input or single digit 0-7
    if (value === '') {
      onChange(0);
    } else if (/^[0-7]$/.test(value)) {
      const numValue = parseInt(value, 10);
      console.log('Setting value:', numValue); // Debug log
      onChange(numValue);
    }
    // If more than one character or invalid, prevent the change by not calling onChange
  };

  const handleOptionalSingleDigitInput = (onChange: (value: number | undefined) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Optional input value:', value); // Debug log
    
    if (value === '') {
      onChange(undefined);
    } else if (/^[0-7]$/.test(value)) {
      const numValue = parseInt(value, 10);
      console.log('Setting optional value:', numValue); // Debug log
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numeric keys 0-7, backspace, delete, tab, enter, and arrow keys
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold">Subir Resultado</CardTitle>
                <CardDescription className="text-green-100 mt-1">
                  Ingresa el resultado del partido
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 md:p-8">
          {/* Match Header */}
          <div className="mb-8 text-center">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                {match.team1?.name} vs {match.team2?.name}
              </h3>
              <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{match.team1?.player1?.full_name}</span>
                  <span>&</span>
                  <span className="font-medium">{match.team1?.player2?.full_name}</span>
                </div>
                <div className="hidden md:block w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{match.team2?.player1?.full_name}</span>
                  <span>&</span>
                  <span className="font-medium">{match.team2?.player2?.full_name}</span>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Score Grid */}
              <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 grid grid-cols-3 py-3 px-4">
                  <div className="text-center font-semibold text-gray-700">Set</div>
                  <div className="text-center font-semibold text-green-600 truncate">{match.team1?.name}</div>
                  <div className="text-center font-semibold text-blue-600 truncate">{match.team2?.name}</div>
                </div>
                
                {/* Set 1 */}
                <div className="grid grid-cols-3 items-center py-4 px-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-center">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Set 1
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="team1_set1"
                    render={({ field }) => (
                      <FormItem className="px-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            maxLength={1}
                            value={field.value !== undefined ? field.value.toString() : '0'}
                            onChange={handleSingleDigitInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-green-200 focus:border-green-400 rounded-lg"
                            placeholder="0"
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
                      <FormItem className="px-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            maxLength={1}
                            value={field.value !== undefined ? field.value.toString() : '0'}
                            onChange={handleSingleDigitInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-blue-200 focus:border-blue-400 rounded-lg"
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Set 2 */}
                <div className="grid grid-cols-3 items-center py-4 px-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-center">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Set 2
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="team1_set2"
                    render={({ field }) => (
                      <FormItem className="px-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            maxLength={1}
                            value={field.value !== undefined ? field.value.toString() : '0'}
                            onChange={handleSingleDigitInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-green-200 focus:border-green-400 rounded-lg"
                            placeholder="0"
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
                      <FormItem className="px-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            maxLength={1}
                            value={field.value !== undefined ? field.value.toString() : '0'}
                            onChange={handleSingleDigitInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-blue-200 focus:border-blue-400 rounded-lg"
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Set 3 (Optional) */}
                <div className="grid grid-cols-3 items-center py-4 px-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-center">
                    <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Set 3
                    </div>
                    <span className="text-xs text-gray-500 ml-2 hidden md:inline">(Opcional)</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="team1_set3"
                    render={({ field }) => (
                      <FormItem className="px-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            maxLength={1}
                            value={field.value !== undefined ? field.value.toString() : ''}
                            onChange={handleOptionalSingleDigitInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-orange-200 focus:border-orange-400 rounded-lg"
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
                      <FormItem className="px-2">
                        <FormControl>
                          <Input 
                            type="text" 
                            maxLength={1}
                            value={field.value !== undefined ? field.value.toString() : ''}
                            onChange={handleOptionalSingleDigitInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-orange-200 focus:border-orange-400 rounded-lg"
                            placeholder="--"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Instrucciones:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Ingresa solo números del 0 al 7 en cada casilla</li>
                      <li>• Los sets 1 y 2 son obligatorios</li>
                      <li>• El set 3 es opcional para desempates</li>
                      <li>• Debe haber un ganador claro</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-6">
                <Button 
                  type="submit" 
                  disabled={submitResult.isPending}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {submitResult.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Enviar Resultado
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchResultForm;
