import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";

// Lista de países con sus prefijos (la misma que en PhoneRequiredModal)
const COUNTRIES = [
  { code: "ES", name: "España", flag: "🇪🇸", prefix: "+34", minDigits: 9, maxDigits: 9, startsWithPattern: /^[67]/ },
  { code: "FR", name: "Francia", flag: "🇫🇷", prefix: "+33", minDigits: 9, maxDigits: 9 },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", prefix: "+44", minDigits: 10, maxDigits: 10 },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351", minDigits: 9, maxDigits: 9 },
  { code: "DE", name: "Alemania", flag: "🇩🇪", prefix: "+49", minDigits: 10, maxDigits: 11 },
  { code: "IT", name: "Italia", flag: "🇮🇹", prefix: "+39", minDigits: 9, maxDigits: 10 },
  { code: "NL", name: "Países Bajos", flag: "🇳🇱", prefix: "+31", minDigits: 9, maxDigits: 9 },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", prefix: "+32", minDigits: 9, maxDigits: 9 },
  { code: "CH", name: "Suiza", flag: "🇨🇭", prefix: "+41", minDigits: 9, maxDigits: 9 },
  { code: "AT", name: "Austria", flag: "🇦🇹", prefix: "+43", minDigits: 10, maxDigits: 13 },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", prefix: "+353", minDigits: 9, maxDigits: 9 },
  { code: "PL", name: "Polonia", flag: "🇵🇱", prefix: "+48", minDigits: 9, maxDigits: 9 },
  { code: "RO", name: "Rumanía", flag: "🇷🇴", prefix: "+40", minDigits: 10, maxDigits: 10 },
  { code: "SE", name: "Suecia", flag: "🇸🇪", prefix: "+46", minDigits: 9, maxDigits: 10 },
  { code: "NO", name: "Noruega", flag: "🇳🇴", prefix: "+47", minDigits: 8, maxDigits: 8 },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", prefix: "+45", minDigits: 8, maxDigits: 8 },
  { code: "FI", name: "Finlandia", flag: "🇫🇮", prefix: "+358", minDigits: 9, maxDigits: 10 },
  { code: "GR", name: "Grecia", flag: "🇬🇷", prefix: "+30", minDigits: 10, maxDigits: 10 },
  { code: "CZ", name: "República Checa", flag: "🇨🇿", prefix: "+420", minDigits: 9, maxDigits: 9 },
  { code: "HU", name: "Hungría", flag: "🇭🇺", prefix: "+36", minDigits: 9, maxDigits: 9 },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", prefix: "+1", minDigits: 10, maxDigits: 10 },
  { code: "CA", name: "Canadá", flag: "🇨🇦", prefix: "+1", minDigits: 10, maxDigits: 10 },
  { code: "MX", name: "México", flag: "🇲🇽", prefix: "+52", minDigits: 10, maxDigits: 10 },
  { code: "AR", name: "Argentina", flag: "🇦🇷", prefix: "+54", minDigits: 10, maxDigits: 11 },
  { code: "BR", name: "Brasil", flag: "🇧🇷", prefix: "+55", minDigits: 10, maxDigits: 11 },
  { code: "CL", name: "Chile", flag: "🇨🇱", prefix: "+56", minDigits: 9, maxDigits: 9 },
  { code: "CO", name: "Colombia", flag: "🇨🇴", prefix: "+57", minDigits: 10, maxDigits: 10 },
  { code: "PE", name: "Perú", flag: "🇵🇪", prefix: "+51", minDigits: 9, maxDigits: 9 },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", prefix: "+58", minDigits: 10, maxDigits: 10 },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", prefix: "+598", minDigits: 8, maxDigits: 9 },
  { code: "CN", name: "China", flag: "🇨🇳", prefix: "+86", minDigits: 11, maxDigits: 11 },
  { code: "JP", name: "Japón", flag: "🇯🇵", prefix: "+81", minDigits: 10, maxDigits: 10 },
  { code: "IN", name: "India", flag: "🇮🇳", prefix: "+91", minDigits: 10, maxDigits: 10 },
  { code: "AU", name: "Australia", flag: "🇦🇺", prefix: "+61", minDigits: 9, maxDigits: 9 },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", prefix: "+64", minDigits: 9, maxDigits: 10 },
  { code: "ZA", name: "Sudáfrica", flag: "🇿🇦", prefix: "+27", minDigits: 9, maxDigits: 9 },
  { code: "MA", name: "Marruecos", flag: "🇲🇦", prefix: "+212", minDigits: 9, maxDigits: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (formattedPhone: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export const PhoneInput = ({ value, onChange, label = "Teléfono", required = true, className = "" }: PhoneInputProps) => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("ES"); // España por defecto

  // Get selected country
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Handle phone input change - only allow digits and respect country's max digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Remove all non-digit characters
    const digitsOnly = inputValue.replace(/\D/g, '');
    // Limit to country's max digits
    const limitedDigits = digitsOnly.slice(0, selectedCountry.maxDigits);
    setPhone(limitedDigits);

    // Format and pass to parent
    const formattedPhone = formatPhoneForStorage(limitedDigits, selectedCountry);
    onChange(formattedPhone);
  };

  // Reset phone when country changes
  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setPhone(""); // Clear phone when changing country
    onChange(""); // Clear parent value too
  };

  const formatPhoneForStorage = (phoneNumber: string, country: typeof COUNTRIES[0]): string => {
    const digits = phoneNumber.replace(/\D/g, '');

    // Para España: guardar SIN prefijo
    if (country.code === "ES") {
      return digits;
    }

    // Para cualquier otro país: guardar CON prefijo
    return digits ? country.prefix + digits : "";
  };

  const validatePhone = (phoneNumber: string, country: typeof COUNTRIES[0]): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');

    // Check length
    if (digits.length < country.minDigits || digits.length > country.maxDigits) {
      return false;
    }

    // For Spain, check if it starts with 6 or 7
    if (country.code === "ES" && country.startsWithPattern) {
      return country.startsWithPattern.test(digits);
    }

    return true;
  };

  const isPhoneValid = phone.length > 0 && validatePhone(phone, selectedCountry);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Phone className="h-4 w-4" />
        {label} {required && "*"}
      </Label>
      <div className="flex gap-0 relative">
        {/* Selector de país integrado en el lado izquierdo */}
        <Select value={countryCode} onValueChange={handleCountryChange}>
          <SelectTrigger className="h-12 w-[110px] rounded-r-none border-r-0 border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2 bg-slate-50">
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span className="text-base font-medium">{selectedCountry.prefix}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.flag} {country.name} ({country.prefix})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Input del teléfono */}
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={selectedCountry.code === "ES" ? "612345678" : "123456789"}
          value={phone}
          onChange={handlePhoneChange}
          maxLength={selectedCountry.maxDigits}
          className="text-base flex-1 h-12 rounded-l-none border-slate-200 focus:border-playtomic-orange focus:ring-playtomic-orange/20 focus:ring-2"
          required={required}
        />
      </div>
      <p className="text-xs text-slate-500">
        {selectedCountry.code === "ES"
          ? "Introduce tu número sin el prefijo +34"
          : `Introduce tu número sin el prefijo ${selectedCountry.prefix} (${selectedCountry.minDigits}${selectedCountry.minDigits !== selectedCountry.maxDigits ? `-${selectedCountry.maxDigits}` : ''} dígitos)`
        }
      </p>
      {phone.length > 0 && !isPhoneValid && (
        <p className="text-xs text-red-600">
          {selectedCountry.code === "ES"
            ? "Número inválido: debe tener 9 dígitos y empezar por 6 o 7"
            : `Número inválido: debe tener entre ${selectedCountry.minDigits} y ${selectedCountry.maxDigits} dígitos`
          }
        </p>
      )}
    </div>
  );
};
