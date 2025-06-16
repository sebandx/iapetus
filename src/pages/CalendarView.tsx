// src/pages/CalendarView.tsx

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import { type EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { db } from '../firebase';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import EventModal from '../components/EventModal';

// Interfaces
interface Course {
  id: string;
  name: string;
  code?: string;
}
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
      courseId?: string;
  }
}

const CalendarView = () => {
  const { currentUser, loading: authLoading } = useAuth(); // Use auth loading state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dataLoading, setDataLoading] = useState(true);

  // Effect to handle window resizing for responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to fetch courses
  useEffect(() => {
    if (!currentUser) return;
    const fetchCourses = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch courses.');
        setCourses(await response.json());
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, [currentUser]);

  // Effect to listen for real-time calendar event updates
  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false);
      return;
    };
    
    setDataLoading(true);
    const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
    const unsubscribe = onSnapshot(calendarCollectionRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: (data.startTime as Timestamp).toDate(),
          end: (data.endTime as Timestamp).toDate(),
          extendedProps: { courseId: data.courseId }
        }
      });
      setEvents(fetchedEvents);
      setDataLoading(false);
    }, (error) => {
        console.error("Error fetching calendar events:", error);
        setDataLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- THE FIX ---
  // Restore the logic to these handlers to open the modal.
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
      extendedProps: {
        courseId: clickInfo.event.extendedProps.courseId,
      },
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleSaveEvent = async (title: string, startTime: Date, duration: number, courseId: string, eventId: string | null) => {
    if (!currentUser) return;
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const eventData = { title, startTime: startTime.toISOString(), endTime: endTime.toISOString(), courseId: courseId || null };
    const token = await currentUser.getIdToken();
    const isUpdate = eventId !== null;
    const url = isUpdate ? `${import.meta.env.VITE_API_URL}/events/${eventId}` : `${import.meta.env.VITE_API_URL}/events`;
    const method = isUpdate ? 'PUT' : 'POST';
    try {
        await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(eventData) });
    } catch (error) { console.error("Error saving event:", error); }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser) return;
    try {
        const token = await currentUser.getIdToken();
        await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) { console.error("Error deleting event:", error); }
  };

  // --- JSX Rendering ---
  if (authLoading || dataLoading) {
    return <div>Loading Calendar...</div>
  }

  return (
    <div>
      <style>{`
        .fc-event { cursor: pointer; }
        .fc .fc-button-primary { background-color: #4F46E5; border-color: #4F46E5; }
        .fc .fc-daygrid-day.fc-day-today { background-color: #EEF2FF; }
        .fc-event { background-color: #6366F1; border-color: #4F46E5; }
        .fc .fc-timegrid-now-indicator-line { border-color: #EF4444; }
        .fc .fc-timegrid-now-indicator-arrow { border-top-color: #EF4444; }
        @media (max-width: 767px) {
          .fc-header-toolbar { flex-direction: column; gap: 10px; }
          .fc .fc-toolbar-title { font-size: 1.25em; }
          .fc-event-main-frame { font-size: 0.8rem; }
        }
      `}</style>
      <h1>Calendar</h1>
      <p>Click on a date to add a new study event, or click an existing event to edit or delete it.</p>
      
      <FullCalendar
        key={isMobile ? 'mobile' : 'desktop'}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={isMobile ? {
            left: 'prev,next',
            center: 'title',
            right: 'today'
          } : {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
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
        courses={courses}
      />
    </div>
  );
};

export default CalendarView;
