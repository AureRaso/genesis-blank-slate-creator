
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeagueForm from "@/components/LeagueForm";
import LeaguesList from "@/components/LeaguesList";
import PlayerLeaguesList from "@/components/PlayerLeaguesList";
import { useAuth } from "@/contexts/AuthContext";
import { League } from "@/types/padel";

const LeaguesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | undefined>();
  const { isAdmin, isPlayer, profile } = useAuth();

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLeague(undefined);
  };

  const handleEditLeague = (league: League) => {
    setEditingLeague(league);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingLeague(undefined);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <LeagueForm league={editingLeague} onClose={handleCloseForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {isPlayer ? "Ligas de Mi Club" : "Gestión de Ligas"}
          </h1>
          <p className="text-muted-foreground">
            {isPlayer 
              ? "Ligas disponibles en tu club para participar"
              : "Crea y administra ligas de pádel con diferentes configuraciones de puntuación"
            }
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Liga
          </Button>
        )}
      </div>

      {isPlayer ? (
        <PlayerLeaguesList clubId={profile?.club_id} />
      ) : (
        <LeaguesList onEditLeague={handleEditLeague} />
      )}
    </div>
  );
};

export default LeaguesPage;
