// src/components/EventModal.tsx

import React, { useState } from 'react';

// Define the properties the modal will accept
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  selectedDate: Date | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, selectedDate }) => {
  const [title, setTitle] = useState('');

  if (!isOpen || !selectedDate) return null;

  const handleSave = () => {
    if (title.trim()) {
      onSave(title);
      setTitle(''); // Reset title after saving
      onClose();   // Close modal after saving
    } else {
      alert('Please enter an event title.');
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      background: 'white',
      padding: '25px',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '500px',
    },
    header: {
        marginBottom: '20px'
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '20px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        boxSizing: 'border-box'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    button: {
        padding: '10px 20px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer'
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        color: 'white'
    },
    cancelButton: {
        backgroundColor: '#E5E7EB'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
            <h2>Add New Study Event</h2>
            <p>Date: {selectedDate.toLocaleDateString()}</p>
        </div>
        <input
          type="text"
          placeholder="Event Title (e.g., CS 135 Lecture)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <div style={styles.buttonContainer}>
            <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
            <button onClick={handleSave} style={{...styles.button, ...styles.saveButton}}>Save Event</button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
