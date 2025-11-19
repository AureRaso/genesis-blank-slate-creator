import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    console.log('🔐 [AUTH CALLBACK] useEffect triggered');

    // Check URL hash for OAuth tokens
    const hash = window.location.hash;
    if (hash) {
      console.log('🔐 [AUTH CALLBACK] URL hash present:', hash.substring(0, 50) + '...');

      // Check if this is an OAuth callback with access_token
      if (hash.includes('access_token')) {
        console.log('✅ [AUTH CALLBACK] OAuth access_token detected in URL');
      } else {
        console.log('⚠️ [AUTH CALLBACK] URL hash present but no access_token');
      }
    } else {
      console.log('⚠️ [AUTH CALLBACK] No URL hash present');
    }

    // Check localStorage immediately
    const supabaseKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
    console.log('📊 [AUTH CALLBACK] localStorage state:', {
      totalKeys: Object.keys(localStorage).length,
      supabaseKeys: supabaseKeys.length,
      keys: supabaseKeys
    });

    console.log('🔍 [AUTH CALLBACK] Auth state:', {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      userEmail: user?.email,
      profileData: profile ? {
        role: profile.role,
        club_id: profile.club_id,
        level: profile.level,
        levelType: typeof profile.level
      } : null
    });

    if (loading) return;

    if (user && profile) {
      // Check if there's a return URL saved from before login
      const returnUrl = sessionStorage.getItem('returnUrl');

      // Only check profile completion for players
      const isProfileIncomplete = profile.role === 'player' && (!profile.club_id || !profile.level);

      console.log('🔍 DEBUG - Profile completion check:', {
        role: profile.role,
        club_id: profile.club_id,
        level: profile.level,
        isProfileIncomplete,
        returnUrl
      });

      if (isProfileIncomplete) {
        console.log('🔍 DEBUG - Player profile incomplete, redirecting to complete-profile');
        navigate("/complete-profile", { replace: true });
      } else if (returnUrl) {
        // Clear the return URL and navigate to it
        console.log('🔍 DEBUG - Returning to saved URL:', returnUrl);
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl, { replace: true });
      } else {
        console.log('🔍 DEBUG - Profile complete, redirecting to dashboard');
        navigate("/dashboard", { replace: true });
      }
    } else if (user && !profile) {
      // Wait for profile to load
      console.log('🔍 DEBUG - Waiting for profile to load...');
    } else {
      // No user, redirect to auth
      console.log('🔍 DEBUG - No user, redirecting to auth');
      navigate("/auth", { replace: true });
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-playtomic-orange mx-auto mb-4"></div>
        <p className="text-white text-lg">Completando inicio de sesión...</p>
        <p className="text-slate-400 text-sm mt-2">Por favor espera un momento</p>
      </div>
    </div>
  );
};

export default AuthCallback;
