import TrainerNotifications from "@/components/TrainerNotifications";
import { useTranslation } from "react-i18next";

const WaitlistNotifications = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-playtomic-orange to-playtomic-orange-dark bg-clip-text text-transparent">
          {t('pages.waitlistNotifications.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('pages.waitlistNotifications.description')}
        </p>
      </div>
      
      <TrainerNotifications />
    </div>
  );
};

export default WaitlistNotifications;