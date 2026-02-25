
export type UserRole = 'owner' | 'superadmin' | 'admin' | 'trainer' | 'player' | 'guardian';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  level?: number;
  club_id?: string;
  birth_date?: string;
  shirt_size?: string;
  user_code: string;
  created_at: string;
  updated_at: string;
}

export interface AdminClub {
  id: string;
  admin_profile_id: string;
  club_id: string;
  created_at: string;
}

export interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, clubId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isPlayer: boolean;
  isTrainer: boolean;
}
