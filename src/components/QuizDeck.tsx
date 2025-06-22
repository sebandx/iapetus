// src/components/QuizDeck.tsx

import React, { useState } from 'react';
import Quiz from './Quiz';

interface QuizData {
  question: string;
  options: string[];
  answer: string;
}

interface QuizDeckProps {
  quizzes: QuizData[];
  existingResult?: { [key: string]: { userAnswer: string; isCorrect: boolean } };
  onSubmit: (results: { [key: string]: { userAnswer: string; isCorrect: boolean } }) => void;
}

const ArrowLeftIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>;
const ArrowRightIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>;

const QuizDeck: React.FC<QuizDeckProps> = ({ quizzes, existingResult, onSubmit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(!!existingResult);

  const handleSelectOption = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const handleSubmit = () => {
    const results: { [key: string]: { userAnswer: string; isCorrect: boolean } } = {};
    quizzes.forEach((quiz, index) => {
      const question = quiz.question;
      const userAnswer = answers[index];
      results[question] = { userAnswer, isCorrect: userAnswer === quiz.answer };
    });
    setIsSubmitted(true);
    onSubmit(results);
  };
  
  const calculateScore = () => {
      if(!existingResult) return 0;
      return Object.values(existingResult).filter(r => r.isCorrect).length;
  }

  const styles: { [key: string]: React.CSSProperties } = {
    deckContainer: { padding: '15px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB' },
    navigation: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' },
    arrowButton: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: '5px' },
    progressIndicator: { fontSize: '0.9rem', fontWeight: 500, color: '#6B7280' },
    submitButton: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#10B981', color: 'white', cursor: 'pointer' },
    score: { textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#065F46', marginTop: '20px' }
  };

  return (
    <div style={styles.deckContainer}>
      <Quiz
        data={quizzes[currentIndex]}
        userAnswer={existingResult ? existingResult[quizzes[currentIndex].question]?.userAnswer : answers[currentIndex]}
        isSubmitted={isSubmitted}
        onSelectOption={handleSelectOption}
      />
      <div style={styles.navigation}>
        <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} style={styles.arrowButton} disabled={currentIndex === 0}><ArrowLeftIcon /></button>
        <span style={styles.progressIndicator}>Question {currentIndex + 1} of {quizzes.length}</span>
        <button onClick={() => setCurrentIndex(prev => Math.min(quizzes.length - 1, prev + 1))} style={styles.arrowButton} disabled={currentIndex === quizzes.length - 1}><ArrowRightIcon /></button>
      </div>
      {!isSubmitted && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={handleSubmit} disabled={Object.keys(answers).length !== quizzes.length} style={styles.submitButton}>
            Submit All Answers
          </button>
        </div>
      )}
      {isSubmitted && <p style={styles.score}>Your Score: {calculateScore()} / {quizzes.length}</p>}
    </div>
  );
};

export default QuizDeck;
