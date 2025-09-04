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

  // Card indicadora personalizada
  const IndicatorCard = () => (
    <div className="relative group cursor-pointer">
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 hover:bg-primary/15 transition-colors">
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
          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
            {allEvents.length}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div onClick={() => console.log('MultiEventDropdown clicked with', allEvents.length, 'events')}>
          <IndicatorCard />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3 max-h-96 overflow-y-auto bg-background border shadow-lg z-50" 
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            {allEvents.length} clases programadas
          </h4>
          <div className="space-y-2">
            {allEvents.map((event) => (
              <div key={event.id} className="w-full">
                <ClassCard 
                  class={event}
                  isCompact={false}
                  showAsIndicator={false}
                  eventCount={1}
                />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}