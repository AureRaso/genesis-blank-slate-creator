import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && profile) {
      // Check if profile is complete
      if (!profile.club_id || !profile.level) {
        console.log('AuthCallback - Profile incomplete, redirecting to complete-profile');
        navigate("/complete-profile", { replace: true });
      } else {
        console.log('AuthCallback - Profile complete, redirecting to dashboard');
        navigate("/dashboard", { replace: true });
      }
    } else if (user && !profile) {
      // Wait for profile to load
      console.log('AuthCallback - Waiting for profile to load...');
    } else {
      // No user, redirect to auth
      console.log('AuthCallback - No user, redirecting to auth');
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
