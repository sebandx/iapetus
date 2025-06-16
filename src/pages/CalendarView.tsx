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
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);

  // Effect to handle window resizing for responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to fetch courses
  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    }
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
        setLoading(false);
        return;
    };
    
    setLoading(true);
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
      setLoading(false); // Done loading once we get the first snapshot
    }, (error) => {
        console.error("Error fetching calendar events:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handlers for modal and events (no changes needed here)
  const handleDateClick = (arg: { date: Date }) => { /* ... */ };
  const handleEventClick = (clickInfo: EventClickArg) => { /* ... */ };
  const handleModalClose = () => { /* ... */ };
  const handleSaveEvent = async (title: string, startTime: Date, duration: number, courseId: string, eventId: string | null) => { /* ... */ };
  const handleDeleteEvent = async (eventId: string) => { /* ... */ };

  // --- JSX Rendering ---
  if (loading) {
    return <div>Loading Calendar...</div>
  }

  return (
    <div>
      <style>{`/* ... styles ... */`}</style>
      <h1>Calendar</h1>
      <p>Click on a date to add a new study event, or click an existing event to edit or delete it.</p>
      
      <FullCalendar
        key={isMobile ? 'mobile' : 'desktop'} // Force re-render on view change
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
