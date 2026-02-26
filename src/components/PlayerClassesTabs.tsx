import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayClassesConfirmation } from "./TodayClassesConfirmation";
import { Calendar, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlayerPrivateLessonBookingPage from "@/pages/PlayerPrivateLessonBookingPage";

interface PlayerClassesTabsProps {
  selectedChildId?: string;
}

// Auto-switch to private lessons tab when returning from Stripe checkout
function getDefaultTab(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.get("pl_payment")) {
    return "private-lessons";
  }
  return "upcoming";
}

export const PlayerClassesTabs = ({ selectedChildId }: PlayerClassesTabsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(getDefaultTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{t('playerDashboard.tabs.myClasses')}</span>
        </TabsTrigger>
        <TabsTrigger value="private-lessons" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span>{t('playerDashboard.tabs.privateLessons', 'Clases Particulares')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-0">
        <TodayClassesConfirmation selectedChildId={selectedChildId} />
      </TabsContent>

      <TabsContent value="private-lessons" className="mt-0">
        <PlayerPrivateLessonBookingPage
          embedded
          onBackToMyClasses={() => setActiveTab("upcoming")}
        />
      </TabsContent>
    </Tabs>
  );
};
