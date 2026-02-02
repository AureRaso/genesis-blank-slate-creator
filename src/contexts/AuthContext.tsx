
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile, UserRole } from '@/types/auth';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';

// Club info for superadmin selector
interface SuperAdminClub {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone: string, clubId?: string, level?: number, role?: 'player' | 'guardian') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  retryAuth: () => void;
  isAdmin: boolean;
  isPlayer: boolean;
  isTrainer: boolean;
  isOwner: boolean;
  isGuardian: boolean;
  // Superadmin support
  isSuperAdmin: boolean;
  superAdminClubs: SuperAdminClub[];
  selectedClubId: string | null;
  setSelectedClubId: (clubId: string | null) => void;
  effectiveClubId: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage key for persisting selected club
const SELECTED_CLUB_KEY = 'padelock_selected_club_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Superadmin state
  const [superAdminClubs, setSuperAdminClubs] = useState<SuperAdminClub[]>([]);
  const [selectedClubId, setSelectedClubIdState] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SELECTED_CLUB_KEY);
    }
    return null;
  });

  // Use refs to track state without causing re-renders
  const currentUserIdRef = useRef<string | null>(null);
  const isCurrentlyFetching = useRef(false);
  const hasInitializedRef = useRef(false);
  const isWindowVisible = useWindowVisibility();
  const lastVisibilityChangeRef = useRef<number>(Date.now());

  // Handle window visibility changes to prevent unnecessary auth calls
  useEffect(() => {
    if (isWindowVisible) {
      lastVisibilityChangeRef.current = Date.now();
    }
  }, [isWindowVisible]);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const clearLoadingTimeout = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };

    const setupLoadingTimeout = () => {
      clearLoadingTimeout();
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('AuthContext - Loading timeout reached');
          setLoading(false);
          setAuthError('Timeout al cargar la aplicación. Por favor, recarga la página.');
        }
      }, 10000);
    };

    // Initialize session on mount - critical for OAuth and direct URL navigation
    const initializeSession = async () => {
      if (!mounted || hasInitializedRef.current) return;

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthContext - Error getting initial session:', error);
          setAuthError('Error al recuperar la sesión');
          setLoading(false);
          return;
        }

        hasInitializedRef.current = true;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          currentUserIdRef.current = initialSession.user.id;

          setLoading(true);
          setupLoadingTimeout();

          fetchProfile(initialSession.user.id).finally(() => {
            clearLoadingTimeout();
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext - Exception during session initialization:', error);
        setLoading(false);
      }
    };

    // Call initialize immediately
    initializeSession();

    // Only use onAuthStateChange for all auth state management
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Handle PASSWORD_RECOVERY event - redirect to reset password page
        if (event === 'PASSWORD_RECOVERY') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Don't fetch profile, just redirect to reset password page
          // The ResetPasswordPage will handle the password update
          if (window.location.pathname !== '/reset-password') {
            window.location.href = '/reset-password' + window.location.hash;
          }
          return;
        }

        // Skip INITIAL_SESSION event since we handle it manually in initializeSession
        if (event === 'INITIAL_SESSION' && hasInitializedRef.current) {
          return;
        }

        // Prevent unnecessary re-authentication when window becomes visible again
        const timeSinceVisibilityChange = Date.now() - lastVisibilityChangeRef.current;
        const isRecentVisibilityChange = timeSinceVisibilityChange < 1000; // 1 second

        if (isRecentVisibilityChange && session?.user && currentUserIdRef.current === session.user.id && profile) {
          return;
        }

        // Clear any existing error
        setAuthError(null);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userId = session.user.id;

          // Only fetch profile if it's a different user or we haven't fetched it yet
          if (currentUserIdRef.current !== userId || !profile) {
            currentUserIdRef.current = userId;

            // Set loading and start timeout only if we're actually fetching
            if (!isCurrentlyFetching.current) {
              setLoading(true);
              setupLoadingTimeout();

              fetchProfile(userId).finally(() => {
                clearLoadingTimeout();
              });
            }
          }
        } else {
          currentUserIdRef.current = null;
          setProfile(null);
          setLoading(false);
          clearLoadingTimeout();
        }
      }
    );

    return () => {
      mounted = false;
      clearLoadingTimeout();
      subscription.unsubscribe();
    };
  }, [profile, isWindowVisible]);

  // Fetch superadmin clubs from admin_clubs table
  const fetchSuperAdminClubs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_clubs')
        .select('club_id, clubs(id, name)')
        .eq('admin_profile_id', userId);

      if (error) {
        console.error('AuthContext - Error fetching superadmin clubs:', error);
        return [];
      }

      const clubs: SuperAdminClub[] = (data || [])
        .filter((item: any) => item.clubs)
        .map((item: any) => ({
          id: item.clubs.id,
          name: item.clubs.name
        }));

      return clubs;
    } catch (error) {
      console.error('AuthContext - Exception fetching superadmin clubs:', error);
      return [];
    }
  };

  const fetchProfile = async (userId: string) => {
    // Prevent multiple concurrent requests
    if (isCurrentlyFetching.current) {
      return;
    }

    isCurrentlyFetching.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, clubs!profiles_club_id_fkey(is_subscription_active)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthContext - Error fetching profile:', error);

        if (error.code === 'PGRST116') {
          setProfile(null);
        } else if (error.code === 'PGRST301') {
          setProfile(null);
          setAuthError('Error de permisos. Por favor, contacta al administrador.');
        } else {
          setAuthError('Error al cargar el perfil. Por favor, intenta de nuevo.');
        }
      } else if (data) {
        // Check if club subscription is active
        const isSubscriptionActive = data.clubs?.is_subscription_active ?? true;

        if (!isSubscriptionActive && data.club_id) {
          // Admins and superadmins can access payment page to renew subscription
          const isAdminUser = data.role === 'admin' || data.role === 'superadmin';
          const isPaymentPage = window.location.pathname === '/dashboard/payment';

          // Prevent infinite loop - only redirect if not already on blocked page or payment page (for admins)
          if (window.location.pathname !== '/subscription-blocked' && !(isAdminUser && isPaymentPage)) {
            window.location.href = '/subscription-blocked';
            return;
          }
        }

        const validProfile: Profile = {
          ...data,
          role: data.role as UserRole
        };
        setProfile(validProfile);

        // If superadmin, fetch their assigned clubs
        if (data.role === 'superadmin') {
          const clubs = await fetchSuperAdminClubs(userId);
          setSuperAdminClubs(clubs);

          // If no club selected yet, or selected club is not in the list, select first one
          const savedClubId = localStorage.getItem(SELECTED_CLUB_KEY);
          const isValidSavedClub = clubs.some(c => c.id === savedClubId);

          if (!savedClubId || !isValidSavedClub) {
            if (clubs.length > 0) {
              setSelectedClubIdState(clubs[0].id);
              localStorage.setItem(SELECTED_CLUB_KEY, clubs[0].id);
            }
          }
        } else {
          // Not a superadmin, clear superadmin state
          setSuperAdminClubs([]);
        }
      }
    } catch (error: any) {
      console.error('AuthContext - Exception in fetchProfile:', error);
      setAuthError('Error de conexión. Por favor, verifica tu conexión a internet.');
    } finally {
      isCurrentlyFetching.current = false;
      setLoading(false);
    }
  };

  const retryAuth = () => {
    setAuthError(null);
    setLoading(true);
    isCurrentlyFetching.current = false;
    currentUserIdRef.current = null;
    
    // Trigger auth state refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    // For iOS compatibility, we add skipRedirectCheck to handle OAuth callback properly
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false,
        // Set default metadata for new Google users
        data: {
          level: 5, // Nivel por defecto para nuevos usuarios de Google
          role: 'player'
        }
      }
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, clubId?: string, level?: number, role: 'player' | 'guardian' = 'player') => {
    const redirectUrl = `${window.location.origin}/`;

    const userData = {
      full_name: fullName,
      phone: phone,
      club_id: clubId,
      level: level,
      role: role
    };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    // Note: student_enrollment is automatically created by the handle_new_user() database trigger
    // No need to create it manually here - the trigger handles it with proper permissions

    return { error };
  };

  const signOut = async () => {
    try {
      // Clear all local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);

      // Clear all localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });

      // Force immediate redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during signOut:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      window.location.href = '/auth';
    }
  };

  const isSuperAdmin = profile?.role === 'superadmin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin; // superadmin has admin privileges
  const isPlayer = profile?.role === 'player';
  const isTrainer = profile?.role === 'trainer';
  const isOwner = profile?.role === 'owner';
  const isGuardian = profile?.role === 'guardian';

  // Setter for selected club with localStorage persistence
  const setSelectedClubId = useCallback((clubId: string | null) => {
    setSelectedClubIdState(clubId);
    if (clubId === null) {
      localStorage.removeItem(SELECTED_CLUB_KEY);
    } else {
      localStorage.setItem(SELECTED_CLUB_KEY, clubId);
    }
  }, []);

  // effectiveClubId: for superadmin use selected club, for others use profile.club_id
  const effectiveClubId = isSuperAdmin ? (selectedClubId ?? undefined) : profile?.club_id;

  const value = {
    user,
    profile,
    loading,
    authError,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    retryAuth,
    isAdmin,
    isPlayer,
    isTrainer,
    isOwner,
    isGuardian,
    // Superadmin support
    isSuperAdmin,
    superAdminClubs,
    selectedClubId,
    setSelectedClubId,
    effectiveClubId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
