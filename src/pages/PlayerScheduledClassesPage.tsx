import { useAuth } from "@/contexts/AuthContext";
import PlayerProgrammedClasses from "@/components/PlayerProgrammedClasses";
import { useTranslation } from "react-i18next";

const PlayerScheduledClassesPage = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.scheduledClasses.title')}</h1>
          <p className="text-muted-foreground">{t('pages.scheduledClasses.description')}</p>
        </div>
        <PlayerProgrammedClasses clubId={profile?.club_id || undefined} />
      </div>
    </div>
  );
};

export default PlayerScheduledClassesPage;