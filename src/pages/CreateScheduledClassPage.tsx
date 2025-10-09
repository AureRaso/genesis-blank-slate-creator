import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScheduledClassForm from "@/components/ScheduledClassForm";
import ClassPreviewPanel from "@/components/ClassPreviewPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useMyTrainerProfile } from "@/hooks/useTrainers";

export default function CreateScheduledClassPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { data: trainerProfile } = useMyTrainerProfile();

  // Get initial data from URL params if present
  const initialData = {
    start_time: searchParams.get("time") || undefined,
    selected_days: searchParams.get("days")?.split(",") || undefined,
    start_date: searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined,
  };

  const clubId = trainerProfile?.trainer_clubs?.[0]?.club_id || "";
  const trainerProfileId = profile?.id || "";

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Crear clase programada</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura una nueva clase recurrente y visualiza cómo quedará en tiempo real
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ScheduledClassForm
          onClose={handleClose}
          clubId={clubId}
          trainerProfileId={trainerProfileId}
          initialData={initialData}
          showPreview={true}
          renderPreview={(data) => (
            <ClassPreviewPanel
              formData={data.formData}
              previewDates={data.previewDates}
              conflicts={data.conflicts}
              students={data.students}
              groups={data.groups}
              clubs={data.clubs}
              currentStep={data.currentStep}
            />
          )}
        />
      </div>
    </div>
  );
}
