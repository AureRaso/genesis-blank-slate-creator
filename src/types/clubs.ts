
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
  lopivi_delegate_name?: string;
  lopivi_delegate_email?: string;
  lopivi_delegate_phone?: string;
  lopivi_delegate_updated_at?: string;
  enable_ejercicios?: boolean;
  override_subscription_plan_id?: string;
  // Billing/fiscal fields for Holded integration
  legal_name?: string;
  tax_id?: string;
  legal_entity_type?: string;
  billing_email?: string;
  billing_address?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_province?: string;
  billing_country?: string;
  holded_contact_id?: string;
  vat_number?: string;
}

export interface CreateClubData {
  name: string;
  address: string;
  phone: string;
  court_count: number;
  court_types: string[];
  description?: string;
  lopivi_delegate_name?: string;
  lopivi_delegate_email?: string;
  lopivi_delegate_phone?: string;
}

export const COURT_TYPES = [
  'indoor',
  'outdoor',
  'panorámicas',
  'muro',
  'cristal'
] as const;

export type CourtType = typeof COURT_TYPES[number];
