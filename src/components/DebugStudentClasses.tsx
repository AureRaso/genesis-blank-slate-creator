import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DebugStudentClasses = () => {
  const { profile } = useAuth();
  const [debugData, setDebugData] = useState<any>({});

  useEffect(() => {
    const debugQueries = async () => {
      if (!profile?.id) return;

      try {
        // 1. Check student enrollments
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select('*')
          .eq('created_by_profile_id', profile.id);

        console.log('Student enrollments:', enrollments, enrollmentError);

        if (enrollments?.length) {
          const enrollmentIds = enrollments.map(e => e.id);

          // 2. Check class participants
          const { data: participants, error: participantError } = await supabase
            .from('class_participants')
            .select(`
              *,
              programmed_class:programmed_classes(
                id,
                name,
                monthly_price
              )
            `)
            .in('student_enrollment_id', enrollmentIds);

          console.log('Class participants:', participants, participantError);

          // 3. Try to query class_subscriptions table
          let subscriptionsResult = null;
          let subscriptionsError = null;
          try {
            const result = await supabase
              .from('class_subscriptions')
              .select('*')
              .limit(1);
            subscriptionsResult = result.data;
            subscriptionsError = result.error;
          } catch (err) {
            subscriptionsError = err;
          }

          console.log('Subscriptions table check:', subscriptionsResult, subscriptionsError);

          setDebugData({
            enrollments,
            participants,
            enrollmentError,
            participantError,
            subscriptionsTableCheck: {
              data: subscriptionsResult,
              error: subscriptionsError?.message || null
            }
          });
        }
      } catch (error) {
        console.error('Debug error:', error);
        setDebugData({ error: error.message });
      }
    };

    debugQueries();
  }, [profile?.id]);

  if (!profile) return <div>No user profile</div>;
};

export default DebugStudentClasses;