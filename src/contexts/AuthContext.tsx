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
        console.log('AuthProvider - Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthProvider - Initial session result:', { 
          userEmail: session?.user?.email, 
          error: error?.message 
        });
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('AuthProvider - Setting user from initial session');
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('AuthProvider - No initial session found');
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
      console.log('fetchProfile - Starting for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('fetchProfile - Query completed:', { 
        data: data ? { id: data.id, email: data.email, role: data.role } : null, 
        error: error?.message,
        errorCode: error?.code
      });

      if (error) {
        console.error('Error fetching profile:', error);
        
        // If profile doesn't exist (PGRST116), create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile...');
          await createBasicProfile(userId);
        } else {
          console.error('Unexpected error fetching profile:', error);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (data) {
        console.log('fetchProfile - Profile found, setting profile state');
        const profileData: Profile = {
          ...data,
          role: data.role as 'admin' | 'player' | 'captain' | 'trainer'
        };
        setProfile(profileData);
        console.log('fetchProfile - Profile state set:', profileData.role);
      } else {
        console.log('fetchProfile - No profile data returned');
        setProfile(null);
      }
    } catch (error) {
      console.error('Exception in fetchProfile:', error);
      setProfile(null);
    } finally {
      console.log('fetchProfile - Setting loading to false');
      setLoading(false);
    }
  };

  const createBasicProfile = async (userId: string) => {
    try {
      console.log('createBasicProfile - Creating profile for user:', userId);
      
      // Get user info from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error getting user for profile creation:', userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || 'usuario@example.com',
          full_name: user.user_metadata?.full_name || 'Usuario',
          role: 'player'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating basic profile:', error);
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('createBasicProfile - Profile created successfully:', data);
      const profileData: Profile = {
        ...data,
        role: data.role as 'admin' | 'player' | 'captain' | 'trainer'
      };
      setProfile(profileData);
      setLoading(false);
    } catch (error) {
      console.error('Exception in createBasicProfile:', error);
      setProfile(null);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('signIn - Attempting login for:', email);
    
    // Block problematic user from signing in
    if (email === 'sefaca24@gmail.com') {
      console.log('Blocking login for problematic user sefaca24@gmail.com');
      return { error: { message: 'Este usuario está temporalmente bloqueado' } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('signIn - Result:', error ? `Error: ${error.message}` : 'Success');
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('signUp - Attempting signup for:', email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    console.log('signUp - Result:', error ? `Error: ${error.message}` : 'Success');
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('signOut - Attempting logout');
      
      // Clear localStorage to remove any cached data
      localStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        console.log('signOut - Success');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Exception in signOut:', error);
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
