import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayClassesConfirmation } from "./TodayClassesConfirmation";
import ClassBooking from "./ClassBooking";
import { Calendar, Search } from "lucide-react";

interface PlayerClassesTabsProps {
  selectedChildId?: string;
}

export const PlayerClassesTabs = ({ selectedChildId }: PlayerClassesTabsProps) => {
  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Mis clases</span>
        </TabsTrigger>
        <TabsTrigger value="available" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Clases disponibles</span>
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
