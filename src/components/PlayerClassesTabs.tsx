import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayClassesConfirmation } from "./TodayClassesConfirmation";
import ClassBooking from "./ClassBooking";
import { Calendar, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlayerClassesTabsProps {
  selectedChildId?: string;
}

export const PlayerClassesTabs = ({ selectedChildId }: PlayerClassesTabsProps) => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{t('playerDashboard.tabs.myClasses')}</span>
        </TabsTrigger>
        <TabsTrigger value="available" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>{t('playerDashboard.tabs.availableClasses')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-0">
        <TodayClassesConfirmation selectedChildId={selectedChildId} />
      </TabsContent>

      <TabsContent value="available" className="mt-0">
        <ClassBooking />
      </TabsContent>
    </Tabs>
  );
};
