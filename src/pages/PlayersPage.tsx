
import { useState } from "react";
import PlayersList from "@/components/PlayersList";
import AdminStudentsList from "@/components/AdminStudentsList";
import StudentEnrollmentForm from "@/components/StudentEnrollmentForm";
import BulkStudentUpload from "@/components/BulkStudentUpload";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";

const PlayersPage = () => {
  const { isAdmin, loading, profile } = useAuth();
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
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

  if (showBulkUpload) {
    return (
      <div className="space-y-6">
        <BulkStudentUpload 
          onClose={() => setShowBulkUpload(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black truncate">
              {isAdmin ? 'Alumnos Disponibles' : 'Jugadores'}
            </h1>
          </div>
          {isAdmin && (
            <div className="hidden sm:flex space-x-2 flex-shrink-0">
              <Button onClick={() => setShowStudentForm(true)} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
                <UserPlus className="mr-2 h-4 w-4" />
                Nueva Inscripción
              </Button>
              <Button onClick={() => setShowBulkUpload(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Subida Masiva
              </Button>
            </div>
          )}
        </div>

        {/* Mobile buttons */}
        {isAdmin && (
          <div className="flex sm:hidden gap-2">
            <Button
              onClick={() => setShowStudentForm(true)}
              className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark flex-1 text-sm"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nueva Inscripción
            </Button>
            <Button
              onClick={() => setShowBulkUpload(true)}
              variant="outline"
              className="flex-1 text-sm"
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              Subida Masiva
            </Button>
          </div>
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
