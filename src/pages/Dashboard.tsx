// src/pages/Dashboard.tsx

import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

// --- Icons ---
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const TaskIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3m0 2h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"></path></svg>;
const BookIcon = () => <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25278C12 6.25278 15.5344 3 20 3C23.5 3 24 8 24 8C24 8 23.5 18 20 18C15.5344 18 12 20.7472 12 20.7472M12 6.25278C12 6.25278 8.46556 3 4 3C0.5 3 0 8 0 8C0 8 0.5 18 4 18C8.46556 18 12 20.7472 12 20.7472M12 6.25278V20.7472" transform="scale(0.9) translate(-1, -1)"/></svg>;
const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 8H5a2 2 0 01-2-2V6a2 2 0 012-2h8"></path></svg>;
const HamburgerIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;

const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    dashboardContainer: {
      display: 'flex',
      height: '100vh',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#F9FAFB'
    },
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '260px',
      backgroundColor: 'white',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      transform: 'translateX(-100%)', // Hidden by default on mobile
      transition: 'transform 0.3s ease-in-out',
      zIndex: 100
    },
    sidebarTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '40px' },
    nav: { display: 'flex', flexDirection: 'column', gap: '10px' },
    navLink: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', borderRadius: '8px', textDecoration: 'none', color: '#374151', fontWeight: 500, transition: 'background-color 0.2s, color 0.2s' },
    logoutButton: { marginTop: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', borderRadius: '8px', textDecoration: 'none', color: '#374151', fontWeight: 500, width: '100%' },
    mainContent: { flex: 1, padding: '20px', overflowY: 'auto', marginLeft: '0px', transition: 'margin-left 0.3s' },
    mobileHeader: { display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px', backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', marginBottom: '20px' },
    hamburgerButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99, opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none' }
  };
  
  // Apply active state for mobile menu
  if (isMobileMenuOpen) {
    styles.sidebar.transform = 'translateX(0)';
    styles.overlay.opacity = 1;
    styles.overlay.pointerEvents = 'auto';
  }

  return (
    <div style={styles.dashboardContainer}>
      <style>{`
        .nav-link:hover { background-color: #F3F4F6; color: #111827; }
        .logout-button:hover { background-color: #FEF2F2; color: #991B1B; }

        /* --- MEDIA QUERIES FOR RESPONSIVE LAYOUT --- */
        @media (min-width: 768px) {
          #mobile-header {
            display: none;
          }
          #sidebar {
            transform: translateX(0); /* Sidebar is always visible on desktop */
            position: static;
          }
          #main-content {
            margin-left: 0; /* No margin needed as it's part of the flex layout */
            padding: 40px;
          }
          #overlay {
            display: none; /* Overlay is not needed on desktop */
          }
        }
      `}</style>
      
      {/* Mobile-only overlay */}
      <div id="overlay" style={styles.overlay} onClick={() => setIsMobileMenuOpen(false)}></div>

      <div id="sidebar" style={styles.sidebar}>
        <div style={styles.sidebarTitle}>
          <img src="/iapetus-logo.svg" alt="Iapetus Logo" width="32" height="32" />
          <span>Study Planner</span>
        </div>
        <nav style={styles.nav} onClick={() => setIsMobileMenuOpen(false)}>
          <Link to="/tasks" className="nav-link" style={styles.navLink}><TaskIcon /> To-do Tasks</Link>
          <Link to="/calendar" className="nav-link" style={styles.navLink}><CalendarIcon /> Calendar</Link>
          <Link to="/materials" className="nav-link" style={styles.navLink}><BookIcon /> Study Materials</Link>
        </nav>
        <button onClick={handleLogout} className="logout-button" style={styles.logoutButton}>
          <LogoutIcon /> Logout
        </button>
      </div>

      <main id="main-content" style={styles.mainContent}>
        {/* --- Mobile Header with Hamburger Menu --- */}
        <div id="mobile-header" style={styles.mobileHeader}>
          <button style={styles.hamburgerButton} onClick={() => setIsMobileMenuOpen(true)}>
            <HamburgerIcon />
          </button>
          <h2 style={{margin: 0, fontSize: '20px'}}>Study Planner</h2>
        </div>
        
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
