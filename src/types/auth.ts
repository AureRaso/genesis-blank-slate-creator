
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'player' | 'trainer';
  level?: number;
  club_id?: string;
  created_at: string;
  updated_at: string;
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
