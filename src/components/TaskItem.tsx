// src/components/TaskItem.tsx

import React, { useState, useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import Flashcard from './Flashcard'; // Import the new component

// ... (Interfaces and Icons remain the same) ...
interface Task {
  id: string; title: string; details: string; status: 'PENDING' | 'COMPLETED';
  priority: string; dueDate: { _seconds: number, _nanoseconds: number } | string;
}
interface TaskItemProps {
  task: Task;
  onUpdate: (taskId: string, newStatus: 'PENDING' | 'COMPLETED') => void;
  onDelete: (taskId: string) => void;
}
const CheckIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>;
const TrashIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;
const UndoIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>;
const ChevronDown = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>;
const ChevronUp = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/></svg>;


const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(task.status === 'PENDING');

  // --- NEW: Parse flashcard data from the details string ---
  const flashcards = useMemo(() => {
    try {
      // Clean up the string in case the AI returns it wrapped in markdown backticks
      const cleanedDetails = task.details.replace(/^```json\s*|```$/g, '');
      const parsed = JSON.parse(cleanedDetails);
      // Check if it's an array of objects with question and answer keys
      if (Array.isArray(parsed) && parsed.every(item => 'question' in item && 'answer' in item)) {
        return parsed;
      }
    } catch (e) {
      // It's not valid JSON, so we'll treat it as plain text/markdown
    }
    return null;
  }, [task.details]);

  // ... (styles and other functions remain the same) ...
  const styles: { [key: string]: React.CSSProperties } = { /* ... */ };
  const getPriorityStyle = (priority: string) => { /* ... */ };
  const formatDate = (timestamp: any) => { /* ... */ };

  return (
    <div style={{... { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', marginBottom: '15px', borderLeft: '5px solid #4F46E5', transition: 'opacity 0.3s' }, opacity: task.status === 'COMPLETED' ? 0.6 : 1, borderLeftColor: task.status === 'COMPLETED' ? '#9CA3AF' : '#4F46E5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1F2937' }}>{task.title}</h2>
        {/* ... action buttons ... */}
      </div>
      <div style={{ maxHeight: isExpanded ? '2000px' : '0', overflow: 'hidden', transition: 'max-height 0.5s ease-in-out, padding 0.5s ease-in-out', paddingTop: isExpanded ? '10px' : '0' }}>
        
        {/* --- THIS IS THE FIX --- */}
        {/* Conditionally render flashcards or fallback to markdown */}
        {flashcards ? (
          <div>
            <p style={{color: '#4B5563', lineHeight: '1.6'}}>Click on a card to reveal the answer.</p>
            {flashcards.map((card, index) => (
              <Flashcard key={index} question={card.question} answer={card.answer} />
            ))}
          </div>
        ) : (
          <MarkdownRenderer content={task.details} />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            {/* ... footer meta info ... */}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
