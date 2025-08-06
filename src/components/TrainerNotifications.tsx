import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Users, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifyWaitlist } from "@/hooks/useWaitlist";

interface WaitlistNotification {
  id: string;
  class_id: string;
  user_id: string;
  position: number;
  joined_at: string;
  programmed_classes: {
    name: string;
    start_time: string;
    days_of_week: string[];
    max_participants: number;
  };
  profiles: {
    full_name: string;
    email: string;
  };
}

const TrainerNotifications = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<WaitlistNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const notifyWaitlist = useNotifyWaitlist();

  const fetchWaitlistNotifications = async () => {
    if (!profile?.id) return;

    try {
      // Primero, obtener las clases del trainer
      const { data: trainerClasses, error: classesError } = await supabase
        .from("programmed_classes")
        .select("id")
        .eq("created_by", profile.id)
        .eq("is_active", true);

      if (classesError) throw classesError;

      if (!trainerClasses || trainerClasses.length === 0) {
        setNotifications([]);
        return;
      }

      const classIds = trainerClasses.map(c => c.id);

      // Luego, obtener las listas de espera para esas clases con datos básicos
      const { data: classesWithWaitlist, error } = await supabase
        .from("waitlists")
        .select("*")
        .eq("status", "waiting")
        .in("class_id", classIds)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      if (!classesWithWaitlist || classesWithWaitlist.length === 0) {
        setNotifications([]);
        return;
      }

      // Obtener datos adicionales por separado
      const userIds = classesWithWaitlist.map(w => w.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Combinar datos manualmente
      const enrichedWaitlist = classesWithWaitlist.map(waitlist => {
        const classInfo = trainerClasses.find(c => c.id === waitlist.class_id);
        const userProfile = profiles?.find(p => p.id === waitlist.user_id);
        
        return {
          ...waitlist,
          programmed_classes: classInfo,
          profiles: userProfile
        };
      });

      console.log("Waitlist notifications found:", enrichedWaitlist);
      setNotifications(enrichedWaitlist as any);
    } catch (error) {
      console.error("Error fetching waitlist notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlistNotifications();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('waitlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlists'
        },
        (payload) => {
          console.log("Waitlist change detected:", payload);
          fetchWaitlistNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleNotifyStudent = async (classId: string, studentName: string) => {
    try {
      await notifyWaitlist.mutateAsync({ classId, availableSpots: 1 });
      toast({
        title: "Estudiante notificado",
        description: `Se ha enviado una notificación a ${studentName}`,
      });
      fetchWaitlistNotifications();
    } catch (error) {
      console.error("Error notifying student:", error);
    }
  };

  const handleDismissNotification = async (waitlistId: string) => {
    try {
      const { error } = await supabase
        .from("waitlists")
        .update({ status: "skipped" })
        .eq("id", waitlistId);

      if (error) throw error;

      toast({
        title: "Notificación descartada",
        description: "El estudiante se mantendrá en lista de espera",
      });
      fetchWaitlistNotifications();
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const classId = notification.class_id;
    if (!acc[classId]) {
      acc[classId] = {
        classInfo: notification.programmed_classes,
        students: []
      };
    }
    acc[classId].students.push(notification);
    return acc;
  }, {} as Record<string, { classInfo: any; students: WaitlistNotification[] }>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Lista de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(groupedNotifications).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Lista de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No hay estudiantes en lista de espera para tus clases
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Lista de Espera
          </div>
          <Badge variant="outline">
            {notifications.length} estudiante{notifications.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedNotifications).map(([classId, { classInfo, students }]) => (
          <div key={classId} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{classInfo.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {classInfo.days_of_week.join(", ")} - {classInfo.start_time}
                </p>
              </div>
              <Badge variant="secondary">
                {students.length} esperando
              </Badge>
            </div>

            <div className="space-y-2">
              {students.slice(0, 3).map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {student.position}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{student.profiles.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(student.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleNotifyStudent(classId, student.profiles.full_name)}
                      disabled={notifyWaitlist.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissNotification(student.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {students.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{students.length - 3} más en lista de espera
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TrainerNotifications;