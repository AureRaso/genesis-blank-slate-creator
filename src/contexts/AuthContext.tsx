
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, clubId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  retryAuth: () => void;
  isAdmin: boolean;
  isPlayer: boolean;
  isTrainer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Cache and debounce for profile fetching
  const profileCache = new Map<string, { profile: Profile | null; timestamp: number }>();
  const fetchingProfiles = new Set<string>();
  let profileAbortController: AbortController | null = null;

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Safety timeout to prevent infinite loading
    const setupLoadingTimeout = () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('AuthContext - Loading timeout reached, forcing loading to false');
          setLoading(false);
          setAuthError('Timeout al cargar la aplicación. Por favor, recarga la página.');
        }
      }, 10000);
    };

    const clearLoadingTimeout = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };

    // Setup loading timeout
    setupLoadingTimeout();

    // Only use onAuthStateChange for all auth state management
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('AuthContext - Auth state change:', event, session?.user?.email);
        
        // Clear any existing error
        setAuthError(null);
        
        // Reset loading timeout
        setupLoadingTimeout();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          console.log('AuthContext - No session, clearing profile');
          setProfile(null);
          setLoading(false);
          clearLoadingTimeout();
        }
      }
    );

    return () => {
      mounted = false;
      clearLoadingTimeout();
      if (profileAbortController) {
        profileAbortController.abort();
      }
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('AuthContext - Starting fetchProfile for user:', userId);
    
    // Prevent multiple concurrent requests for the same user
    if (fetchingProfiles.has(userId)) {
      console.log('AuthContext - Already fetching profile for user:', userId);
      return;
    }

    // Check cache first (5 minute cache)
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < 300000) {
      console.log('AuthContext - Using cached profile for user:', userId);
      setProfile(cached.profile);
      setLoading(false);
      return;
    }

    fetchingProfiles.add(userId);
    
    // Cancel any existing request
    if (profileAbortController) {
      profileAbortController.abort();
    }
    
    profileAbortController = new AbortController();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(profileAbortController.signal)
        .single();

      console.log('AuthContext - Profile query result:', { data, error });

      if (error) {
        console.error('AuthContext - Error fetching profile:', error);
        
        if (error.code === 'PGRST116') {
          console.log('AuthContext - Profile not found, but user exists');
          // Profile doesn't exist yet, but user is authenticated
          setProfile(null);
          profileCache.set(userId, { profile: null, timestamp: Date.now() });
        } else if (error.code === 'PGRST301') {
          console.log('AuthContext - RLS policy violation, user may not have access');
          setProfile(null);
          setAuthError('Error de permisos. Por favor, contacta al administrador.');
        } else {
          console.error('AuthContext - Unexpected error:', error);
          setAuthError('Error al cargar el perfil. Por favor, intenta de nuevo.');
        }
      } else if (data) {
        console.log('AuthContext - Profile fetched successfully:', data);
        // Asegurar que el rol es válido según nuestros tipos
        const validProfile: Profile = {
          ...data,
          role: data.role as 'admin' | 'player' | 'trainer'
        };
        setProfile(validProfile);
        profileCache.set(userId, { profile: validProfile, timestamp: Date.now() });
        console.log('AuthContext - Profile set with role:', validProfile.role);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('AuthContext - Profile fetch aborted');
        return;
      }
      console.error('AuthContext - Exception in fetchProfile:', error);
      setAuthError('Error de conexión. Por favor, verifica tu conexión a internet.');
    } finally {
      fetchingProfiles.delete(userId);
      console.log('AuthContext - Setting loading to false');
      setLoading(false);
    }
  };

  const retryAuth = () => {
    setAuthError(null);
    setLoading(true);
    // Clear cache and retry
    profileCache.clear();
    fetchingProfiles.clear();
    
    // Trigger auth state refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
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

  const signUp = async (email: string, password: string, fullName: string, clubId?: string) => {
    console.log('AuthContext - signUp called with:', { email, fullName, clubId });
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          club_id: clubId
        }
      }
    });
    
    console.log('AuthContext - signUp result:', { error });
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

  const isAdmin = profile?.role === 'admin';
  const isPlayer = profile?.role === 'player';
  const isTrainer = profile?.role === 'trainer';

  console.log('AuthContext - Current state:', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile, 
    role: profile?.role,
    authError,
    isAdmin,
    isPlayer,
    isTrainer 
  });

  const value = {
    user,
    profile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    retryAuth,
    isAdmin,
    isPlayer,
    isTrainer,
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
