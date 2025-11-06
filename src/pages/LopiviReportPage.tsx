import { useNavigate, useSearchParams } from "react-router-dom";
import { LopiviReportForm } from "@/components/LopiviReportForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const LopiviReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('clubId');
  const [clubName, setClubName] = useState<string>("");

  useEffect(() => {
    const fetchClubName = async () => {
      if (!clubId) return;

      const { data, error } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single();

      if (!error && data) {
        setClubName(data.name);
      }
    };

    fetchClubName();
  }, [clubId]);

  if (!clubId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Club no especificado
          </h1>
          <p className="text-slate-600 mb-6">
            Debes acceder a este formulario desde un club específico.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <LopiviReportForm
          clubId={clubId}
          clubName={clubName}
          onSuccess={() => {
            setTimeout(() => navigate(-1), 2000);
          }}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

export default LopiviReportPage;
