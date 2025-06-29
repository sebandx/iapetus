// src/pages/Courses.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
}

interface Course {
  id: string;
  name:string;
  code?: string;
  generationType: 'flashcards' | 'quiz';
  schedule?: Schedule[];
}


// --- ICONS ---
const PlusIcon = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>;
const TrashIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>;
const CalendarIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>;
const ClockIcon = () => <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>;
const EditIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>;


const Courses = () => {
  // --- State Management ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseType, setNewCourseType] = useState<'flashcards' | 'quiz'>('flashcards');
  const [newSchedule, setNewSchedule] = useState<Array<Schedule & { id: number }>>([]);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // --- API Functions ---
  const fetchCourses = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch courses.');
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
    else setLoading(false);
  }, [currentUser]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim() || !currentUser) return;

    const scheduleToSave = newSchedule.map(({ id, ...rest }) => rest);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name: newCourseName, 
          code: newCourseCode, 
          generationType: newCourseType,
          schedule: scheduleToSave 
        }),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to add course.');
      
      setNewCourseName('');
      setNewCourseCode('');
      setNewCourseType('flashcards');
      setNewSchedule([]);
      await fetchCourses();
    } catch (err) { alert(err instanceof Error ? err.message : 'An unknown error occurred.'); }
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

  const handleUpdateCourse = async (courseId: string, updatedData: Omit<Course, 'id'>) => {
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to update course.');

      setEditingCourseId(null);
      await fetchCourses();
    } catch (err) { alert(err instanceof Error ? err.message : 'An unknown error occurred.'); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!currentUser || !window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = await currentUser.getIdToken();
      await fetch(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchCourses();
    } catch (err) { alert('Failed to delete course.'); }
  };

  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: { fontFamily: "'Inter', sans-serif", maxWidth: '900px', margin: 'auto', padding: '20px' },
    title: { fontSize: '2rem', color: '#111827', marginBottom: '8px' },
    subTitle: { fontSize: '1.1rem', color: '#6B7280', marginTop: 0, marginBottom: '30px' },
    section: { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '30px' },
    sectionTitle: { marginTop: 0, color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'flex-end' },
    inputGroup: { display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '5px', fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 },
    input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '10px', fontSize: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s' },
    button: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#4F46E5', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '44px', alignSelf: 'flex-end' },
    courseList: { listStyle: 'none', padding: 0 },
    courseItem: { padding: '20px 0', borderBottom: '1px solid #F3F4F6' },
    courseItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    actionButton: { backgroundColor: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
    scheduleSection: { borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginTop: '20px' },
    scheduleTitle: { display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '1rem', fontWeight: 600 },
    addSlotButton: { background: 'none', border: '1px dashed #D1D5DB', color: '#4B5563', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' },
    scheduleDisplayList: { listStyle: 'none', padding: 0, marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
    scheduleDisplayItem: { display: 'flex', alignItems: 'center', gap: '10px', color: '#4B5563', fontSize: '0.9rem' },
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Manage Courses</h1>
      <p style={styles.subTitle}>Add your courses and their weekly schedules to automatically populate your calendar.</p>

      {/* Add New Course Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add a New Course</h2>
        <form onSubmit={handleAddCourse} style={styles.form}>
            <div style={styles.formGrid}>
                <div style={styles.inputGroup}><label htmlFor="courseName" style={styles.label}>Course Name *</label><input id="courseName" type="text" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} required style={styles.input} placeholder="e.g., Intro to Psychology"/></div>
                <div style={styles.inputGroup}><label htmlFor="courseCode" style={styles.label}>Course Code</label><input id="courseCode" type="text" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} style={styles.input} placeholder="e.g., PSYC 101"/></div>
                <div style={styles.inputGroup}><label htmlFor="generationType" style={styles.label}>Review Style</label><select id="generationType" value={newCourseType} onChange={e => setNewCourseType(e.target.value as any)} style={{...styles.input, height: '44px'}}><option value="flashcards">Flashcards</option><option value="quiz">Quiz</option></select></div>
            </div>
            <div style={styles.scheduleSection}>
              <h3 style={styles.scheduleTitle}><CalendarIcon /> Weekly Schedule</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
                {newSchedule.map((slot) => (<ScheduleInput key={slot.id} slot={slot} setSchedule={setNewSchedule} />))}
              </div>
              <button type="button" onClick={() => setNewSchedule(s => [...s, {id: Date.now(), day: 'Monday', startTime: '09:00', endTime: '10:00'}])} style={styles.addSlotButton}><PlusIcon /> Add Time Slot</button>
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}><button type="submit" style={styles.button}>Add Course</button></div>
        </form>
      </div>

      {/* Existing Courses List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Courses</h2>
        {courses.length === 0 ? <p>No courses added yet.</p> : (
          <ul style={styles.courseList}>
            {courses.map(course => (
              <li key={course.id} style={styles.courseItem}>
                {editingCourseId === course.id ? (
                  <EditCourseForm course={course} onSave={handleUpdateCourse} onCancel={() => setEditingCourseId(null)} />
                ) : (
                  <CourseDisplay course={course} onEdit={() => setEditingCourseId(course.id)} onDelete={handleDeleteCourse} onTypeChange={handleTypeChange} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// --- Child Components ---

const CourseDisplay = ({ course, onEdit, onDelete, onTypeChange }: { course: Course; onEdit: () => void; onDelete: (id: string) => void; onTypeChange: (id: string, type: 'flashcards' | 'quiz') => void; }) => {
    const formatTime = (timeString?: string) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const formattedHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };
    
    const styles: { [key: string]: React.CSSProperties } = {
        courseItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
        courseInfo: { display: 'flex', flexDirection: 'column' },
        courseActions: { display: 'flex', alignItems: 'center', gap: '10px' },
        actionButton: { backgroundColor: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
        input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '0.9rem' },
        scheduleDisplayList: { listStyle: 'none', padding: 0, marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
        scheduleDisplayItem: { display: 'flex', alignItems: 'center', gap: '10px', color: '#4B5563', fontSize: '0.9rem' },
    };

    return (
      <>
        <div style={styles.courseItemHeader}>
            <div style={styles.courseInfo}>
                <strong style={{color: '#1F2937', fontSize: '1.1rem'}}>{course.name}</strong>
                {course.code && <span style={{color: '#6B7280', fontSize: '0.9rem'}}>({course.code})</span>}
            </div>
            <div style={styles.courseActions}>
                <select value={course.generationType} onChange={e => onTypeChange(course.id, e.target.value as any)} style={styles.input}>
                    <option value="flashcards">Flashcards</option>
                    <option value="quiz">Quiz</option>
                </select>
                <button onClick={onEdit} style={styles.actionButton} title="Edit Course"><EditIcon /></button>
                <button onClick={() => onDelete(course.id)} style={styles.actionButton} title="Delete Course"><TrashIcon /></button>
            </div>
        </div>
        {course.schedule && course.schedule.length > 0 && (
            <div style={{marginTop: '15px'}}>
              <ul style={styles.scheduleDisplayList}>
                  {course.schedule.map((s, i) => (
                    <li key={i} style={styles.scheduleDisplayItem}>
                        <ClockIcon />
                        <span style={{fontWeight: 500, width: '90px'}}>{s.day}</span>
                        <span>{formatTime(s.startTime)} - {formatTime(s.endTime)}</span>
                    </li>
                  ))}
              </ul>
            </div>
        )}
      </>
    );
};

const EditCourseForm = ({ course, onSave, onCancel }: { course: Course; onSave: (id: string, data: Omit<Course, 'id'>) => void; onCancel: () => void; }) => {
    const [name, setName] = useState(course.name);
    const [code, setCode] = useState(course.code || '');
    const [generationType, setGenerationType] = useState(course.generationType);
    const [schedule, setSchedule] = useState((course.schedule || []).map((s, i) => ({...s, id: i})));

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const scheduleToSave = schedule.map(({ id, ...rest }) => rest);
        onSave(course.id, { name, code, generationType, schedule: scheduleToSave });
    };

    const styles: { [key: string]: React.CSSProperties } = {
        form: { display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' },
        formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'flex-end' },
        inputGroup: { display: 'flex', flexDirection: 'column' },
        label: { marginBottom: '5px', fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 },
        input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '10px', fontSize: '1rem' },
        scheduleSection: { borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginTop: '20px' },
        scheduleTitle: { display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '1rem', fontWeight: 600 },
        addSlotButton: { background: 'none', border: '1px dashed #D1D5DB', color: '#4B5563', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' },
        buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
        saveButton: { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#4F46E5', color: 'white', cursor: 'pointer'},
        cancelButton: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', cursor: 'pointer'},
    };

    return (
        <form onSubmit={handleSave} style={styles.form}>
            <div style={styles.formGrid}>
                <div style={styles.inputGroup}><label style={styles.label}>Course Name *</label><input value={name} onChange={e => setName(e.target.value)} required style={styles.input}/></div>
                <div style={styles.inputGroup}><label style={styles.label}>Course Code</label><input value={code} onChange={e => setCode(e.target.value)} style={styles.input}/></div>
                <div style={styles.inputGroup}><label style={styles.label}>Review Style</label><select value={generationType} onChange={e => setGenerationType(e.target.value as any)} style={{...styles.input, height: '44px'}}><option value="flashcards">Flashcards</option><option value="quiz">Quiz</option></select></div>
            </div>
             <div style={styles.scheduleSection}>
                <h3 style={styles.scheduleTitle}><CalendarIcon /> Weekly Schedule</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
                    {schedule.map((slot) => (<ScheduleInput key={slot.id} slot={slot} setSchedule={setSchedule} />))}
                </div>
                <button type="button" onClick={() => setSchedule(s => [...s, {id: Date.now(), day: 'Monday', startTime: '09:00', endTime: '10:00'}])} style={styles.addSlotButton}><PlusIcon /> Add Time Slot</button>
            </div>
            <div style={styles.buttonGroup}>
                <button type="button" onClick={onCancel} style={styles.cancelButton}>Cancel</button>
                <button type="submit" style={styles.saveButton}>Save Changes</button>
            </div>
        </form>
    );
};

const ScheduleInput = ({ slot, setSchedule }: { 
    slot: { id: number; day: string; startTime: string; endTime: string; }; 
    setSchedule: React.Dispatch<React.SetStateAction<Array<Schedule & {id: number}>>>;
}) => {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const handleChange = (field: keyof Schedule, value: string) => {
        setSchedule(prev => prev.map(s => s.id === slot.id ? { ...s, [field]: value } : s));
    };

    const handleRemove = () => {
        setSchedule(prev => prev.filter(s => s.id !== slot.id));
    };

    const styles: { [key: string]: React.CSSProperties } = { 
        container: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }, 
        input: { border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '0.9rem' }, 
        deleteButton: { background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '5px' } 
    };

    return (
        <div style={styles.container}>
            <select value={slot.day} onChange={(e) => handleChange('day', e.target.value)} style={styles.input}>{daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}</select>
            <input type="time" value={slot.startTime} onChange={(e) => handleChange('startTime', e.target.value)} style={styles.input} />
            <input type="time" value={slot.endTime} onChange={(e) => handleChange('endTime', e.target.value)} style={styles.input} />
            <button type="button" onClick={handleRemove} style={styles.deleteButton} title="Remove time slot"><TrashIcon /></button>
        </div>
    );
};

export default Courses;
