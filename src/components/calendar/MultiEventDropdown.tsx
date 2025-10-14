import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClassCard } from './ClassCard';
import { Badge } from '@/components/ui/badge';
import type { ScheduledClassWithTemplate } from '@/hooks/useScheduledClasses';
interface MultiEventDropdownProps {
  children: React.ReactNode;
  allEvents: ScheduledClassWithTemplate[];
  onEventClick?: (event: ScheduledClassWithTemplate) => void;
  onEventDragStart?: (event: React.DragEvent, eventId: string) => void;
}
export function MultiEventDropdown({
  children,
  allEvents,
  onEventClick,
  onEventDragStart
}: MultiEventDropdownProps) {
  if (allEvents.length <= 1) {
    return <>{children}</>;
  }

  // Obtener clubes únicos
  const uniqueClubs = Array.from(new Set(allEvents.map(event => event.club?.name).filter(Boolean)));

  // Extract short names for mobile view
  const getShortName = (name: string) => {
    const ironMatch = name.match(/iron\s*(\d+)/i);
    if (ironMatch) return `Iron ${ironMatch[1]}`;
    if (name.length > 10) return name.substring(0, 8) + '...';
    return name;
  };

  // Card indicadora personalizada
  const IndicatorCard = () => (
    <div className="relative group cursor-pointer w-full h-full">
      {/* Desktop version - original design */}
      <div className="hidden md:block bg-primary/10 border border-primary/20 rounded-lg p-3 hover:bg-primary/15 transition-colors h-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm text-foreground">
              {allEvents.length} clases
            </span>
            <div className="flex flex-wrap gap-1">
              {uniqueClubs.map(club => (
                <Badge key={club} variant="secondary" className="text-xs">
                  {club}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile version - compact stacked names */}
      <div className="md:hidden bg-primary/10 border border-primary/20 rounded px-0.5 hover:bg-primary/15 transition-colors h-full w-full flex flex-col items-center justify-start overflow-hidden py-0.5">
        <div className="text-[6px] font-bold text-primary mb-0.5 flex-shrink-0">
          {allEvents.length} clases
        </div>
        <div className="w-full flex-1 flex flex-col justify-start overflow-hidden gap-0.5">
          {allEvents.slice(0, 4).map((event, idx) => (
            <div key={event.id} className="text-[6px] font-medium truncate text-center leading-tight flex-shrink-0">
              {getShortName(event.name)}
            </div>
          ))}
          {allEvents.length > 4 && (
            <div className="text-[6px] text-muted-foreground text-center flex-shrink-0">
              +{allEvents.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return <Popover>
      <PopoverTrigger asChild>
        <div className="h-full w-full" onClick={() => console.log('MultiEventDropdown clicked with', allEvents.length, 'events')}>
          <IndicatorCard />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 max-h-96 overflow-y-auto bg-background border shadow-lg z-50" align="start" side="bottom" sideOffset={8}>
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            {allEvents.length} clases programadas
          </h4>
          <div className="space-y-2">
            {allEvents.map(event => <div key={event.id} className="w-full">
                <ClassCard class={event} isCompact={false} showAsIndicator={false} eventCount={1} />
              </div>)}
          </div>
        </div>
      </PopoverContent>
    </Popover>;
}