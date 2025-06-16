// src/components/EventModal.tsx

import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal'; // Import the new component

// Interfaces and other component code remain the same...
interface Course { id: string; name: string; code?: string; }
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, dateTime: Date, duration: number, courseId: string, eventId: string | null) => void;
  onDelete: (eventId: string) => void;
  existingEvent: { id: string; title: string; start: Date; extendedProps: { courseId?: string }; } | null;
  selectedDate: Date | null;
  courses: Course[];
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, existingEvent, selectedDate, courses }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('12:00');
  const [duration, setDuration] = useState(60);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    // ... useEffect logic remains the same ...
    if (isOpen) {
        if (existingEvent) {
            setTitle(existingEvent.title);
            const startTime = new Date(existingEvent.start);
            const hours = startTime.getHours().toString().padStart(2, '0');
            const minutes = startTime.getMinutes().toString().padStart(2, '0');
            setTime(`${hours}:${minutes}`);
            setSelectedCourseId(existingEvent.extendedProps.courseId || '');
        } else if (selectedDate) {
            // ... reset logic for new event ...
        }
    }
  }, [existingEvent, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => { /* ... save logic remains the same ... */ };
  
  const handleDeleteClick = () => {
    setIsConfirmModalOpen(true);
  };

  // This function is called when the user confirms the deletion
  const handleConfirmDelete = () => {
    if (existingEvent) {
      onDelete(existingEvent.id);
    }
    setIsConfirmModalOpen(false); // Close the confirm modal
    onClose(); // Close the main event modal
  };

  const styles: { [key: string]: React.CSSProperties } = { /* ... styles remain the same ... */ };
  const dateForDisplay = existingEvent ? existingEvent.start : selectedDate;

  return (
    <>
      <div style={{...styles.overlay, zIndex: 1000}} onClick={onClose}>
        <div style={{...styles.modal}} onClick={(e) => e.stopPropagation()}>
          {/* ... all the form JSX remains the same ... */}
          <div style={styles.buttonContainer}>
              <div>
                  {existingEvent && <button onClick={handleDeleteClick} style={{...styles.button, ...styles.deleteButton}}>Delete</button>}
              </div>
              <div>
                  <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
                  <button onClick={handleSave} style={{...styles.button, ...styles.saveButton, marginLeft: '10px'}}>{existingEvent ? 'Update Event' : 'Save Event'}</button>
              </div>
          </div>
        </div>
      </div>
      
      {/* --- NEW --- Render the confirmation modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event? This action cannot be undone."
      />
    </>
  );
};

export default EventModal;
