// FILE: src/config/features.ts (NEW)
// As specified in Task 4.5.2

export const FEATURES = {
  // Branding
  BRANDING_ON_EXPORT: {
    enabled: true,
    removable: false, // Will be true for premium users
  },
  
  // Future premium features
  REMOVE_BRANDING: {
    enabled: false,
    premium: true,
    betaFree: false,
  },
};