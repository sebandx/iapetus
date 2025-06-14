// src/pages/Dashboard.tsx

// Removed 'useState' as it was not being used.
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

// --- Placeholder Icons ---
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const TaskIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3m0 2h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"></path></svg>;
const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 8H5a2 2 0 01-2-2V6a2 2 0 012-2h8"></path></svg>;


const Dashboard = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The auth listener will handle redirection
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = {
    dashboardContainer: {
        display: 'flex',
        height: '100vh',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#F9FAFB'
    },
    sidebar: {
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px'
    },
    sidebarTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '40px'
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 15px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: '#374151',
        fontWeight: 500,
        transition: 'background-color 0.2s, color 0.2s'
    },
    logoutButton: {
      marginTop: 'auto',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 15px',
      borderRadius: '8px',
      textDecoration: 'none',
      color: '#374151',
      fontWeight: 500,
      width: '100%'
    },
    mainContent: {
        flex: 1,
        padding: '40px',
        overflowY: 'auto'
    }
  }

  return (
    <div style={styles.dashboardContainer}>
       <style>{`
          .nav-link:hover { background-color: #F3F4F6; color: #111827; }
          .logout-button:hover { background-color: #FEF2F2; color: #991B1B; }
      `}</style>
      <div style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>Study Planner</h1>
        <nav style={styles.nav}>
          <Link to="/tasks" className="nav-link" style={styles.navLink}><TaskIcon /> To-do Tasks</Link>
          <Link to="/calendar" className="nav-link" style={styles.navLink}><CalendarIcon /> Calendar</Link>
        </nav>
        <button onClick={handleLogout} className="logout-button" style={styles.logoutButton}>
          <LogoutIcon /> Logout
        </button>
      </div>
      <main style={styles.mainContent}>
        {/* Child routes will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
