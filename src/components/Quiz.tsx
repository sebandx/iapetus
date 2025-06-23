// src/components/Quiz.tsx

import React from 'react';

interface QuizData {
  question: string;
  options: string[];
  answer: string;
}

interface QuizProps {
  data: QuizData;
  userAnswer?: string | null; // Allow null to represent no attempt
  isSubmitted: boolean;
  onSelectOption: (option: string) => void;
  taskType: 'pre-lecture' | 'post-lecture' | 'default'; 
}

const Quiz: React.FC<QuizProps> = ({ data, userAnswer, isSubmitted, onSelectOption, taskType }) => {

  const getOptionStyle = (option: string) => {
    const baseStyle: React.CSSProperties = { 
      padding: '12px', 
      border: '1px solid #D1D5DB', 
      borderRadius: '6px', 
      transition: 'all 0.2s', 
      cursor: isSubmitted ? 'default' : 'pointer' 
    };
    
    // If an answer has not been submitted for the current question
    if (!isSubmitted) {
      return userAnswer === option 
        ? { ...baseStyle, borderColor: '#4F46E5', backgroundColor: '#EEF2FF', fontWeight: 'bold' } 
        : baseStyle;
    }

    const isCorrect = option === data.answer;
    const isSelected = option === userAnswer;

    // For pre-lecture quizzes, we only show feedback on the selected answer.
    if (taskType === 'pre-lecture') {
        if (isSelected && isCorrect) {
            return { ...baseStyle, backgroundColor: '#D1FAE5', borderColor: '#10B981', color: '#065F46', fontWeight: 'bold' };
        }
        if (isSelected && !isCorrect) {
            return { ...baseStyle, backgroundColor: '#FEE2E2', borderColor: '#EF4444', color: '#991B1B', fontWeight: 'bold' };
        }
        return baseStyle; // Other options remain neutral
    }

    // For post-lecture quizzes, show both correct and incorrect answers after submission.
    if (isCorrect) {
      return { ...baseStyle, backgroundColor: '#D1FAE5', borderColor: '#10B981', color: '#065F46', fontWeight: 'bold' };
    }
    if (isSelected && !isCorrect) {
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
            onClick={() => onSelectOption(option)} 
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
