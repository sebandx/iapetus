// src/pages/TodoList.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Define the shape of a task object
interface Task {
  id: string;
  title: string;
  details: string;
  status: 'PENDING' | 'COMPLETED'; // Make status more specific
  priority: string;
  dueDate: { _seconds: number, _nanoseconds: number }; // Match Firestore timestamp object
}

// --- Icons for buttons ---
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;


const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    // Fetching logic remains the same
    const fetchTasks = async () => {
      if (!currentUser) { setLoading(false); return; }
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch tasks.');
        const data = await response.json();
        setTasks(data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [currentUser]);

  const handleUpdateTask = async (taskId: string, newStatus: 'PENDING' | 'COMPLETED') => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      // Update the task in the local state for an immediate UI update
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser || !window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      // Remove the task from local state for an immediate UI update
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task.");
    }
  };


  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: "'Inter', sans-serif" },
    title: { fontSize: '2rem', color: '#111827', marginBottom: '20px' },
    taskCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', marginBottom: '15px', borderLeft: '5px solid #4F46E5' },
    taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    taskTitle: { margin: 0, fontSize: '1.2rem', color: '#1F2937' },
    taskDetails: { margin: '0 0 15px 0', color: '#4B5563', whiteSpace: 'pre-wrap', lineHeight: '1.6' },
    taskFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    taskMeta: { display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#6B7280', alignItems: 'center' },
    tag: { padding: '4px 10px', borderRadius: '12px', fontWeight: 500, fontSize: '0.8rem' },
    actions: { display: 'flex', gap: '10px' },
    button: { background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'background-color 0.2s' },
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'MEDIUM': return { backgroundColor: '#FEF3C7', color: '#92400E' };
      default: return { backgroundColor: '#E0E7FF', color: '#3730A3' };
    }
  };
  
  // Convert Firestore timestamp to a readable date string
  const formatDate = (timestamp: { _seconds: number }) => {
    if (!timestamp || !timestamp._seconds) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleDateString();
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your To-do List</h1>
      {tasks.length === 0 ? (
        <p>No tasks found. Create a calendar event to automatically generate one!</p>
      ) : (
        tasks.map(task => (
          <div key={task.id} style={{ ...styles.taskCard, opacity: task.status === 'COMPLETED' ? 0.6 : 1 }}>
            <div style={styles.taskHeader}>
              <h2 style={styles.taskTitle}>{task.title}</h2>
              <div style={styles.actions}>
                {task.status === 'PENDING' && (
                  <button onClick={() => handleUpdateTask(task.id, 'COMPLETED')} style={styles.button}>
                    <CheckIcon /> Mark as Done
                  </button>
                )}
                 <button onClick={() => handleDeleteTask(task.id)} style={{...styles.button, color: '#DC2626'}}>
                    <TrashIcon /> Delete
                 </button>
              </div>
            </div>
            <p style={styles.taskDetails}>{task.details}</p>
            <div style={styles.taskFooter}>
              <div style={styles.taskMeta}>
                <span>Status: <strong>{task.status}</strong></span>
                <span>Due: <strong>{formatDate(task.dueDate)}</strong></span>
                <span>Priority: <span style={{ ...styles.tag, ...getPriorityStyle(task.priority) }}>{task.priority}</span></span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TodoList;
