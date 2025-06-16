// src/pages/TodoList.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskItem from '../components/TaskItem';
import ConfirmModal from '../components/ConfirmModal'; // Import the reusable modal

interface Task {
  id: string;
  title: string;
  details: string;
  status: 'PENDING' | 'COMPLETED';
  priority: string;
  dueDate: { _seconds: number, _nanoseconds: number } | string;
}

const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useEffect(() => {
    // ... fetching logic remains the same ...
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
    // ... update logic remains the same ...
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

  // This function now just opens the confirmation modal
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  // This function runs when the user confirms the deletion
  const handleConfirmDelete = async () => {
    if (!currentUser || !taskToDelete) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      // Remove the task from local state and close the modal
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task.");
    }
  };


  const pendingTasks = useMemo(() => tasks.filter(task => task.status === 'PENDING'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.status === 'COMPLETED'), [tasks]);
  const styles = { /* ... styles ... */ };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your To-do List</h1>
      
      {/* Pending Tasks Section */}
      <section>
        <h2 style={styles.sectionTitle}>Pending ({pendingTasks.length})</h2>
        {pendingTasks.length === 0 ? (
          <p style={styles.emptyMessage}>No pending tasks.</p>
        ) : (
          pendingTasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
          ))
        )}
      </section>

      {/* Completed Tasks Section */}
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

      {/* Render the confirmation modal */}
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
