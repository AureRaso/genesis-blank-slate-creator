
import { useState } from "react";
import PlayersList from "@/components/PlayersList";
import AdminStudentsList from "@/components/AdminStudentsList";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const PlayersPage = () => {
  const { isAdmin, loading, profile } = useAuth();
  const [showStudentForm, setShowStudentForm] = useState(false);
  
  console.log('🏠 PlayersPage Auth Check:', {
    isAdmin,
    loading,
    profileId: profile?.id,
    profileRole: profile?.role,
    profileClubId: profile?.club_id
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
      </div>
    );
  }

  if (showStudentForm) {
    return (
      <div className="space-y-6">
        <StudentEnrollmentForm 
          onClose={() => setShowStudentForm(false)}
          onSuccess={() => setShowStudentForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {isAdmin ? 'Alumnos Disponibles' : 'Jugadores'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Alumnos inscritos en tus clubes' : 'Lista de jugadores registrados'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowStudentForm(true)} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
            <UserPlus className="mr-2 h-4 w-4" />
            Nueva Inscripción
          </Button>
        )}
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
