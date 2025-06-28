
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const PermissionCard = () => {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-800 flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          Límite de partidos alcanzado
        </CardTitle>
        <CardDescription className="text-amber-700">
          Solo puedes crear un partido por semana. Ya has utilizado tu partido de esta semana.
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default PermissionCard;
