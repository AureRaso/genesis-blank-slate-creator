import { supabase } from "@/integrations/supabase/client";

export interface GhostMatchResult {
  enrollmentId: string;
  fullName: string;
  phone: string;
  clubId: string;
  clubName: string;
  className?: string;
  classTime?: string;
  classDays?: string[];
}

/**
 * Search for a ghost enrollment matching the given phone and club.
 * Uses an RPC with SECURITY DEFINER to bypass RLS, since newly registered
 * players don't have permission to SELECT ghost enrollments created by admins.
 */
export const findGhostMatch = async (
  phone: string,
  clubId: string
): Promise<GhostMatchResult | null> => {
  if (!phone || !clubId) return null;

  const { data, error } = await supabase.rpc("find_ghost_enrollment", {
    p_phone: phone,
    p_club_id: clubId,
  });

  if (error) {
    console.error("Error finding ghost match:", error);
    return null;
  }

  const ghost = Array.isArray(data) ? data[0] : data;
  if (!ghost) return null;

  return {
    enrollmentId: ghost.enrollment_id,
    fullName: ghost.full_name,
    phone: ghost.phone,
    clubId: ghost.club_id,
    clubName: ghost.club_name || '',
    className: ghost.class_name || undefined,
    classTime: ghost.class_start_time || undefined,
    classDays: ghost.class_days_of_week || undefined,
  };
};

/**
 * Claim a ghost enrollment: link it to the authenticated user's profile
 * and mark it as no longer a ghost.
 * Uses an RPC with SECURITY DEFINER to bypass RLS.
 */
export const claimGhostEnrollment = async (
  enrollmentId: string,
  userId: string,
  email?: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("claim_ghost_enrollment", {
    p_enrollment_id: enrollmentId,
    p_user_id: userId,
    p_email: email || null,
  });

  if (error) {
    console.error("Error claiming ghost enrollment:", error);
    return false;
  }

  return data === true;
};