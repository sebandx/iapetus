// src/components/EventModal.tsx

import React, { useState, useEffect } from 'react';

// Define the properties the modal will accept
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, dateTime: Date, duration: number, eventId: string | null) => void;
  onDelete: (eventId: string) => void;
  existingEvent: { id: string; title: string; start: Date; } | null;
  selectedDate: Date | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, existingEvent, selectedDate }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState(60);

  // This hook now correctly sets the time when the modal opens.
  useEffect(() => {
    if (isOpen) {
        if (existingEvent) {
            // If we are editing, populate the form with the event's data
            setTitle(existingEvent.title);
            const startTime = new Date(existingEvent.start);
            const hours = startTime.getHours().toString().padStart(2, '0');
            const minutes = startTime.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
            // You can add logic to calculate and set duration if needed
        } else if (selectedDate) {
            // --- THIS IS THE FIX ---
            // If creating a new event, use the time from the clicked date slot
            setTitle('');
            const clickedTime = new Date(selectedDate);
            const hours = clickedTime.getHours().toString().padStart(2, '0');
            const minutes = clickedTime.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
            setDuration(60);
        }
    }
  }, [existingEvent, selectedDate, isOpen]);


  if (!isOpen) return null;

  const handleSave = () => {
    const dateToUse = existingEvent ? existingEvent.start : selectedDate;
    if (title.trim() && dateToUse) {
      const [hours, minutes] = time.split(':').map(Number);
      const combinedDateTime = new Date(dateToUse);
      combinedDateTime.setHours(hours, minutes, 0, 0);

      onSave(title, combinedDateTime, duration, existingEvent ? existingEvent.id : null);
      onClose();
    } else {
      alert('Please enter an event title.');
    }
  };
  
  const handleDelete = () => {
    if (existingEvent && window.confirm('Are you sure you want to delete this event?')) {
        onDelete(existingEvent.id);
        onClose();
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    overlay: { zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    header: { marginBottom: '20px' },
    input: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
    label: { marginBottom: '5px', display: 'block', textAlign: 'left', fontSize: '14px', fontWeight: 500 },
    buttonContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '20px' },
    button: { padding: '10px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    saveButton: { backgroundColor: '#4F46E5', color: 'white' },
    cancelButton: { backgroundColor: '#E5E7EB' },
    deleteButton: { backgroundColor: '#EF4444', color: 'white' },
  };
  
  const dateForDisplay = existingEvent ? existingEvent.start : selectedDate;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
            <h2>{existingEvent ? 'Edit Study Event' : 'Add New Study Event'}</h2>
            {dateForDisplay && <p>Date: {dateForDisplay.toLocaleDateString()}</p>}
        </div>
        <div>
          <label style={styles.label} htmlFor="event-title">Event Title</label>
          <input id="event-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...styles.input, marginBottom: '20px' }} />
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
            <div style={{width: '50%'}}>
              <label style={styles.label} htmlFor="event-time">Start Time</label>
              <input id="event-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input} />
            </div>
            <div style={{width: '50%'}}>
              <label style={styles.label} htmlFor="event-duration">Duration (minutes)</label>
              <input id="event-duration" type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} style={styles.input} min="1" />
            </div>
        </div>
        <div style={styles.buttonContainer}>
            <div>
                {existingEvent && <button onClick={handleDelete} style={{...styles.button, ...styles.deleteButton}}>Delete</button>}
            </div>
            <div>
                <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
                <button onClick={handleSave} style={{...styles.button, ...styles.saveButton, marginLeft: '10px'}}>{existingEvent ? 'Update Event' : 'Save Event'}</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
