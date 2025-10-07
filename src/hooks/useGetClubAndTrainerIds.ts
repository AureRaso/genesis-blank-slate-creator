import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGetClubAndTrainerIds = () => {
  const [data, setData] = useState<{
    club: { id: string; name: string } | null;
    trainer: { profile_id: string; full_name: string; trainer_id: string } | null;
  }>({ club: null, trainer: null });

  useEffect(() => {
    const fetchData = async () => {
      // Get club
      const { data: clubData } = await supabase
        .from("clubs")
        .select("id, name")
        .ilike("name", "%Iron X Deluxe%")
        .single();

      // Get trainer
      const { data: trainerData } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          trainers!inner(id)
        `)
        .ilike("full_name", "%Iron Trainer 3%")
        .single();

      console.log("Club data:", clubData);
      console.log("Trainer data:", trainerData);

      setData({
        club: clubData,
        trainer: trainerData ? {
          profile_id: trainerData.id,
          full_name: trainerData.full_name,
          trainer_id: (trainerData.trainers as any)?.[0]?.id || (trainerData.trainers as any)?.id
        } : null
      });
    };

    fetchData();
  }, []);

  return data;
};
