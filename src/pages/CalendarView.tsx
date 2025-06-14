// src/pages/CalendarView.tsx

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import EventModal from '../components/EventModal';

interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
}

const CalendarView = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
        };
      });
      setEvents(fetchedEvents);
    });

    return () => unsubscribe();
  }, [currentUser]);


  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(arg.date);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (title: string, startTime: Date, duration: number) => {
    if (!currentUser) return;

    const endTime = new Date(startTime.getTime() + duration * 60000);

    try {
      const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
      await addDoc(calendarCollectionRef, {
        title: title,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Failed to save event.');
    }
  };

  return (
    <div>
      <style>{`
        .fc .fc-button-primary { 
          background-color: #4F46E5; 
          border-color: #4F46E5; 
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #EEF2FF;
        }
        .fc-event {
          background-color: #6366F1;
          border-color: #4F46E5;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-color: #EF4444; /* Make the 'now' line red */
        }
        .fc .fc-timegrid-now-indicator-arrow {
          border-top-color: #EF4444; /* Make the 'now' arrow red */
        }
      `}</style>
      <h1>Calendar</h1>
      <p>Click on a date to add a new study event, or switch to week/day view to see event times.</p>
      
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
        headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="timeGridWeek" // Changed default view to week
        nowIndicator={true} // Add the red line for the current time
        events={events}
        dateClick={handleDateClick}
        height="auto"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
      />

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;
