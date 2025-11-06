export interface WhatsAppReportGroup {
  id: string;
  club_id: string;
  group_name: string;
  whatsapp_group_id: string;
  is_active: boolean;

  // Report configuration
  send_morning_report: boolean;
  send_afternoon_report: boolean;
  morning_report_time: string;
  afternoon_report_time: string;
  timezone: string;

  created_at: string;
  updated_at: string;
}

export interface CreateWhatsAppReportGroup {
  club_id: string;
  group_name: string;
  whatsapp_group_id: string;
  is_active?: boolean;
  send_morning_report?: boolean;
  send_afternoon_report?: boolean;
  morning_report_time?: string;
  afternoon_report_time?: string;
}

export interface DailyReportLog {
  id: string;
  club_id: string;
  whatsapp_group_id: string;
  report_type: 'morning' | 'afternoon';
  report_date: string;
  sent_at: string;
  report_data: any;
  message_sent: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  created_at: string;
}
