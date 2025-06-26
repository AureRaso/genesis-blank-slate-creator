
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LeagueForm from "@/components/LeagueForm";
import LeaguesList from "@/components/LeaguesList";
import { useAuth } from "@/contexts/AuthContext";
import { League } from "@/types/padel";

const LeaguesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | undefined>();
  const { isAdmin } = useAuth();

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
            Gestión de Ligas
          </h1>
          <p className="text-muted-foreground">
            Crea y administra ligas de pádel con diferentes configuraciones de puntuación
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

      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Acceso de Solo Lectura</CardTitle>
            <CardDescription className="text-orange-700">
              Solo los administradores pueden crear y editar ligas. Contacta a un administrador si necesitas crear una nueva liga.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <LeaguesList onEditLeague={handleEditLeague} />
    </div>
  );
};

export default LeaguesPage;
