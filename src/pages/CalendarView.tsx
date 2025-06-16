// src/pages/CalendarView.tsx

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import { type EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list'; // --- NEW: Import the list view plugin ---
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
  const { currentUser, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dataLoading, setDataLoading] = useState(true);

  // ... (useEffect hooks and handlers remain the same) ...
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (!currentUser) return;
    const fetchCourses = async () => { /* ... */ };
    fetchCourses();
  }, [currentUser]);
  useEffect(() => {
    if (!currentUser) { setDataLoading(false); return; };
    setDataLoading(true);
    const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
    const unsubscribe = onSnapshot(calendarCollectionRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ /* ... */ }));
      setEvents(fetchedEvents);
      setDataLoading(false);
    }, (error) => { setDataLoading(false); });
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
        extendedProps: {
            courseId: clickInfo.event.extendedProps.courseId
        }
    });
    setIsModalOpen(true);
  };
  const handleModalClose = () => { /* ... */ };
  const handleSaveEvent = async (title: string, startTime: Date, duration: number, courseId: string, eventId: string | null) => { /* ... */ };
  const handleDeleteEvent = async (eventId: string) => { /* ... */ };


  if (authLoading || dataLoading) {
    return <div>Loading Calendar...</div>
  }

  return (
    <div>
      <style>{`
        /* General Styles */
        .fc-event { cursor: pointer; }
        .fc .fc-button-primary { background-color: #4F46E5; border-color: #4F46E5; }
        .fc .fc-daygrid-day.fc-day-today { background-color: #EEF2FF; }
        .fc-event { background-color: #6366F1; border-color: #4F46E5; }
        .fc .fc-timegrid-now-indicator-line { border-color: #EF4444; }
        .fc .fc-timegrid-now-indicator-arrow { border-top-color: #EF4444; }
        
        /* --- NEW: Mobile List View Styles --- */
        .fc-list-event-title a {
          color: #111827; /* Make event title more readable */
          text-decoration: none;
        }
        .fc-list-day-text, .fc-list-day-side-text {
          font-weight: 600;
          font-size: 1.1rem;
        }
        .fc-list-event:hover td {
          background-color: #F9FAFB;
        }

        @media (max-width: 767px) {
          .fc-header-toolbar {
            flex-direction: column;
            gap: 10px;
          }
          .fc .fc-toolbar-title {
            font-size: 1.25em;
          }
        }
      `}</style>
      <h1>Calendar</h1>
      <p>Click on a date to add a new study event, or click an existing event to edit or delete it.</p>
      
      <FullCalendar
        key={isMobile ? 'mobile' : 'desktop'}
        // --- UPDATED --- Add the listPlugin
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        headerToolbar={isMobile ? {
            left: 'prev,next',
            center: 'title',
            right: 'today'
          } : {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek' // Add listWeek to desktop view
        }}
        // --- UPDATED --- Default to listWeek on mobile
        initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
        nowIndicator={true}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
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
