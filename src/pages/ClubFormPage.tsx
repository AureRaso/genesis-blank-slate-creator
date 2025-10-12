import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ClubForm from "@/components/ClubForm";
import { Club } from "@/types/clubs";
import { useClubs } from "@/hooks/useClubs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ClubFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: clubs } = useClubs();
  const [editingClub, setEditingClub] = useState<Club | undefined>();

  useEffect(() => {
    if (id && clubs) {
      const club = clubs.find(c => c.id === id);
      setEditingClub(club);
    }
  }, [id, clubs]);

  const handleClose = () => {
    navigate("/dashboard/clubs");
  };

  return (
    <div className="space-y-6">
      <ClubForm club={editingClub} onClose={handleClose} />
    </div>
  );
};

export default ClubFormPage;