import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CompanionInfo } from "@/hooks/usePlayerPrivateLessons";
import { useLookupUserCode, UserCodeResult } from "@/hooks/useLookupUserCode";
import { PhoneInput, COUNTRIES } from "@/components/PhoneInput";

// Valid charset matching the DB function (no 0/O/1/I/L)
const VALID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface CompanionSearchProps {
  index: number;
  clubId: string;
  value: CompanionInfo | null;
  onChange: (companion: CompanionInfo | null) => void;
  excludeProfileIds?: string[];
}

const CompanionSearch = ({
  index,
  clubId,
  value,
  onChange,
  excludeProfileIds = [],
}: CompanionSearchProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"code" | "guest">("code");

  // --- Code mode state ---
  const [code, setCode] = useState("");
  const [foundUser, setFoundUser] = useState<UserCodeResult | null>(null);

  // --- Guest mode state ---
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const { data: lookupResult, isLoading, isError } = useLookupUserCode(code, clubId);

  // When lookup returns a result, store it
  useEffect(() => {
    if (lookupResult && code.length === 6) {
      setFoundUser(lookupResult);
    } else if (!isLoading && code.length === 6 && !lookupResult) {
      setFoundUser(null);
    }
  }, [lookupResult, isLoading, code]);

  const handleCodeChange = (raw: string) => {
    const filtered = raw
      .toUpperCase()
      .split("")
      .filter((c) => VALID_CHARS.includes(c))
      .join("")
      .slice(0, 6);
    setCode(filtered);
    if (filtered.length < 6) {
      setFoundUser(null);
    }
  };

  const handleConfirmRegistered = () => {
    if (!foundUser) return;
    onChange({
      name: foundUser.full_name,
      email: foundUser.email,
      type: "registered",
      user_code: foundUser.user_code,
      profile_id: foundUser.id,
    });
    setCode("");
    setFoundUser(null);
  };

  const handleConfirmGuest = () => {
    if (!guestName.trim() || !guestPhone.trim()) return;
    onChange({
      name: guestName.trim(),
      phone: guestPhone.trim(),
      type: "guest",
    });
    setGuestName("");
    setGuestPhone("");
  };

  const handleClear = () => {
    onChange(null);
    setCode("");
    setFoundUser(null);
    setGuestName("");
    setGuestPhone("");
  };

  const switchToGuest = () => {
    setMode("guest");
    setCode("");
    setFoundUser(null);
  };

  const switchToCode = () => {
    setMode("code");
    setGuestName("");
    setGuestPhone("");
  };

  // If companion is already confirmed, show it
  if (value) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{value.name}</p>
        </div>
        {value.type === "registered" && value.user_code && (
          <span className="text-xs font-mono tracking-widest text-gray-400">
            {value.user_code}
          </span>
        )}
        {value.type === "guest" && (
          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        )}
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ---- CODE MODE ----
  if (mode === "code") {
    const isSearching = isLoading && code.length === 6;
    const notFound = !isLoading && code.length === 6 && !foundUser && !isError;
    const isDuplicate = foundUser && excludeProfileIds.includes(foundUser.id);

    return (
      <div className="space-y-2">
        <Input
          placeholder={t("userCode.placeholder", "Codigo del jugador")}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="rounded-xl font-mono text-center text-lg tracking-widest uppercase"
          maxLength={6}
        />

        {isSearching && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("userCode.searching", "Buscando...")}
          </div>
        )}

        {notFound && (
          <p className="text-sm text-red-500 text-center py-1">
            {t("userCode.notFoundInClub", "No se encontro jugador en tu club")}
          </p>
        )}

        {foundUser && !isDuplicate && (
          <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{foundUser.full_name}</p>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-primary hover:bg-orange-600 text-white"
              onClick={handleConfirmRegistered}
            >
              {t("userCode.confirm", "Confirmar")}
            </Button>
          </div>
        )}

        {isDuplicate && (
          <p className="text-sm text-amber-600 text-center py-1">
            {t("userCode.alreadyAdded", "Este jugador ya esta incluido")}
          </p>
        )}

        <button
          type="button"
          onClick={switchToGuest}
          className="w-full text-xs text-primary hover:text-orange-600 underline underline-offset-2 py-1"
        >
          {t("privateLessonsBooking.addGuest", "¿No tiene cuenta? Añadir como invitado")}
        </button>
      </div>
    );
  }

  // ---- GUEST MODE ----
  // Phone is valid when it has digits (PhoneInput already handles formatting/country validation)
  const phoneDigits = guestPhone.replace(/\D/g, "");
  const guestValid = guestName.trim().length > 0 && phoneDigits.length >= 7;

  return (
    <div className="space-y-2">
      <Input
        placeholder={t("privateLessonsBooking.companionNamePlaceholder", "Nombre del acompañante")}
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        className="rounded-xl"
      />
      <PhoneInput
        value={guestPhone}
        onChange={setGuestPhone}
        label={t("privateLessonsBooking.guestPhonePlaceholder", "Teléfono del invitado")}
        required={false}
      />

      <Button
        size="sm"
        className="w-full rounded-xl bg-primary hover:bg-orange-600 text-white"
        disabled={!guestValid}
        onClick={handleConfirmGuest}
      >
        {t("privateLessonsBooking.add", "Añadir")}
      </Button>

      <button
        type="button"
        onClick={switchToCode}
        className="w-full text-xs text-primary hover:text-orange-600 underline underline-offset-2 py-1"
      >
        {t("privateLessonsBooking.searchByCode", "¿Tiene código? Buscar por código")}
      </button>
    </div>
  );
};

export default CompanionSearch;
