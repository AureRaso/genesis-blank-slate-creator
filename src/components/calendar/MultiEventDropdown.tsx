import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClassCard } from './ClassCard';
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3 max-h-96 overflow-y-auto bg-background border shadow-lg" 
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