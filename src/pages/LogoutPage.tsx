
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";

const LogoutPage = () => {
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogOut className="h-6 w-6" />
            Cerrar Sesión
          </CardTitle>
          <CardDescription>
            {profile?.full_name && `Hola, ${profile.full_name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogout}
            className="w-full"
            variant="destructive"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoutPage;
