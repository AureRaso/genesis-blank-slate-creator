
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, clubId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('AuthContext - Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        console.log('AuthContext - No initial session, setting loading to false');
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('AuthContext - Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          console.log('AuthContext - No session in state change, clearing profile');
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('AuthContext - Starting fetchProfile for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('AuthContext - Profile query result:', { data, error });

      if (error) {
        console.error('AuthContext - Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          console.log('AuthContext - Profile not found, but user exists');
          // Profile doesn't exist yet, but user is authenticated
          setProfile(null);
        }
      } else if (data) {
        console.log('AuthContext - Profile fetched successfully:', data);
        // Asegurar que el rol es válido según nuestros tipos
        const validProfile: Profile = {
          ...data,
          role: data.role as 'admin' | 'player' | 'trainer'
        };
        setProfile(validProfile);
        console.log('AuthContext - Profile set with role:', validProfile.role);
      }
    } catch (error) {
      console.error('AuthContext - Exception in fetchProfile:', error);
    } finally {
      console.log('AuthContext - Setting loading to false');
      setLoading(false);
    }
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
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setProfile(null);
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
    isAdmin,
    isPlayer,
    isTrainer 
  });

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
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
