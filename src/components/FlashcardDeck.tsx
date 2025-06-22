// src/components/FlashcardDeck.tsx

import React, { useState, useMemo } from 'react';
import Flashcard from './Flashcard';

interface Card {
  question: string;
  answer: string;
}

interface FlashcardDeckProps {
  cards: Card[];
}

const ArrowLeftIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>;
const ArrowRightIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>;

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    // If at the first card, wrap around to the last card, otherwise go back one.
    const newIndex = currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    // If at the last card, wrap around to the first card, otherwise go forward one.
    const newIndex = currentIndex === cards.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);

  const styles: { [key: string]: React.CSSProperties } = {
    deckContainer: {
      padding: '15px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      backgroundColor: '#F9FAFB',
    },
    navigation: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '15px',
    },
    arrowButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#4F46E5',
      padding: '5px'
    },
    progressIndicator: {
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#6B7280',
    }
  };

  return (
    <div style={styles.deckContainer}>
      <Flashcard
        key={currentIndex} // Adding a key forces a re-render to reset the flip state
        question={currentCard.question}
        answer={currentCard.answer}
      />
      <div style={styles.navigation}>
        <button onClick={goToPrevious} style={styles.arrowButton} aria-label="Previous card">
          <ArrowLeftIcon />
        </button>
        <span style={styles.progressIndicator}>
          Card {currentIndex + 1} of {cards.length}
        </span>
        <button onClick={goToNext} style={styles.arrowButton} aria-label="Next card">
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;