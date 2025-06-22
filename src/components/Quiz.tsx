// src/components/Quiz.tsx

import React from 'react';

interface QuizData {
  question: string;
  options: string[];
  answer: string;
}

interface QuizProps {
  data: QuizData;
  userAnswer?: string; // The user's saved answer, if it exists
  isSubmitted: boolean;
  onSelectOption: (option: string) => void;
}

const Quiz: React.FC<QuizProps> = ({ data, userAnswer, isSubmitted, onSelectOption }) => {

  const getOptionStyle = (option: string) => {
    const baseStyle = { padding: '12px', border: '1px solid #D1D5DB', borderRadius: '6px', transition: 'all 0.2s', cursor: isSubmitted ? 'default' : 'pointer' };
    
    if (!isSubmitted) {
      return userAnswer === option ? { ...baseStyle, borderColor: '#4F46E5', backgroundColor: '#EEF2FF', fontWeight: 'bold' } : baseStyle;
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
          <div key={index} onClick={() => !isSubmitted && onSelectOption(option)} style={getOptionStyle(option)}>
            {option}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quiz;
