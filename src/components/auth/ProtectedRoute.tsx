
import { useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/pages/AuthPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, profile, loading, authError, retryAuth } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button
            onClick={retryAuth}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
