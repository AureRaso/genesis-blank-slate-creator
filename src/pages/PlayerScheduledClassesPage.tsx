import { useAuth } from "@/contexts/AuthContext";
import PlayerProgrammedClasses from "@/components/PlayerProgrammedClasses";

const PlayerScheduledClassesPage = () => {
  const { profile } = useAuth();

  return (
    <div className="container mx-auto py-6">
      <PlayerProgrammedClasses clubId={profile?.club_id || undefined} />
    </div>
  );
};

export default PlayerScheduledClassesPage;