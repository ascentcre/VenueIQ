'use client';

import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Plus } from 'lucide-react';
import { EventModal } from './EventModal';
import type { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';

export function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedEvent(null);
    // Create a temporary event object with the selected date/time
    const tempEvent = {
      id: null,
      title: '',
      startDate: selectInfo.startStr,
      endDate: selectInfo.endStr,
    };
    setSelectedEvent(tempEvent);
    setIsModalOpen(true);
    selectInfo.view.calendar.unselect();
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    fetchEvents();
  };

  // Convert events to FullCalendar format
  const calendarEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    title: event.title || event.artistName || 'Untitled Event',
    start: event.startDate,
    end: event.endDate,
    backgroundColor: '#2d7f7f', // Teal color
    borderColor: '#236666',
    textColor: '#ffffff',
    extendedProps: {
      artistName: event.artistName,
      description: event.description,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-brown-800">Event Calendar</h2>
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading calendar...</div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            events={calendarEvents}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            eventClick={handleEventClick}
            select={handleDateSelect}
            height="auto"
            eventDisplay="block"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            slotMinTime="08:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={true}
            nowIndicator={true}
            locale="en"
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              list: 'List',
            }}
          />
        )}
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

