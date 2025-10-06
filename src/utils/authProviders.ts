import { User } from '@supabase/supabase-js';

/**
 * Checks if a user signed up with email/password or with OAuth (Google, etc.)
 */
export const getAuthProvider = (user: User | null): 'email' | 'google' | 'unknown' => {
  if (!user) return 'unknown';

  // Check app_metadata for providers
  const providers = user.app_metadata?.providers || [];

  console.log('🔍 Auth Provider Check:', {
    userId: user.id,
    email: user.email,
    providers,
    app_metadata: user.app_metadata
  });

  // If user has Google in providers array, they used Google OAuth
  if (providers.includes('google')) {
    return 'google';
  }

  // If user has email in providers array and no other OAuth provider, they used email/password
  if (providers.includes('email') && providers.length === 1) {
    return 'email';
  }

  // Fallback: check if they have a password set (email users have password)
  // Google OAuth users don't have a password in the traditional sense
  return providers.includes('email') ? 'email' : 'unknown';
};

/**
 * Returns true if user can change their password (signed up with email/password)
 */
export const canChangePassword = (user: User | null): boolean => {
  const provider = getAuthProvider(user);
  return provider === 'email';
};

/**
 * Returns a user-friendly message about their authentication method
 */
export const getAuthProviderMessage = (user: User | null): string => {
  const provider = getAuthProvider(user);

  switch (provider) {
    case 'email':
      return 'Has iniciado sesión con correo y contraseña';
    case 'google':
      return 'Has iniciado sesión con Google';
    default:
      return 'Método de autenticación desconocido';
  }
};
