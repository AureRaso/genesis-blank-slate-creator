
export interface Club {
  id: string;
  name: string;
  address: string;
  phone: string;
  court_count: number;
  court_types: string[];
  description?: string;
  created_by_profile_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClubData {
  name: string;
  address: string;
  phone: string;
  court_count: number;
  court_types: string[];
  description?: string;
}

export const COURT_TYPES = [
  'indoor',
  'outdoor',
  'panorámicas',
  'muro',
  'cristal'
] as const;

export type CourtType = typeof COURT_TYPES[number];
