import { FeatureFlags, isFeatureEnabled } from "@/config/features";

export const useFeatureFlags = () => {
  const isEnabled = (feature: keyof FeatureFlags): boolean => {
    return isFeatureEnabled(feature);
  };

  return {
    isEnabled,
    leagues: isEnabled('leagues'),
    matches: isEnabled('matches'),
  };
};