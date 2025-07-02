
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ClubForm from "@/components/ClubForm";
import ClubsList from "@/components/ClubsList";
import { useAuth } from "@/contexts/AuthContext";
import { Club } from "@/types/clubs";

const ClubsPage = () => {
  const [showClubForm, setShowClubForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | undefined>();
  const { isAdmin } = useAuth();

  const handleCloseClubForm = () => {
    setShowClubForm(false);
    setEditingClub(undefined);
  };

  const handleEditClub = (club: Club) => {
    setEditingClub(club);
    setShowClubForm(true);
  };

  const handleCreateNewClub = () => {
    setEditingClub(undefined);
    setShowClubForm(true);
  };

  if (showClubForm) {
    return (
      <div className="space-y-6">
        <ClubForm club={editingClub} onClose={handleCloseClubForm} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
          Gestión de Clubs
        </h1>
        <p className="text-muted-foreground">
          Administra los clubs de pádel
        </p>
      </div>

      {!isAdmin && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-playtomic-orange-dark">Acceso de Solo Lectura</CardTitle>
            <CardDescription className="text-playtomic-orange">
              Solo los administradores pueden crear y editar clubs.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Clubs Registrados</h2>
          <p className="text-muted-foreground">Gestiona tus clubs de pádel</p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateNewClub} className="bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Club
          </Button>
        )}
      </div>
      <ClubsList onEditClub={handleEditClub} />
    </div>
  );
};

export default ClubsPage;
