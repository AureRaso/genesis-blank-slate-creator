import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CompanionInfo } from "@/hooks/usePlayerPrivateLessons";
import { useLookupUserCode, UserCodeResult } from "@/hooks/useLookupUserCode";

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
  const [code, setCode] = useState("");
  const [foundUser, setFoundUser] = useState<UserCodeResult | null>(null);

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
    // Filter to valid chars only and uppercase
    const filtered = raw
      .toUpperCase()
      .split("")
      .filter((c) => VALID_CHARS.includes(c))
      .join("")
      .slice(0, 6);
    setCode(filtered);
    // Reset found user when code changes
    if (filtered.length < 6) {
      setFoundUser(null);
    }
  };

  const handleConfirm = () => {
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

  const handleClear = () => {
    onChange(null);
    setCode("");
    setFoundUser(null);
  };

  // If companion is already confirmed, show it
  if (value) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{value.name}</p>
        </div>
        <span className="text-xs font-mono tracking-widest text-gray-400">
          {value.user_code}
        </span>
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const isSearching = isLoading && code.length === 6;
  const notFound = !isLoading && code.length === 6 && !foundUser && !isError;
  const isDuplicate = foundUser && excludeProfileIds.includes(foundUser.id);

  return (
    <div className="space-y-2">
      {/* Code input */}
      <Input
        placeholder={t("userCode.placeholder", "Codigo del jugador")}
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        className="rounded-xl font-mono text-center text-lg tracking-widest uppercase"
        maxLength={6}
      />

      {/* Searching state */}
      {isSearching && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("userCode.searching", "Buscando...")}
        </div>
      )}

      {/* Not found (code doesn't exist or player not in same club) */}
      {notFound && (
        <p className="text-sm text-red-500 text-center py-1">
          {t("userCode.notFoundInClub", "No se encontro jugador en tu club")}
        </p>
      )}

      {/* Found user - show card to confirm */}
      {foundUser && !isDuplicate && (
        <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{foundUser.full_name}</p>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-primary hover:bg-orange-600 text-white"
            onClick={handleConfirm}
          >
            {t("userCode.confirm", "Confirmar")}
          </Button>
        </div>
      )}

      {/* Duplicate warning */}
      {isDuplicate && (
        <p className="text-sm text-amber-600 text-center py-1">
          {t("userCode.alreadyAdded", "Este jugador ya esta incluido")}
        </p>
      )}
    </div>
  );
};

export default CompanionSearch;
