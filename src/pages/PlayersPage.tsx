
import PlayerForm from "@/components/PlayerForm";
import PlayersList from "@/components/PlayersList";
import AdminStudentsList from "@/components/AdminStudentsList";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const PlayersPage = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          {isAdmin ? 'Alumnos Disponibles' : 'Jugadores'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Alumnos inscritos en tus clubes' : 'Lista de jugadores registrados'}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PlayerForm />
          </div>
          <div className="space-y-6">
            <AdminStudentsList />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <PlayersList />
        </div>
      )}
    </div>
  );
};

export default PlayersPage;
