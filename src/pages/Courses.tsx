// src/pages/Courses.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Course {
  id: string;
  name: string;
  code?: string;
  generationType: 'flashcards' | 'quiz'; // Add the new property
}

const PlusIcon = () => <svg /* ... */ />;
const TrashIcon = () => <svg /* ... */ />;

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseType, setNewCourseType] = useState<'flashcards' | 'quiz'>('flashcards'); // State for the new course preference
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const fetchCourses = async () => { /* ... no changes needed ... */ };

  useEffect(() => {
    if (currentUser) fetchCourses();
  }, [currentUser]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newCourseName, code: newCourseCode, generationType: newCourseType }), // <-- Send the new type
      });
      setNewCourseName('');
      setNewCourseCode('');
      await fetchCourses();
    } catch (err) { alert('Failed to add course.'); }
  };

  const handleTypeChange = async (courseId: string, newType: 'flashcards' | 'quiz') => {
    if (!currentUser) return;
    try {
        const token = await currentUser.getIdToken();
        await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ generationType: newType })
        });
        // Optimistically update the UI
        setCourses(prev => prev.map(c => c.id === courseId ? {...c, generationType: newType} : c));
    } catch (err) {
        alert('Failed to update preference.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => { /* ... no changes needed ... */ };

  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = { /* ... */ };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Manage Courses</h1>
      <p>Add your courses and choose the default review style for tasks generated from your calendar events.</p>

      {/* Add Course Section - UPDATED with dropdown */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add a New Course</h2>
        <form onSubmit={handleAddCourse} style={styles.form}>
            {/* ... name and code inputs ... */}
            <div style={{...styles.inputGroup, flexGrow: 0.5}}>
                <label htmlFor="generationType" style={styles.label}>Review Style</label>
                <select id="generationType" value={newCourseType} onChange={e => setNewCourseType(e.target.value as any)} style={{...styles.input, height: '42px'}}>
                    <option value="flashcards">Flashcards</option>
                    <option value="quiz">Multiple Choice Quiz</option>
                </select>
            </div>
            <button type="submit" style={styles.button}><PlusIcon /> Add</button>
        </form>
      </div>

      {/* Existing Courses Section - UPDATED with dropdown */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Courses</h2>
        {courses.length === 0 ? <p>No courses added yet.</p> : (
          <ul style={styles.courseList}>
            {courses.map(course => (
              <li key={course.id} style={styles.courseItem}>
                <div>
                    <strong style={{color: '#1F2937'}}>{course.name}</strong>
                    {course.code && <span style={{color: '#6B7280', marginLeft: '10px'}}>({course.code})</span>}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <select value={course.generationType || 'flashcards'} onChange={e => handleTypeChange(course.id, e.target.value as any)} style={styles.input}>
                        <option value="flashcards">Flashcards</option>
                        <option value="quiz">Quiz</option>
                    </select>
                    <button onClick={() => handleDeleteCourse(course.id)} style={styles.deleteButton} title="Delete Course"><TrashIcon /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Courses;
