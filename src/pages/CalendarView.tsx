// src/pages/CalendarView.tsx

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { db } from '../firebase';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore'; // Removed addDoc
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

  // This useEffect for fetching events remains the same.
  // It will automatically update the UI when the backend writes to Firestore.
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

  // --- UPDATED LOGIC TO CALL THE BACKEND API ---
  const handleSaveEvent = async (title: string, startTime: Date, duration: number) => {
    if (!currentUser) {
        alert('You must be logged in to create an event.');
        return;
    }

    // Calculate end time
    const endTime = new Date(startTime.getTime() + duration * 60000);

    try {
        // 1. Get the Firebase ID token for the current user.
        const token = await currentUser.getIdToken();

        // 2. Send a POST request to your new backend endpoint.
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 3. Include the token in the Authorization header.
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                title,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            }),
        });

        if (!response.ok) {
            // If the server response is not OK, throw an error.
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save event.');
        }

        // The onSnapshot listener will handle UI updates automatically.
        
    } catch (error) {
      console.error("Error saving event via backend: ", error);
      alert(`Failed to save event: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        .fc-event {
          background-color: #6366F1;
          border-color: #4F46E5;
        }
        .fc .fc-timegrid-now-indicator-line {
          border-color: #EF4444;
        }
        .fc .fc-timegrid-now-indicator-arrow {
          border-top-color: #EF4444;
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
        initialView="timeGridWeek"
        nowIndicator={true}
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
