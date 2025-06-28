
import { Card, CardContent } from "@/components/ui/card";

const LoadingCard = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingCard;
