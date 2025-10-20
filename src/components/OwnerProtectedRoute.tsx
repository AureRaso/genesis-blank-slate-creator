/**
 * OwnerProtectedRoute
 *
 * Componente de protección de rutas para el panel de administración de owners.
 *
 * IMPORTANTE: Este es un componente NUEVO que no afecta ninguna funcionalidad existente.
 * Solo se usa para las rutas bajo /owner/*
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const OwnerProtectedRoute = () => {
  const { user, profile, loading } = useAuth();

  // Mostrar loader mientras se carga la autenticación
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-playtomic-orange mx-auto mb-4" />
          <p className="text-white text-lg">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!user) {
    console.log('OwnerProtectedRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Si no hay perfil cargado aún, esperar
  if (!profile) {
    console.log('OwnerProtectedRoute - No profile loaded, waiting...');
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-playtomic-dark to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-playtomic-orange mx-auto mb-4" />
          <p className="text-white text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Si el usuario NO es owner, redirigir al dashboard normal
  if (profile.role !== 'owner') {
    console.log('OwnerProtectedRoute - User is not owner, redirecting to dashboard');
    console.log('OwnerProtectedRoute - User role:', profile.role);
    return <Navigate to="/dashboard" replace />;
  }

  // Si llegamos aquí, el usuario es owner y puede acceder
  console.log('OwnerProtectedRoute - Access granted for owner:', profile.email);

  // Renderizar las rutas hijas (Outlet)
  return <Outlet />;
};

export default OwnerProtectedRoute;
