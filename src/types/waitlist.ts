export type WaitlistStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface ClassWaitlist {
  id: string;
  class_id: string;
  class_date: string;
  student_enrollment_id: string;
  requested_at: string;
  status: WaitlistStatus;
  accepted_by: string | null;
  accepted_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  student_enrollment?: {
    id: string;
    full_name: string;
    email: string;
    level?: number;
  };
  programmed_class?: {
    id: string;
    name: string;
    start_time: string;
    duration_minutes: number;
    max_participants: number;
  };
}

export interface WhatsAppGroup {
  id: string;
  club_id: string | null;
  trainer_profile_id: string | null;
  group_name: string;
  group_chat_id: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  club?: {
    id: string;
    name: string;
  };
  trainer?: {
    id: string;
    full_name: string;
  };
}
