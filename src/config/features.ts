// Feature flags configuration
// This can be expanded to support per-club feature activation in the future

export interface FeatureFlags {
  leagues: boolean;
  matches: boolean;
}

// Global feature flags - can be overridden per club in the future
export const FEATURE_FLAGS: FeatureFlags = {
  leagues: false, // Temporarily disabled
  matches: false, // Temporarily disabled
};

// Function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature];
};

// Function to check if leagues and matches should be shown
export const shouldShowLeagues = () => isFeatureEnabled('leagues');
export const shouldShowMatches = () => isFeatureEnabled('matches');