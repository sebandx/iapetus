// src/pages/TodoList.tsx

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskItem from '../components/TaskItem';

interface Task {
  id: string;
  title: string;
  details: string;
  status: 'PENDING' | 'COMPLETED';
  priority: string;
  dueDate: { _seconds: number, _nanoseconds: number };
}

const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
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
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task.");
    }
  };

  // Use useMemo to efficiently separate tasks into two lists.
  // This will only re-calculate when the main 'tasks' array changes.
  const pendingTasks = useMemo(() => tasks.filter(task => task.status === 'PENDING'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.status === 'COMPLETED'), [tasks]);

  const styles = {
    container: { fontFamily: "'Inter', sans-serif" },
    title: { fontSize: '2rem', color: '#111827', marginBottom: '20px' },
    sectionTitle: { fontSize: '1.5rem', color: '#374151', marginTop: '40px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' },
    emptyMessage: { color: '#6B7280', fontStyle: 'italic' },
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your To-do List</h1>

      {/* --- PENDING TASKS SECTION --- */}
      <section>
        <h2 style={styles.sectionTitle}>Pending ({pendingTasks.length})</h2>
        {pendingTasks.length === 0 ? (
          <p style={styles.emptyMessage}>No pending tasks. Create a calendar event to automatically generate one!</p>
        ) : (
          pendingTasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
          ))
        )}
      </section>

      {/* --- COMPLETED TASKS SECTION --- */}
      <section>
        <h2 style={styles.sectionTitle}>Completed ({completedTasks.length})</h2>
        {completedTasks.length === 0 ? (
          <p style={styles.emptyMessage}>No tasks completed yet.</p>
        ) : (
          completedTasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
          ))
        )}
      </section>

    </div>
  );
};

export default TodoList;
