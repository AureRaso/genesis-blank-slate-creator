import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bug } from "lucide-react";
const WaitlistDebugger = () => {
  const {
    profile
  } = useAuth();
  const [debugging, setDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const runDebug = async () => {
    if (!profile?.id) return;
    setDebugging(true);
    try {
      console.log("Current user profile ID:", profile.id);

      // 1. Verificar clases del trainer
      const {
        data: trainerClasses,
        error: classesError
      } = await supabase.from("programmed_classes").select("*").eq("created_by", profile.id).eq("is_active", true);
      console.log("Trainer classes:", trainerClasses);

      // 2. Verificar TODAS las clases del club para comparar
      const {
        data: allClubClasses,
        error: clubClassesError
      } = await supabase.from("programmed_classes").select("*").eq("club_id", profile.club_id).eq("is_active", true);
      console.log("All club classes:", allClubClasses);

      // 3. Verificar waitlists básicas
      const {
        data: allWaitlists,
        error: waitlistError
      } = await supabase.from("waitlists").select("*").eq("status", "waiting");
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
      setDebugInfo({
        error: error.message
      });
    } finally {
      setDebugging(false);
    }
  };
  if (!profile || profile.role !== 'trainer') {
    return null;
  }
  return;
};
export default WaitlistDebugger;