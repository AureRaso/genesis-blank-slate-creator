
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types/auth';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, clubId?: string, level?: number, role?: 'player' | 'guardian') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  retryAuth: () => void;
  isAdmin: boolean;
  isPlayer: boolean;
  isTrainer: boolean;
  isOwner: boolean;
  isGuardian: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

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

    // Only use onAuthStateChange for all auth state management
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Prevent unnecessary re-authentication when window becomes visible again
        const timeSinceVisibilityChange = Date.now() - lastVisibilityChangeRef.current;
        const isRecentVisibilityChange = timeSinceVisibilityChange < 1000; // 1 second
        
        if (isRecentVisibilityChange && session?.user && currentUserIdRef.current === session.user.id && profile) {
          console.log('AuthContext - Skipping auth update due to recent visibility change');
          return;
        }
        
        console.log('AuthContext - Auth state change:', event, session?.user?.email);
        
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
          console.log('AuthContext - No session, clearing profile');
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

  const fetchProfile = async (userId: string) => {
    console.log('🔍 DEBUG - Starting fetchProfile for user:', userId);

    // Prevent multiple concurrent requests
    if (isCurrentlyFetching.current) {
      console.log('🔍 DEBUG - Already fetching profile, skipping');
      return;
    }

    isCurrentlyFetching.current = true;

    try {
      console.log('🔍 DEBUG - Making profile query...');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('🔍 DEBUG - Profile query result:', {
        data,
        error,
        level: data?.level,
        levelType: typeof data?.level,
        club_id: data?.club_id
      });

      if (error) {
        console.error('AuthContext - Error fetching profile:', error);
        
        if (error.code === 'PGRST116') {
          console.log('AuthContext - Profile not found, but user exists');
          setProfile(null);
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
        const validProfile: Profile = {
          ...data,
          role: data.role as 'admin' | 'player' | 'trainer'
        };
        setProfile(validProfile);
        console.log('AuthContext - Profile set with role:', validProfile.role);
      }
    } catch (error: any) {
      console.error('AuthContext - Exception in fetchProfile:', error);
      setAuthError('Error de conexión. Por favor, verifica tu conexión a internet.');
    } finally {
      isCurrentlyFetching.current = false;
      console.log('AuthContext - Setting loading to false in finally block');
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, clubId?: string, level?: number, role: 'player' | 'guardian' = 'player') => {
    console.log('🔍 DEBUG - AuthContext signUp called with:', {
      email,
      fullName,
      clubId,
      level,
      levelType: typeof level,
      role
    });

    const redirectUrl = `${window.location.origin}/`;

    const userData = {
      full_name: fullName,
      club_id: clubId,
      level: level,
      role: role
    };

    console.log('🔍 DEBUG - userData being sent to Supabase:', userData);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    console.log('🔍 DEBUG - Supabase signUp result:', {
      error,
      user: data?.user?.id,
      userMetadata: data?.user?.user_metadata
    });

    // If signup was successful and user is a player with a club, create student_enrollment
    if (!error && data?.user && role === 'player' && clubId) {
      console.log('🔍 DEBUG - Creating student_enrollment for manual signup');

      try {
        // Wait for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from('student_enrollments')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (!existingEnrollment) {
          // Find trainer using fallback pattern
          let trainerId: string | null = null;

          // 1. Try trainer_clubs table
          const { data: trainerClubs } = await supabase
            .from('trainer_clubs')
            .select('trainer_profile_id')
            .eq('club_id', clubId)
            .limit(1);

          if (trainerClubs && trainerClubs.length > 0) {
            trainerId = trainerClubs[0].trainer_profile_id;
            console.log('🔍 DEBUG - Found trainer via trainer_clubs:', trainerId);
          } else {
            // 2. Try profiles with role=trainer and matching club_id
            const { data: trainers } = await supabase
              .from('profiles')
              .select('id')
              .eq('club_id', clubId)
              .eq('role', 'trainer')
              .limit(1);

            if (trainers && trainers.length > 0) {
              trainerId = trainers[0].id;
              console.log('🔍 DEBUG - Found trainer via profiles:', trainerId);
            } else {
              // 3. Fallback to any admin
              const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1);

              if (admins && admins.length > 0) {
                trainerId = admins[0].id;
                console.log('🔍 DEBUG - Using admin as fallback:', trainerId);
              }
            }
          }

          if (trainerId) {
            const enrollmentData = {
              trainer_profile_id: trainerId,
              created_by_profile_id: data.user.id,
              email: email,
              full_name: fullName,
              phone: '',
              level: level || 3,
              club_id: clubId,
              status: 'active'
            };

            console.log('🔍 DEBUG - Creating enrollment with data:', enrollmentData);

            const { error: enrollmentError } = await supabase
              .from('student_enrollments')
              .insert(enrollmentData);

            if (enrollmentError) {
              console.error('🔍 DEBUG - Error creating enrollment:', enrollmentError);
            } else {
              console.log('🔍 DEBUG - ✅ Student enrollment created successfully');
            }
          } else {
            console.warn('🔍 DEBUG - No trainer or admin found for enrollment creation');
          }
        } else {
          console.log('🔍 DEBUG - Enrollment already exists, skipping creation');
        }
      } catch (enrollmentError) {
        console.error('🔍 DEBUG - Exception creating enrollment:', enrollmentError);
        // Don't fail the signup if enrollment creation fails
      }
    }

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
  const isOwner = profile?.role === 'owner';
  const isGuardian = profile?.role === 'guardian';

  console.log('AuthContext - Current state:', {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    role: profile?.role,
    authError,
    isAdmin,
    isPlayer,
    isTrainer,
    isOwner,
    isGuardian
  });

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
