
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, Profile } from '@/types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider - Initializing...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider - Initial session:', session?.user?.email, 'error:', error);
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('AuthProvider - No session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile query result:', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, we'll still allow the user to continue
        // but we'll create a basic profile structure
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user can still continue');
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      if (data) {
        console.log('Profile fetched successfully:', data);
        const profileData: Profile = {
          ...data,
          role: data.role as 'admin' | 'player' | 'captain' | 'trainer'
        };
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
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

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isCaptain = profile?.role === 'captain';
  const isTrainer = profile?.role === 'trainer';

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isCaptain,
    isTrainer,
  };

  console.log('AuthProvider - Current state:', { 
    user: user?.email, 
    profile: profile?.role, 
    loading, 
    isAdmin,
    hasUser: !!user,
    hasProfile: !!profile 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
