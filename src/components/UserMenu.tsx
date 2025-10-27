
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const UserMenu = () => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();

  if (!profile) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-playtomic-orange text-white';
      case 'trainer':
        return 'bg-playtomic-green text-white';
      default:
        return 'bg-playtomic-gray-100 text-playtomic-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'trainer':
        return 'Entrenador';
      case 'guardian':
        return 'Tutor';
      case 'owner':
        return 'Propietario';
      default:
        return 'Jugador';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-2 pl-2 pr-2 py-3 hover:bg-sidebar-accent/50 h-auto border-t border-sidebar-border rounded-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-sm font-semibold">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-sidebar-foreground">{profile.full_name}</span>
              <span className="text-xs text-sidebar-foreground/70">{getRoleText(profile.role)}</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="w-56 mb-2">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div>
            <p className="font-medium">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('userMenu.settings')}</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('userMenu.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
