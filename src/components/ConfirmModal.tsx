// src/components/ConfirmModal.tsx

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ExclamationIcon = () => (
    <div style={{ backgroundColor: '#FEE2E2', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
        </svg>
    </div>
);

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const styles: { [key: string]: React.CSSProperties } = {
    overlay: { zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', textAlign: 'center' },
    title: { marginTop: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' },
    message: { color: '#6B7280', marginBottom: '25px' },
    buttonContainer: { display: 'flex', justifyContent: 'center', gap: '15px' },
    button: { padding: '10px 20px', borderRadius: '6px', border: '1px solid transparent', cursor: 'pointer', fontWeight: 500 },
    confirmButton: { backgroundColor: '#DC2626', color: 'white' },
    cancelButton: { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <ExclamationIcon />
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonContainer}>
          <button onClick={onClose} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
          <button onClick={onConfirm} style={{...styles.button, ...styles.confirmButton}}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
