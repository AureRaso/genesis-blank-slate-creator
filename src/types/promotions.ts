export interface Promotion {
  id: string;
  club_id: string;
  brand_name: string;
  description?: string;
  discount_code: string;
  link: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  clubs?: {
    name: string;
    status: string;
  };
}

export interface CreatePromotionData {
  club_id: string;
  brand_name: string;
  description?: string;
  discount_code: string;
  link: string;
}

export interface UpdatePromotionData {
  brand_name?: string;
  description?: string;
  discount_code?: string;
  link?: string;
}
