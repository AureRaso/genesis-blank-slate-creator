
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const LogoutPage = () => {
  const { signOut } = useAuth();

  // Perform logout immediately when this page loads
  useEffect(() => {
    signOut();
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cerrando sesión...</p>
      </div>
    </div>
  );
};

export default LogoutPage;
