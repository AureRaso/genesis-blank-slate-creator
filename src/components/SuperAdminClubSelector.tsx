import { useAuth } from '@/contexts/AuthContext';
import { Building2, ChevronDown, LayoutGrid } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SuperAdminClubSelectorProps {
  compact?: boolean; // For mobile header - smaller, different styling
}

/**
 * Club selector for superadmin users.
 * Allows switching between assigned clubs.
 * Only renders if the user is a superadmin with multiple clubs.
 */
export function SuperAdminClubSelector({ compact = false }: SuperAdminClubSelectorProps) {
  const { isSuperAdmin, superAdminClubs, selectedClubId, setSelectedClubId } = useAuth();
  const { t } = useTranslation();

  // Don't render if not superadmin or no clubs assigned
  if (!isSuperAdmin || superAdminClubs.length === 0) {
    return null;
  }

  const selectedClub = superAdminClubs.find(c => c.id === selectedClubId);
  const isAllClubsSelected = selectedClubId === null;

  // If only one club, show it without dropdown (no need for "all clubs" option)
  if (superAdminClubs.length === 1) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1">
          <Building2 className="h-4 w-4 text-blue-400" />
          <span className="text-xs text-white font-medium truncate max-w-[100px]">
            {superAdminClubs[0].name}
          </span>
        </div>
      );
    }
    return (
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">{superAdminClubs[0].name}</span>
        </div>
      </div>
    );
  }

  // Compact mode for mobile header
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 gap-1 hover:bg-white/10"
          >
            {isAllClubsSelected ? (
              <LayoutGrid className="h-4 w-4 text-purple-400" />
            ) : (
              <Building2 className="h-4 w-4 text-blue-400" />
            )}
            <span className="text-xs text-white font-medium truncate max-w-[100px]">
              {isAllClubsSelected
                ? t('superadmin.allClubs', 'Todos')
                : (selectedClub?.name || '...')
              }
            </span>
            <ChevronDown className="h-3 w-3 text-white/70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => setSelectedClubId(null)}
            className={isAllClubsSelected ? 'bg-accent' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-2 text-purple-600" />
            {t('superadmin.allClubs', 'Todos los clubes')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {superAdminClubs.map((club) => (
            <DropdownMenuItem
              key={club.id}
              onClick={() => setSelectedClubId(club.id)}
              className={selectedClubId === club.id ? 'bg-accent' : ''}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {club.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-2 px-2 hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2">
              {isAllClubsSelected ? (
                <LayoutGrid className="h-4 w-4 text-purple-600" />
              ) : (
                <Building2 className="h-4 w-4 text-blue-600" />
              )}
              <span className="font-semibold text-sm truncate">
                {isAllClubsSelected
                  ? t('superadmin.allClubs', 'Todos los clubes')
                  : (selectedClub?.name || t('superadmin.selectClub', 'Seleccionar club'))
                }
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* All clubs option */}
          <DropdownMenuItem
            onClick={() => setSelectedClubId(null)}
            className={isAllClubsSelected ? 'bg-accent' : ''}
          >
            <LayoutGrid className="h-4 w-4 mr-2 text-purple-600" />
            {t('superadmin.allClubs', 'Todos los clubes')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Individual clubs */}
          {superAdminClubs.map((club) => (
            <DropdownMenuItem
              key={club.id}
              onClick={() => setSelectedClubId(club.id)}
              className={selectedClubId === club.id ? 'bg-accent' : ''}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {club.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default SuperAdminClubSelector;
