import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkClassForm, BulkClassFormData } from "@/components/BulkClassForm";
import { BulkClassesPreviewPanel } from "@/components/BulkClassesPreviewPanel";

export default function CreateBulkClassesPage() {
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState<BulkClassFormData>({
    clubName: undefined,
    selectedCourtNumbers: [],
    selectedTrainerNames: [],
    baseConfig: {
      name: "",
      level_from: 1,
      level_to: 10,
      duration_minutes: 60,
      monthly_price: 50,
      max_participants: 4,
      start_date: "",
      end_date: "",
      first_class_date: "",
      first_class_time: "10:00"
    },
    multiplicationConfig: {
      days_of_week: [],
      time_slots: []
    },
    generatedClasses: [],
    step: 1
  });

  const handleSuccess = () => {
    navigate("/dashboard/scheduled-classes");
  };

  const handleDataChange = (data: BulkClassFormData) => {
    setPreviewData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-2 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/scheduled-classes")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Creación masiva inteligente</h1>
              <p className="text-sm text-muted-foreground">
                Crea múltiples clases de forma inteligente y eficiente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-2 py-6 max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Form - 3/5 width on large screens */}
          <div className="lg:col-span-3">
            <BulkClassForm
              onSuccess={handleSuccess}
              onDataChange={handleDataChange}
            />
          </div>

          {/* Preview Panel - 2/5 width on large screens, sticky */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <BulkClassesPreviewPanel
                clubName={previewData.clubName}
                selectedCourtNumbers={previewData.selectedCourtNumbers}
                selectedTrainerNames={previewData.selectedTrainerNames}
                baseConfig={previewData.baseConfig}
                multiplicationConfig={previewData.multiplicationConfig}
                generatedClassesCount={previewData.generatedClasses.length}
                generatedClassesPreview={previewData.generatedClasses.map(cls => ({
                  day_of_week: cls.day_of_week,
                  start_time: cls.start_time,
                  court_number: cls.court_number,
                  trainer_name: cls.trainer_name
                }))}
                step={previewData.step}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
