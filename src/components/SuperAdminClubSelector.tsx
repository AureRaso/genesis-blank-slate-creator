import { useAuth } from '@/contexts/AuthContext';
import { Building2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Club selector for superadmin users.
 * Allows switching between assigned clubs.
 * Only renders if the user is a superadmin with multiple clubs.
 */
export function SuperAdminClubSelector() {
  const { isSuperAdmin, superAdminClubs, selectedClubId, setSelectedClubId } = useAuth();

  // Don't render if not superadmin or no clubs assigned
  if (!isSuperAdmin || superAdminClubs.length === 0) {
    return null;
  }

  const selectedClub = superAdminClubs.find(c => c.id === selectedClubId);

  // If only one club, show it without dropdown
  if (superAdminClubs.length === 1) {
    return (
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">{superAdminClubs[0].name}</span>
        </div>
      </div>
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
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm truncate">
                {selectedClub?.name || 'Seleccionar club'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
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
