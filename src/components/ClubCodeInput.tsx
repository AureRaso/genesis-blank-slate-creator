import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ClubCodeInputProps {
  value: string;
  onValueChange: (code: string, clubId: string | null, clubName: string | null) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

interface ClubData {
  id: string;
  name: string;
  club_code: string;
}

const ClubCodeInput = ({
  value,
  onValueChange,
  error,
  required = false,
  label = "Código de Club",
  placeholder = "Ej: ABC"
}: ClubCodeInputProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [clubFound, setClubFound] = useState<ClubData | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validateClubCode = async (code: string) => {
    // Reset estados
    setValidationError("");
    setClubFound(null);

    // Si el código está vacío, no validar
    if (code.length === 0) {
      onValueChange("", null, null);
      return;
    }

    // Si el código no tiene 3 caracteres, esperar
    if (code.length < 3) {
      setValidationError("");
      onValueChange(code, null, null);
      return;
    }

    // Validar que sean solo letras
    if (!/^[A-Z]{3}$/.test(code)) {
      setValidationError("El código debe tener exactamente 3 letras mayúsculas");
      onValueChange(code, null, null);
      return;
    }

    setIsValidating(true);

    try {
      // Buscar club por código
      const { data, error: queryError } = await supabase
        .from('clubs')
        .select('id, name, club_code')
        .eq('club_code', code)
        .eq('status', 'active')
        .maybeSingle();

      if (queryError) {
        console.error('Error validating club code:', queryError);
        setValidationError("Error al validar el código. Intenta nuevamente.");
        onValueChange(code, null, null);
        return;
      }

      if (data) {
        setClubFound(data);
        onValueChange(code, data.id, data.name);
      } else {
        setValidationError("Código de club no válido. Verifica con tu entrenador.");
        onValueChange(code, null, null);
      }
    } catch (err) {
      console.error('Exception validating club code:', err);
      setValidationError("Error al validar el código. Intenta nuevamente.");
      onValueChange(code, null, null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase(); // Convertir a mayúsculas automáticamente

    // Limitar a 3 caracteres
    newValue = newValue.slice(0, 3);

    // Solo permitir letras A-Z
    newValue = newValue.replace(/[^A-Z]/g, '');

    setInputValue(newValue);

    // Validar solo cuando tenga 3 caracteres
    if (newValue.length === 3) {
      validateClubCode(newValue);
    } else {
      setValidationError("");
      setClubFound(null);
      onValueChange(newValue, null, null);
    }
  };

  const displayError = error || validationError;

  return (
    <div className="space-y-2">
      <Label htmlFor="club-code-input" className="text-gray-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <Input
          id="club-code-input"
          type="text"
          maxLength={3}
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`h-12 border-2 rounded-xl transition-all duration-300 bg-white text-center text-lg font-mono tracking-widest uppercase ${
            displayError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : clubFound
              ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
              : 'border-gray-200 focus:border-blue-500'
          }`}
          autoComplete="off"
          spellCheck={false}
        />

        {/* Icon de estado */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidating && (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          )}
          {!isValidating && clubFound && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          {!isValidating && displayError && inputValue.length === 3 && (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
      </div>

      {/* Mensaje de feedback */}
      {clubFound && !displayError && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">{clubFound.name}</p>
            <p className="text-xs text-green-700">Club encontrado correctamente</p>
          </div>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-medium text-red-900">{displayError}</p>
        </div>
      )}

      {!clubFound && !displayError && inputValue.length === 0 && (
        <p className="text-xs text-gray-500">
          Ingresa el código de 3 letras que te proporcionó tu entrenador
        </p>
      )}
    </div>
  );
};

export default ClubCodeInput;
