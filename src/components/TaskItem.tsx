// src/components/TaskItem.tsx

import React, { useState, useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import Flashcard from './Flashcard';

// Interfaces and Icons remain the same...
interface Task {
  id: string; 
  title: string; 
  details: string; 
  status: 'PENDING' | 'COMPLETED';
  priority: string; 
  dueDate: { _seconds: number, _nanoseconds: number } | string;
}
interface TaskItemProps { /* ... */ }
const CheckIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>;
const TrashIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;
const UndoIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg>;
const ChevronDown = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>;
const ChevronUp = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/></svg>;


const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(task.status === 'PENDING');

  // --- THIS IS THE FIX ---
  const flashcards = useMemo(() => {
    // Regular expression to find and extract the JSON content between ```json and ```
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = task.details.match(jsonRegex);

    if (match && match[1]) {
      try {
        const jsonContent = match[1];
        const parsed = JSON.parse(jsonContent);
        // Validate that the parsed content is an array of flashcards
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'question' in item && 'answer' in item)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse extracted JSON. Falling back to markdown. Error:", e);
        console.error("Extracted JSON string:", match[1]);
      }
    }
    
    // If no valid JSON block is found, return null
    return null;
  }, [task.details]);

  // Styles and other functions remain the same...
  const styles: { [key: string]: React.CSSProperties } = {
    taskCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', marginBottom: '15px', borderLeft: '5px solid #4F46E5', transition: 'opacity 0.3s' },
    taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' },
    taskTitle: { margin: 0, fontSize: '1.2rem', color: '#1F2937' },
    detailsContainer: { maxHeight: isExpanded ? '2000px' : '0', overflow: 'hidden', transition: 'max-height 0.5s ease-in-out, padding 0.5s ease-in-out', paddingTop: isExpanded ? '10px' : '0' },
    taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' },
    taskMeta: { display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#6B7280', alignItems: 'center' },
    tag: { padding: '4px 10px', borderRadius: '12px', fontWeight: 500, fontSize: '0.8rem' },
    actions: { display: 'flex', gap: '10px', flexShrink: 0 },
    button: { background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background-color 0.2s' },
    foldButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#6B7280' },
  };
  const getPriorityStyle = (priority: string) => { /* ... */ };
  const formatDate = (timestamp: any) => { /* ... */ };

  return (
    <div style={{ ...styles.taskCard, opacity: task.status === 'COMPLETED' ? 0.6 : 1, borderLeftColor: task.status === 'COMPLETED' ? '#9CA3AF' : '#4F46E5' }}>
      <div style={styles.taskHeader}>
        <h2 style={styles.taskTitle}>{task.title}</h2>
        <div style={styles.actions}>
          {/* ... action buttons ... */}
        </div>
      </div>
      <div style={styles.detailsContainer}>
        {flashcards ? (
          <div>
            <p style={{color: '#4B5563', lineHeight: '1.6'}}>Click on a card to reveal the answer.</p>
            {flashcards.map((card: any, index: number) => (
              <Flashcard key={index} question={card.question} answer={card.answer} />
            ))}
          </div>
        ) : (
          <MarkdownRenderer content={task.details} />
        )}
        <div style={styles.taskFooter}>
           <div style={styles.taskMeta}>
            <span>Due: <strong>{formatDate(task.dueDate)}</strong></span>
            <span>Priority: <span style={{ ...styles.tag, ...getPriorityStyle(task.priority) }}>{task.priority}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
