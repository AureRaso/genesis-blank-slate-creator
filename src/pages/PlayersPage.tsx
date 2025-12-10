
import PlayersList from "@/components/PlayersList";
import AdminStudentsList from "@/components/AdminStudentsList";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black truncate">
              {isAdmin ? 'Alumnos disponibles' : 'Jugadores'}
            </h1>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <AdminStudentsList />
      ) : (
        <PlayersList />
      )}
    </div>
  );
};

export default PlayersPage;
