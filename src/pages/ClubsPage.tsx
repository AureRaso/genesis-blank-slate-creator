
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ClubForm from "@/components/ClubForm";
import ClubsList from "@/components/ClubsList";
import { useAuth } from "@/contexts/AuthContext";
import { Club } from "@/types/clubs";

const ClubsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | undefined>();
  const { isAdmin } = useAuth();

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClub(undefined);
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingClub(undefined);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <ClubForm club={editingClub} onClose={handleCloseForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
            Gestión de Clubs
          </h1>
          <p className="text-muted-foreground">
            Administra los clubs donde se juegan las ligas de pádel
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark hover:from-playtomic-orange-dark hover:to-playtomic-orange transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Club
          </Button>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark">Acceso de Solo Lectura</CardTitle>
            <CardDescription className="text-playtomic-orange">
              Solo los administradores pueden crear y editar clubs. Contacta a un administrador si necesitas crear un nuevo club.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <ClubsList onEditClub={handleEditClub} />
    </div>
  );
};

export default ClubsPage;
