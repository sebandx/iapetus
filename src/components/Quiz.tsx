// src/components/Quiz.tsx

import React from 'react';

interface QuizData {
  question: string;
  options: string[];
  answer: string;
}

interface QuizProps {
  data: QuizData;
  userAnswer?: string; // The currently selected answer, passed from the parent
  isSubmitted: boolean;
  onSelectOption: (option: string) => void; // Function to notify the parent of a new selection
}

const Quiz: React.FC<QuizProps> = ({ data, userAnswer, isSubmitted, onSelectOption }) => {
  // This component is now "controlled". It has no internal state for the selected answer.
  // Its display is entirely determined by the props it receives.

  const getOptionStyle = (option: string) => {
    const baseStyle: React.CSSProperties = { 
      padding: '12px', 
      border: '1px solid #D1D5DB', 
      borderRadius: '6px', 
      transition: 'all 0.2s', 
      cursor: isSubmitted ? 'default' : 'pointer' 
    };
    
    // During selection phase
    if (!isSubmitted) {
      // Style is based on the userAnswer prop passed down from QuizDeck
      return userAnswer === option 
        ? { ...baseStyle, borderColor: '#4F46E5', backgroundColor: '#EEF2FF', fontWeight: 'bold' } 
        : baseStyle;
    }

    // After submission, show correct/incorrect styles
    if (option === data.answer) {
      return { ...baseStyle, backgroundColor: '#D1FAE5', borderColor: '#10B981', color: '#065F46', fontWeight: 'bold' };
    }
    if (option === userAnswer && option !== data.answer) {
      return { ...baseStyle, backgroundColor: '#FEE2E2', borderColor: '#EF4444', color: '#991B1B', fontWeight: 'bold' };
    }
    
    return baseStyle;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    question: { fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '20px', minHeight: '50px' },
    optionsContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  };

  return (
    <div>
      <p style={styles.question}>{data.question}</p>
      <div style={styles.optionsContainer}>
        {data.options.map((option, index) => (
          <div
            key={`${index}-${option === userAnswer}`} 
            onClick={() => !isSubmitted && onSelectOption(option)} 
            style={getOptionStyle(option)}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quiz;
