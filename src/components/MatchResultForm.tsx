
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Trophy, ArrowLeft, Zap, AlertCircle } from "lucide-react";
import { useSubmitMatchResult } from "@/hooks/useSubmitMatchResult";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  team1_set1: z.number().min(0).max(7),
  team1_set2: z.number().min(0).max(7),
  team1_set3: z.number().min(0).max(7).optional(),
  team2_set1: z.number().min(0).max(7),
  team2_set2: z.number().min(0).max(7),
  team2_set3: z.number().min(0).max(7).optional(),
}).refine((data) => {
  // Validar que los sets 1 y 2 estén completos
  const set1Valid = data.team1_set1 !== undefined && data.team2_set1 !== undefined;
  const set2Valid = data.team1_set2 !== undefined && data.team2_set2 !== undefined;
  
  if (!set1Valid || !set2Valid) {
    return false;
  }

  // Si hay datos del set 3, validar que sea necesario (1-1 en sets)
  if (data.team1_set3 !== undefined || data.team2_set3 !== undefined) {
    const team1Sets = [
      data.team1_set1 > data.team2_set1 ? 1 : 0,
      data.team1_set2 > data.team2_set2 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    
    const team2Sets = [
      data.team2_set1 > data.team1_set1 ? 1 : 0,
      data.team2_set2 > data.team1_set2 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    
    // Solo permitir set 3 si están 1-1
    if (team1Sets !== 1 || team2Sets !== 1) {
      return false;
    }
    
    // Si hay set 3, ambos equipos deben tener puntuación
    if ((data.team1_set3 !== undefined) !== (data.team2_set3 !== undefined)) {
      return false;
    }
  }

  // Validar que haya un ganador claro
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
  message: "El resultado no cumple las reglas del pádel",
});

interface MatchResultFormProps {
  match: any;
  onClose: () => void;
}

const MatchResultForm = ({ match, onClose }: MatchResultFormProps) => {
  const submitResult = useSubmitMatchResult();
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team1_set1: undefined,
      team1_set2: undefined,
      team1_set3: undefined,
      team2_set1: undefined,
      team2_set2: undefined,
      team2_set3: undefined,
    },
  });

  const watchedValues = form.watch();

  // Calcular si el set 3 está habilitado
  const isSet3Enabled = () => {
    const { team1_set1, team1_set2, team2_set1, team2_set2 } = watchedValues;
    
    // Verificar que los sets 1 y 2 estén completos
    if (team1_set1 === undefined || team1_set2 === undefined || 
        team2_set1 === undefined || team2_set2 === undefined) {
      return false;
    }

    // Calcular ganadores de cada set
    const team1Sets = [
      team1_set1 > team2_set1 ? 1 : 0,
      team1_set2 > team2_set2 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    
    const team2Sets = [
      team2_set1 > team1_set1 ? 1 : 0,
      team2_set2 > team1_set2 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
    
    // Solo habilitar si están 1-1
    return team1Sets === 1 && team2Sets === 1;
  };

  // Validar lógica en tiempo real
  useEffect(() => {
    const errors: string[] = [];
    const { team1_set1, team1_set2, team1_set3, team2_set1, team2_set2, team2_set3 } = watchedValues;

    // Limpiar set 3 si no está habilitado
    if (!isSet3Enabled() && (team1_set3 !== undefined || team2_set3 !== undefined)) {
      form.setValue('team1_set3', undefined);
      form.setValue('team2_set3', undefined);
    }

    // Validación 1: Sets 1 y 2 deben estar completos
    if (team1_set1 === undefined || team2_set1 === undefined) {
      errors.push("El primer set debe estar completo");
    }
    if (team1_set2 === undefined || team2_set2 === undefined) {
      errors.push("El segundo set debe estar completo");
    }

    // Validación 2: Set 3 solo si es necesario
    if ((team1_set3 !== undefined || team2_set3 !== undefined) && !isSet3Enabled()) {
      errors.push("El tercer set solo se puede jugar si los equipos están 1-1 en sets");
    }

    // Validación 3: Si hay set 3, debe estar completo
    if (isSet3Enabled() && ((team1_set3 !== undefined) !== (team2_set3 !== undefined))) {
      errors.push("Si se juega el tercer set, ambos equipos deben tener puntuación");
    }

    setValidationErrors(errors);
  }, [watchedValues, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Verificaciones adicionales antes del envío
    if (validationErrors.length > 0) {
      toast({
        title: "Resultado inválido",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    if (!match?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el partido",
        variant: "destructive",
      });
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

      toast({
        title: "Resultado enviado",
        description: "El resultado ha sido enviado correctamente",
      });

      onClose();
    } catch (error) {
      console.error('Error submitting result:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el resultado",
        variant: "destructive",
      });
    }
  };

  // Función mejorada para manejar inputs numéricos principales (Set 1 y 2)
  const handleNumberInput = (onChange: (value: number | undefined) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Input value received:', value); // Para debug
    
    // Si está vacío, mantener undefined
    if (value === '') {
      console.log('Empty value, setting to undefined');
      onChange(undefined);
      return;
    }
    
    // Solo permitir un solo dígito del 0-7
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 7 && value.length === 1) {
      console.log('Valid number, setting:', numValue);
      onChange(numValue);
    } else {
      // Si el valor no es válido, mantener vacío
      console.log('Invalid value, clearing field');
      onChange(undefined);
    }
  };

  // Función para inputs opcionales (Set 3)
  const handleOptionalNumberInput = (onChange: (value: number | undefined) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Optional input value received:', value);
    
    if (value === '') {
      onChange(undefined);
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 7 && value.length === 1) {
      console.log('Valid optional number, setting:', numValue);
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de navegación y números 0-7
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', 'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const set3Enabled = isSet3Enabled();

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

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Errores de validación:</p>
                  <ul className="space-y-1 text-xs">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

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
                            value={field.value?.toString() || ''}
                            onChange={handleNumberInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-green-200 focus:border-green-400 rounded-lg"
                            placeholder="--"
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
                            value={field.value?.toString() || ''}
                            onChange={handleNumberInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-blue-200 focus:border-blue-400 rounded-lg"
                            placeholder="--"
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
                            value={field.value?.toString() || ''}
                            onChange={handleNumberInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-green-200 focus:border-green-400 rounded-lg"
                            placeholder="--"
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
                            value={field.value?.toString() || ''}
                            onChange={handleNumberInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            className="text-center text-xl font-bold h-12 border-2 border-blue-200 focus:border-blue-400 rounded-lg"
                            placeholder="--"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Set 3 (Conditional) */}
                <div className={`grid grid-cols-3 items-center py-4 px-4 hover:bg-gray-50/50 transition-colors ${!set3Enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-center">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      set3Enabled 
                        ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      Set 3
                    </div>
                    <span className="text-xs text-gray-500 ml-2 hidden md:inline">
                      {set3Enabled ? '(Desempate)' : '(Deshabilitado)'}
                    </span>
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
                            value={field.value?.toString() || ''}
                            onChange={handleOptionalNumberInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            disabled={!set3Enabled}
                            className={`text-center text-xl font-bold h-12 border-2 rounded-lg ${
                              set3Enabled 
                                ? 'border-orange-200 focus:border-orange-400' 
                                : 'border-gray-200 bg-gray-100'
                            }`}
                            placeholder={set3Enabled ? "--" : "--"}
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
                            value={field.value?.toString() || ''}
                            onChange={handleOptionalNumberInput(field.onChange)}
                            onKeyDown={handleKeyDown}
                            disabled={!set3Enabled}
                            className={`text-center text-xl font-bold h-12 border-2 rounded-lg ${
                              set3Enabled 
                                ? 'border-orange-200 focus:border-orange-400' 
                                : 'border-gray-200 bg-gray-100'
                            }`}
                            placeholder={set3Enabled ? "--" : "--"}
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
                    <p className="font-medium mb-1">Reglas del pádel:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Los sets 1 y 2 son obligatorios</li>
                      <li>• El set 3 solo se juega si los equipos están 1-1 en sets</li>
                      <li>• Ingresa solo números del 0 al 7 en cada casilla</li>
                      <li>• El partido debe tener un ganador claro</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-6">
                <Button 
                  type="submit" 
                  disabled={submitResult.isPending || validationErrors.length > 0}
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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
