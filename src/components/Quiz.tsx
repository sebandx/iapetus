// src/components/Quiz.tsx

import React, { useState, useEffect } from 'react';

interface QuizData {
  question: string;
  options: string[];
  answer: string;
}

// NEW: Define the shape of a quiz result
interface QuizResult {
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizProps {
  data: QuizData;
  result?: QuizResult; // The saved result, if it exists
  onSubmit: (result: QuizResult) => void; // Function to save the result
}

const Quiz: React.FC<QuizProps> = ({ data, result, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // If a result already exists, initialize the component in a submitted state
  useEffect(() => {
    if (result) {
      setSelectedOption(result.userAnswer);
      setIsSubmitted(true);
    }
  }, [result]);

  const handleSubmit = () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === data.answer;
    setIsSubmitted(true);
    onSubmit({ userAnswer: selectedOption, isCorrect });
  };

  const getOptionStyle = (option: string) => {
    const baseStyle = { ...styles.option, cursor: isSubmitted ? 'default' : 'pointer' };
    if (!isSubmitted) {
      return selectedOption === option ? { ...baseStyle, ...styles.selectedOption } : baseStyle;
    }
    // After submission, show correct/incorrect styles
    if (option === data.answer) {
      return { ...baseStyle, ...styles.correctOption };
    }
    if (option === selectedOption && option !== data.answer) {
      return { ...baseStyle, ...styles.incorrectOption };
    }
    return baseStyle;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    quizContainer: { padding: '20px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB' },
    question: { fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '20px' },
    optionsContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
    option: { padding: '12px', border: '1px solid #D1D5DB', borderRadius: '6px', transition: 'all 0.2s' },
    selectedOption: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF', fontWeight: 'bold' },
    correctOption: { backgroundColor: '#D1FAE5', borderColor: '#10B981', color: '#065F46', fontWeight: 'bold' },
    incorrectOption: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', color: '#991B1B', fontWeight: 'bold' },
    buttonContainer: { marginTop: '20px', textAlign: 'right' },
    button: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#4F46E5', color: 'white', cursor: 'pointer' },
    feedback: { marginTop: '15px', fontWeight: 600, fontSize: '1rem', padding: '10px', borderRadius: '6px' },
  };

  return (
    <div style={styles.quizContainer}>
      <p style={styles.question}>{data.question}</p>
      <div style={styles.optionsContainer}>
        {data.options.map((option, index) => (
          <div key={index} onClick={() => !isSubmitted && setSelectedOption(option)} style={getOptionStyle(option)}>
            {option}
          </div>
        ))}
      </div>
      <div style={styles.buttonContainer}>
        {!isSubmitted && <button onClick={handleSubmit} disabled={!selectedOption} style={styles.button}>Submit Answer</button>}
      </div>
      {isSubmitted && (
        <p style={{...styles.feedback, color: selectedOption === data.answer ? '#065F46' : '#991B1B', backgroundColor: selectedOption === data.answer ? '#D1FAE5' : '#FEE2E2'}}>
          {selectedOption === data.answer ? 'Correct!' : `Sorry, the correct answer was: "${data.answer}"`}
        </p>
      )}
    </div>
  );
};

export default Quiz;