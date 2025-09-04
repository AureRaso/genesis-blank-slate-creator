import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getClassColor } from '@/utils/trainerColors';
import { useAuth } from '@/contexts/AuthContext';

interface MultiEventDropdownProps {
  children: React.ReactNode;
  allEvents: any[];
  onEventClick?: (event: any) => void;
  onEventDragStart?: (event: React.DragEvent, eventId: string) => void;
}

export function MultiEventDropdown({ 
  children, 
  allEvents, 
  onEventClick,
  onEventDragStart 
}: MultiEventDropdownProps) {
  const { user, isAdmin, isTrainer } = useAuth();

  if (allEvents.length <= 1) {
    return <>{children}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-2 max-h-96 overflow-y-auto" 
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            {allEvents.length} clases programadas
          </h4>
          {allEvents.map((event, index) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${
                getClassColor(event.created_by, event.trainer_id, user?.id)
              }`}
              onClick={() => onEventClick?.(event)}
              draggable={isAdmin || isTrainer}
              onDragStart={(e) => onEventDragStart?.(e, event.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm truncate pr-2">
                  {event.name}
                </h5>
                {event.trainer?.name && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {event.trainer.name}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(`2000-01-01T${event.start_time}`), 'HH:mm')} - 
                    {format(new Date(`2000-01-01T${event.end_time}`), 'HH:mm')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{event.enrolled_count || 0}/{event.max_students}</span>
                </div>
              </div>

              {event.level && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {event.level}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}