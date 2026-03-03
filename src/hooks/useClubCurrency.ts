import { useClubs } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the currency code for the current user's club.
 * Defaults to 'EUR' if not configured.
 */
export const useClubCurrency = (): string => {
  const { effectiveClubId } = useAuth();
  const { data: clubs } = useClubs(effectiveClubId);
  return clubs?.[0]?.currency || "EUR";
};
