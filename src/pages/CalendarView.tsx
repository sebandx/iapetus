// src/pages/CalendarView.tsx

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
// --- THIS IS THE FIX ---
// Import the type directly from the core package
import { type EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { db } from '../firebase';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import EventModal from '../components/EventModal';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

const CalendarView = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
    const unsubscribe = onSnapshot(calendarCollectionRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        start: (doc.data().startTime as Timestamp).toDate(),
        end: (doc.data().endTime as Timestamp).toDate(),
      }));
      setEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(arg.date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
        id: clickInfo.event.id,
        title: clickInfo.event.title,
        start: clickInfo.event.start!,
        end: clickInfo.event.end!,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }

  const handleSaveEvent = async (title: string, startTime: Date, duration: number, eventId: string | null) => {
    if (!currentUser) return;

    const endTime = new Date(startTime.getTime() + duration * 60000);
    const eventData = { title, startTime: startTime.toISOString(), endTime: endTime.toISOString() };
    const token = await currentUser.getIdToken();
    
    const isUpdate = eventId !== null;
    const url = isUpdate ? `${import.meta.env.VITE_API_URL}/events/${eventId}` : `${import.meta.env.VITE_API_URL}/events`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save event.');
        }
    } catch (error) {
      console.error("Error saving event:", error);
      alert(`Failed to save event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser) return;
    
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete event.');
        }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      <style>{`
        .fc-event { cursor: pointer; }
        .fc .fc-button-primary { background-color: #4F46E5; border-color: #4F46E5; }
        .fc .fc-daygrid-day.fc-day-today { background-color: #EEF2FF; }
        .fc-event { background-color: #6366F1; border-color: #4F46E5; }
        .fc .fc-timegrid-now-indicator-line { border-color: #EF4444; }
        .fc .fc-timegrid-now-indicator-arrow { border-top-color: #EF4444; }
      `}</style>
      <h1>Calendar</h1>
      <p>Click on a date to add a new event, or click an existing event to edit or delete it.</p>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        initialView="timeGridWeek"
        nowIndicator={true}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        existingEvent={selectedEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;
