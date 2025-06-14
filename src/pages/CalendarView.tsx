// src/pages/CalendarView.tsx

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import EventModal from '../components/EventModal';

interface CalendarEvent {
  id?: string;
  title: string;
  start: Date | string;
}

const CalendarView = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Listen for real-time updates to calendar events
  useEffect(() => {
    if (!currentUser) return;

    const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
    
    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(calendarCollectionRef, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: (data.startTime as Timestamp).toDate(), // Convert Firestore Timestamp to Date
        };
      });
      setEvents(fetchedEvents);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [currentUser]);


  // Handle clicking on a date to open the modal
  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(arg.date);
    setIsModalOpen(true);
  };

  // Handle saving a new event from the modal
  const handleSaveEvent = async (title: string) => {
    if (!currentUser || !selectedDate) return;

    try {
      const calendarCollectionRef = collection(db, 'users', currentUser.uid, 'calendarEvents');
      await addDoc(calendarCollectionRef, {
        title: title,
        startTime: Timestamp.fromDate(selectedDate), // Store as Firestore Timestamp
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Failed to save event.');
    }
  };

  return (
    <div>
      <style>{`
        /* Custom FullCalendar styles */
        .fc .fc-button-primary { 
          background-color: #4F46E5; 
          border-color: #4F46E5; 
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #EEF2FF;
        }
      `}</style>
      <h1>Calendar</h1>
      <p>Click on a date to add a new study event.</p>
      
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        height="auto" // Adjusts height to content
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
