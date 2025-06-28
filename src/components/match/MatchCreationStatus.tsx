
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { useCanCreateMatch } from "@/hooks/usePlayerMatchCreation";
import { useAuth } from "@/contexts/AuthContext";

const MatchCreationStatus = () => {
  const { profile } = useAuth();
  const { data: canCreate, isLoading } = useCanCreateMatch();

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm">Verificando estado...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (canCreate) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-800 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Puedes crear un partido
          </CardTitle>
          <CardDescription className="text-green-700">
            Tienes disponible tu partido semanal
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-800 flex items-center text-sm">
          <XCircle className="h-4 w-4 mr-2" />
          Límite semanal alcanzado
        </CardTitle>
        <CardDescription className="text-amber-700">
          Ya has creado tu partido de esta semana. Podrás crear otro el próximo lunes.
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default MatchCreationStatus;
