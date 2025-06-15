// src/pages/TodoList.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Define the shape of a task object
interface Task {
  id: string;
  title: string;
  details: string;
  status: string;
  priority: string;
  dueDate: string;
}

const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks from the server.');
        }

        const data = await response.json();
        setTasks(data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser]);

  // --- Styles for the component ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: "'Inter', sans-serif" },
    title: { fontSize: '2rem', color: '#111827', marginBottom: '20px' },
    taskCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '15px',
      borderLeft: '5px solid #4F46E5', // Accent color
    },
    taskTitle: { margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1F2937' },
    taskDetails: { margin: '0 0 15px 0', color: '#4B5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' },
    taskMeta: { display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#6B7280', alignItems: 'center' },
    tag: { padding: '4px 10px', borderRadius: '12px', fontWeight: 500, fontSize: '0.8rem' },
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'MEDIUM': return { backgroundColor: '#FEF3C7', color: '#92400E' };
      default: return { backgroundColor: '#E0E7FF', color: '#3730A3' };
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your To-do List</h1>
      {tasks.length === 0 ? (
        <p>No tasks found. Create a calendar event to automatically generate one!</p>
      ) : (
        tasks.map(task => (
          <div key={task.id} style={styles.taskCard}>
            <h2 style={styles.taskTitle}>{task.title}</h2>
            <p style={styles.taskDetails}>{task.details}</p>
            <div style={styles.taskMeta}>
              <span>Status: <strong>{task.status}</strong></span>
              <span>Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong></span>
              <span>Priority: <span style={{ ...styles.tag, ...getPriorityStyle(task.priority) }}>{task.priority}</span></span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TodoList;
