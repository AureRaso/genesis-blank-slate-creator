import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIClassRequest {
  natural_language_input: string;
  club_id: string;
  available_students?: Array<{ id: string; name: string }>;
  available_trainers?: Array<{ id: string; name: string }>;
}

export interface ParsedClass {
  count: number;
  days_of_week: string[];
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  participant_names: string[];
  trainer_name?: string;
  level?: 'iniciacion' | 'intermedio' | 'avanzado';
  court_number?: number;
  monthly_price?: number;
  max_participants?: number;
  start_date?: string;
  end_date?: string;
  staggered_times?: boolean;
}

export interface AIClassResponse {
  success: boolean;
  parsed_data?: ParsedClass;
  club_info?: {
    id: string;
    name: string;
  };
  message?: string;
  error?: string;
}

export const useAIClassCreator = () => {
  return useMutation({
    mutationFn: async (request: AIClassRequest): Promise<AIClassResponse> => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('No hay sesión activa');

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-class-creator`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la solicitud');
      }

      const result: AIClassResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      return result;
    },
  });
};

export interface IntelligentBulkCreateRequest {
  classes: Array<{
    name: string;
    level_from: number;
    level_to: number;
    duration_minutes: number;
    start_time: string;
    days_of_week: string[];
    start_date: string;
    end_date: string;
    recurrence_type: string;
    trainer_profile_id: string;
    club_id: string;
    court_number: number;
    monthly_price: number;
    max_participants: number;
    participant_ids?: string[];
  }>;
  base_config: {
    name: string;
    start_date: string;
    end_date: string;
    duration_minutes: number;
  };
}

export interface BulkCreateResponse {
  success: boolean;
  message: string;
  summary: {
    total_requested: number;
    created_successfully: number;
    failed: number;
    success_rate: number;
  };
  successful_classes: Array<{
    class_id: string;
    name: string;
    court: number;
    day: string;
    time: string;
  }>;
  failed_classes: Array<{
    name: string;
    court: number;
    day: string;
    time: string;
    error: string;
  }>;
}

export const useIntelligentBulkCreateClasses = () => {
  return useMutation({
    mutationFn: async (request: IntelligentBulkCreateRequest): Promise<BulkCreateResponse> => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('No hay sesión activa');

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligent-bulk-create-classes`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear las clases');
      }

      const result: BulkCreateResponse = await response.json();
      return result;
    },
  });
};
