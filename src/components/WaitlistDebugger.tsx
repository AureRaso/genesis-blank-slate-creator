import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bug } from "lucide-react";

const WaitlistDebugger = () => {
  const { profile } = useAuth();
  const [debugging, setDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDebug = async () => {
    if (!profile?.id) return;
    
    setDebugging(true);
    try {
      console.log("Current user profile ID:", profile.id);
      
      // 1. Verificar clases del trainer
      const { data: trainerClasses, error: classesError } = await supabase
        .from("programmed_classes")
        .select("*")
        .eq("created_by", profile.id)
        .eq("is_active", true);

      console.log("Trainer classes:", trainerClasses);

      // 2. Verificar TODAS las clases del club para comparar
      const { data: allClubClasses, error: clubClassesError } = await supabase
        .from("programmed_classes")
        .select("*, creator:profiles!created_by(full_name)")
        .eq("club_id", profile.club_id)
        .eq("is_active", true);

      console.log("All club classes:", allClubClasses);

      // 3. Verificar waitlists
      const { data: allWaitlists, error: waitlistError } = await supabase
        .from("waitlists")
        .select(`
          *,
          programmed_classes(name, created_by),
          profiles(full_name, email)
        `);

      console.log("All waitlists:", allWaitlists);

      // 4. Verificar waitlists específicas del trainer
      const classIds = trainerClasses?.map(c => c.id) || [];
      const trainerWaitlists = allWaitlists?.filter(w => classIds.includes(w.class_id)) || [];

      // 5. Verificar waitlists del club
      const clubClassIds = allClubClasses?.map(c => c.id) || [];
      const clubWaitlists = allWaitlists?.filter(w => clubClassIds.includes(w.class_id)) || [];

      console.log("Trainer waitlists:", trainerWaitlists);
      console.log("Club waitlists:", clubWaitlists);

      setDebugInfo({
        currentUserId: profile.id,
        trainerClasses: trainerClasses || [],
        allClubClasses: allClubClasses || [],
        allWaitlists: allWaitlists || [],
        trainerWaitlists,
        clubWaitlists,
        classIds,
        errors: {
          classesError,
          clubClassesError,
          waitlistError
        }
      });

    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setDebugging(false);
    }
  };

  if (!profile || profile.role !== 'trainer') {
    return null;
  }

  return (
    <Card className="border-dashed border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Bug className="h-5 w-5" />
          Debug - Lista de Espera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebug} 
          disabled={debugging}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {debugging ? "Verificando..." : "Verificar Lista de Espera"}
        </Button>

        {debugInfo && (
          <div className="space-y-3">
            <div className="text-xs bg-blue-50 p-2 rounded">
              <strong>Tu ID:</strong> {debugInfo.currentUserId}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Badge variant="outline">
                  Mis clases: {debugInfo.trainerClasses?.length || 0}
                </Badge>
              </div>
              <div>
                <Badge variant="outline">
                  Clases del club: {debugInfo.allClubClasses?.length || 0}
                </Badge>
              </div>
              <div>
                <Badge variant="outline">
                  En lista de espera: {debugInfo.clubWaitlists?.length || 0}
                </Badge>
              </div>
            </div>

            {debugInfo.allClubClasses?.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Todas las clases del club:</p>
                {debugInfo.allClubClasses.map((cls: any) => (
                  <div key={cls.id} className="text-xs bg-muted p-2 rounded">
                    <strong>{cls.name}</strong> - Creado por: {cls.creator?.full_name || 'N/A'}
                    <br />
                    <span className="text-muted-foreground">ID: {cls.id}</span>
                    {cls.created_by === debugInfo.currentUserId && (
                      <Badge variant="default" className="ml-2 text-xs">Tuya</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {debugInfo.clubWaitlists?.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Lista de espera del club:</p>
                {debugInfo.clubWaitlists.map((waitlist: any) => (
                  <div key={waitlist.id} className="text-xs bg-orange-50 p-2 rounded">
                    <strong>{waitlist.profiles?.full_name}</strong> - {waitlist.programmed_classes?.name}
                    <br />
                    Posición: {waitlist.position}, Estado: {waitlist.status}
                    {waitlist.programmed_classes?.created_by === debugInfo.currentUserId && (
                      <Badge variant="default" className="ml-2 text-xs">Tu clase</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {debugInfo.error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                Error: {debugInfo.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WaitlistDebugger;