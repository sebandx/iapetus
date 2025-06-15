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
  const [courses, setCourses] = useState<Course[]>([]); // State for courses
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // --- NEW --- Fetch courses when component mounts
  useEffect(() => {
    if (!currentUser) return;

    const fetchCourses = async () => {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch courses.');
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, [currentUser]);


  // Fetch calendar events
  useEffect(() => {
    if (!currentUser) return;
    const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
    const unsubscribe = onSnapshot(calendarCollectionRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: (data.startTime as Timestamp).toDate(),
          end: (data.endTime as Timestamp).toDate(),
          extendedProps: {
              courseId: data.courseId
          }
        }
      });
      setEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, [currentUser]);

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
  
  const handleSaveEvent = async (title: string, startTime: Date, duration: number, courseId: string, eventId: string | null) => {
    // ... save logic ...
  };
  
  // ... other handlers ...
  
  return (
    <div>
      {/* ... styles ... */}
      <h1>Calendar</h1>
      <p>Click on a date to add a new study event, or click an existing event to edit or delete it.</p>
      
      <FullCalendar
        // ... props ...
      />

      <EventModal
        // ... other props ...
        courses={courses} // Pass courses to the modal
      />
    </div>
  );
};

export default CalendarView;
