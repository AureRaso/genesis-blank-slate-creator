
import { useState } from "react";
import PlayersList from "@/components/PlayersList";
import AdminStudentsList from "@/components/AdminStudentsList";
import GhostStudentUpload from "@/components/admin/GhostStudentUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

const PlayersPage = () => {
  const { isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const [showGhostUpload, setShowGhostUpload] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-playtomic-orange"></div>
      </div>
    );
  }

  if (isAdmin && showGhostUpload) {
    return (
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
        <GhostStudentUpload onClose={() => setShowGhostUpload(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black truncate">
              {isAdmin ? t('playersPage.title.admin') : t('playersPage.title.player')}
            </h1>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowGhostUpload(true)}
              variant="outline"
              className="gap-2"
            >
              <Ghost className="h-4 w-4" />
              Pre-registrar alumnos
            </Button>
          )}
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
