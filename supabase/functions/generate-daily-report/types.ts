export interface ClassWithGaps {
  id: string;
  name: string;
  time: string;
  trainer_name: string;
  current_participants: number;
  max_participants: number;
  gaps: number;
  rejections?: Array<{
    student_name: string;
    reason?: string;
  }>;
}

export interface WaitlistEntry {
  student_name: string;
  class_name: string;
  class_time: string;
  day_of_week: string;
  hours_waiting: number;
  days_waiting: number;
}

export interface DailyReportData {
  club_id: string;
  club_name: string;
  report_date: string;
  report_type: 'morning' | 'afternoon';
  trainer_name: string;

  // Metrics
  response_rate: number; // Percentage of students who responded
  total_students_notified: number;
  total_responses: number;

  // Classes
  classes_with_gaps: ClassWithGaps[];

  // Waitlist
  waitlist: WaitlistEntry[];

  // Suggestions
  urgent_actions: string[];
}

export interface WhatsAppMessage {
  to: string; // Phone number or group ID
  message: string;
  format: 'text' | 'markdown';
}
