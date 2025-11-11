import { Card, CardContent } from "@/components/ui/card";
import { UserX } from "lucide-react";

interface DeletedUserMessageProps {
  clubName?: string;
}

/**
 * Component to display when a user has been deleted/deactivated from their club
 */
const DeletedUserMessage = ({ clubName }: DeletedUserMessageProps) => {
  return (
    <div className="min-h-screen overflow-y-auto flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <UserX className="h-10 w-10 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">
                Acceso Restringido
              </h2>
              <p className="text-lg font-semibold text-foreground">
                Has sido eliminado del club
              </p>
            </div>

            <div className="space-y-3 text-muted-foreground">
              <p>
                Lamentablemente, tu acceso a <strong>{clubName || 'este club'}</strong> ha sido revocado por el administrador.
              </p>
              <p>
                Ya no tienes acceso a las clases, reservas ni ninguna funcionalidad del club.
              </p>
              <p>
                Si crees que esto es un error, por favor contacta con el administrador del club para más información.
              </p>
            </div>

            
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeletedUserMessage;
