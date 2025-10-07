import { useGetClubAndTrainerIds } from "@/hooks/useGetClubAndTrainerIds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GetIdsPage = () => {
  const { club, trainer } = useGetClubAndTrainerIds();

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>IDs para WhatsApp Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Club: Iron X Deluxe</h3>
            {club ? (
              <pre className="bg-gray-100 p-2 rounded mt-2">
                {JSON.stringify(club, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">Cargando...</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Trainer: Iron Trainer 3</h3>
            {trainer ? (
              <pre className="bg-gray-100 p-2 rounded mt-2">
                {JSON.stringify(trainer, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">Cargando...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GetIdsPage;
