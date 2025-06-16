// src/components/Flashcard.tsx

import React, { useState } from 'react';

interface FlashcardProps {
  question: string;
  answer: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ question, answer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const styles = {
    cardContainer: {
      perspective: '1000px',
      marginBottom: '15px',
      minHeight: '150px',
    },
    card: {
      width: '100%',
      height: '100%',
      minHeight: '150px',
      position: 'relative',
      transformStyle: 'preserve-3d',
      transition: 'transform 0.6s',
      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      cursor: 'pointer',
    },
    cardFace: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center' as const,
    },
    cardFront: {
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
      color: '#1F2937',
    },
    cardBack: {
      backgroundColor: '#EEF2FF',
      border: '1px solid #C7D2FE',
      color: '#4338CA',
      transform: 'rotateY(180deg)',
    },
  };

  return (
    <div style={styles.cardContainer} onClick={() => setIsFlipped(!isFlipped)}>
      <div style={styles.card}>
        <div style={{ ...styles.cardFace, ...styles.cardFront }}>
          <p>{question}</p>
        </div>
        <div style={{ ...styles.cardFace, ...styles.cardBack }}>
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
