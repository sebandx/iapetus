// src/pages/TodoList.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskItem from '../components/TaskItem';
import ConfirmModal from '../components/ConfirmModal';

interface Task {
  id: string;
  title: string;
  details: string;
  status: 'PENDING' | 'COMPLETED';
  priority: string;
  dueDate: { _seconds: number, _nanoseconds: number } | string;
  quizResult?: { [key: string]: { userAnswer: string; isCorrect: boolean; } };
  taskType?: 'pre-lecture' | 'post-lecture' | 'default';
}

const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) { setLoading(false); return; }
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch tasks.');
        const data = await response.json();
        data.sort((a: Task, b: Task) => {
            const dateA = new Date(typeof a.dueDate === 'string' ? a.dueDate : a.dueDate._seconds * 1000);
            const dateB = new Date(typeof b.dueDate === 'string' ? b.dueDate : b.dueDate._seconds * 1000);
            return dateA.getTime() - dateB.getTime();
        });
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

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };
  
  const handleConfirmDelete = async () => {
    if (!currentUser || !taskToDelete) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task.");
    }
  };
  
  const handleQuizSubmit = async (taskId: string, result: any) => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(result),
      });
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, quizResult: {...task.quizResult, ...result} } : task
      ));
    } catch (err) {
      console.error("Failed to submit quiz result:", err);
      alert("Failed to submit quiz result.");
    }
  };

  const { dueTodayTasks, upcomingTasks, completedTasks } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const pending = tasks.filter(task => task.status === 'PENDING');
    const completed = tasks.filter(task => task.status === 'COMPLETED');
    
    const dueToday = pending.filter(task => {
        const dueDate = new Date(typeof task.dueDate === 'string' ? task.dueDate : task.dueDate._seconds * 1000);
        return dueDate <= today;
    });
    
    const upcoming = pending.filter(task => {
        const dueDate = new Date(typeof task.dueDate === 'string' ? task.dueDate : task.dueDate._seconds * 1000);
        return dueDate > today;
    });

    return { dueTodayTasks: dueToday, upcomingTasks: upcoming, completedTasks: completed };
  }, [tasks]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: "'Inter', sans-serif" },
    title: { fontSize: '2rem', color: '#111827', marginBottom: '20px' },
    sectionTitle: { fontSize: '1.5rem', color: '#374151', marginTop: '40px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px' },
    dueTodayTitle: { fontSize: '1.5rem', color: '#B91C1C', marginTop: '40px', borderBottom: '2px solid #FECACA', paddingBottom: '10px' },
    emptyMessage: { color: '#6B7280', fontStyle: 'italic' },
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your To-do List</h1>

      <section>
        <h2 style={styles.dueTodayTitle}>Due Today & Overdue ({dueTodayTasks.length})</h2>
        {dueTodayTasks.length === 0 ? (
          <p style={styles.emptyMessage}>Nothing is due today.</p>
        ) : (
          dueTodayTasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onQuizSubmit={handleQuizSubmit} isInitiallyExpanded={true} />
          ))
        )}
      </section>

      <section>
        <h2 style={styles.sectionTitle}>Upcoming ({upcomingTasks.length})</h2>
        {upcomingTasks.length === 0 ? (
          <p style={styles.emptyMessage}>No upcoming tasks. Create a calendar event to automatically generate some!</p>
        ) : (
          upcomingTasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onQuizSubmit={handleQuizSubmit} isInitiallyExpanded={true} />
          ))
        )}
      </section>

      <section>
        <h2 style={styles.sectionTitle}>Completed ({completedTasks.length})</h2>
        {completedTasks.length === 0 ? (
          <p style={styles.emptyMessage}>No tasks completed yet.</p>
        ) : (
          completedTasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onQuizSubmit={handleQuizSubmit} isInitiallyExpanded={false} />
          ))
        )}
      </section>

      <ConfirmModal
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task?"
      />
    </div>
  );
};

export default TodoList;
