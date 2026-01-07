'use client';

import { format } from 'date-fns';

interface EventListProps {
  date: Date;
  events: any[];
  onEventClick: (event: any) => void;
}

export function EventList({ date, events, onEventClick }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No events scheduled for this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => onEventClick(event)}
          className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-md cursor-pointer transition-all"
        >
          <h3 className="font-semibold text-brown-800">{event.title}</h3>
          {event.artistName && (
            <p className="text-sm text-brown-600 mt-1">Artist: {event.artistName}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {format(new Date(event.startDate), 'h:mm a')}
            {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
          </p>
        </div>
      ))}
    </div>
  );
}

