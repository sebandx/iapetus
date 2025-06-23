// src/components/QuizDeck.tsx

import React, { useState, useEffect } from 'react';
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
  taskType: 'pre-lecture' | 'post-lecture' | 'default';
  onTaskComplete: () => void;
}
const ArrowLeftIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>;
const ArrowRightIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>;

const QuizDeck: React.FC<QuizDeckProps> = ({ quizzes, existingResult, onSubmit, taskType, onTaskComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(!!existingResult);
  const [attemptedAnswer, setAttemptedAnswer] = useState<string | null>(null);

  useEffect(() => {
    setIsSubmitted(!!existingResult);
    if (existingResult) {
        const initialAnswers: { [key: number]: string } = {};
        quizzes.forEach((quiz, index) => {
            const resultForQuestion = existingResult[quiz.question];
            if (resultForQuestion?.isCorrect) { // Only load correct answers
                initialAnswers[index] = resultForQuestion.userAnswer;
            }
        });
        setAnswers(initialAnswers);
    }
  }, [existingResult, quizzes]);

  const handleSelectOption = (option: string) => {
    if (taskType === 'pre-lecture') {
      if (answers[currentIndex]) return; // Already answered correctly, do nothing.

      const isCorrect = option === quizzes[currentIndex].answer;
      setAttemptedAnswer(option); // Show feedback for the attempted answer.
      
      if (isCorrect) {
        setAnswers(prev => ({ ...prev, [currentIndex]: option }));
        onSubmit({ [quizzes[currentIndex].question]: { userAnswer: option, isCorrect: true } });
        if (currentIndex === quizzes.length - 1) {
          onTaskComplete();
        }
      }
      // If incorrect, we do NOT save it. The user can try again.
    } else {
      // Post-lecture mode: just record the selection.
      setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    }
  };

  const handleSubmitAll = () => {
    const results: { [key: string]: { userAnswer: string; isCorrect: boolean } } = {};
    quizzes.forEach((quiz, index) => {
      const question = quiz.question;
      const userAnswer = answers[index] || '';
      results[question] = { userAnswer, isCorrect: userAnswer === quiz.answer };
    });
    setIsSubmitted(true);
    onSubmit(results);
    onTaskComplete();
  };
  
  const calculateScore = () => {
      if(!existingResult) return 0;
      return Object.values(existingResult).filter(r => r.isCorrect).length;
  }
  
  const goToNext = () => {
    setAttemptedAnswer(null); 
    setCurrentIndex(prev => Math.min(quizzes.length - 1, prev + 1));
  };
  
  const goToPrevious = () => {
    setAttemptedAnswer(null);
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }

  const isPreLectureCorrect = !!answers[currentIndex];
  const isPreLectureLastQuestion = currentIndex === quizzes.length - 1;
  const showSubmitAllButton = taskType !== 'pre-lecture' && !isSubmitted;

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
        key={currentIndex}
        data={quizzes[currentIndex]}
        userAnswer={isPreLectureCorrect ? answers[currentIndex] : attemptedAnswer}
        isSubmitted={!!attemptedAnswer || isSubmitted}
        onSelectOption={handleSelectOption}
        taskType={taskType}
      />
      <div style={styles.navigation}>
        <button onClick={goToPrevious} style={styles.arrowButton} disabled={currentIndex === 0}><ArrowLeftIcon /></button>
        <span style={styles.progressIndicator}>Question {currentIndex + 1} of {quizzes.length}</span>
        {isPreLectureLastQuestion && isPreLectureCorrect ? (
             <span style={{...styles.progressIndicator, color: '#10B981'}}>Complete!</span>
        ) : (
            <button 
                onClick={goToNext} 
                style={styles.arrowButton} 
                disabled={(taskType === 'pre-lecture' && !isPreLectureCorrect) || currentIndex === quizzes.length - 1}
            >
                <ArrowRightIcon />
            </button>
        )}
      </div>
      {showSubmitAllButton && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={handleSubmitAll} disabled={Object.keys(answers).length !== quizzes.length} style={styles.submitButton}>
            Submit All Answers
          </button>
        </div>
      )}
      {isSubmitted && taskType !== 'pre-lecture' && <p style={styles.score}>Your Score: {calculateScore()} / {quizzes.length}</p>}
    </div>
  );
};

export default QuizDeck;
