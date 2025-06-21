// src/pages/Courses.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Course {
  id: string;
  name: string;
  code?: string;
  generationType: 'flashcards' | 'quiz'; // Add the new property
}

const PlusIcon = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>;
const TrashIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseType, setNewCourseType] = useState<'flashcards' | 'quiz'>('flashcards'); // State for the new course preference
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const fetchCourses = async () => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch courses.');
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteCourse = async (courseId: string) => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchCourses(); // Refresh the list
    } catch (err) {
      alert('Failed to delete course.');
    }
  };

  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: "'Inter', sans-serif" },
    title: { fontSize: '2rem', color: '#111827', marginBottom: '20px' },
    section: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' },
    sectionTitle: { marginTop: 0, color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' },
    form: { display: 'flex', gap: '15px', alignItems: 'flex-end' },
    inputGroup: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
    label: { marginBottom: '5px', fontSize: '0.9rem', color: '#6B7280' },
    input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '10px' },
    button: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#4F46E5', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '42px' },
    courseList: { listStyle: 'none', padding: 0 },
    courseItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #F3F4F6' },
    deleteButton: { backgroundColor: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' },
  };

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
            <div style={styles.inputGroup}>
                <label htmlFor="courseName" style={styles.label}>Course Name *</label>
                <input id="courseName" type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} required style={styles.input} placeholder="e.g., Introduction to Computer Science"/>
            </div>
            <div style={styles.inputGroup}>
                <label htmlFor="courseCode" style={styles.label}>Course Code (Optional)</label>
                <input id="courseCode" type="text" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} style={styles.input} placeholder="e.g., CS 135"/>
            </div>
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
