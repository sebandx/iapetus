// src/pages/AuthPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider, // Import Google provider
  signInWithPopup,      // Import popup sign-in method
} from 'firebase/auth';

// --- SVG Icons ---
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);
const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);
const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.358-11.303-8H4.306C7.654,37.14,15.223,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.917,44,30.41,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW --- Handler for Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW --- Centralized error handler
  const handleAuthError = (err: any) => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
        const firebaseError = err as { code: string };
        switch (firebaseError.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                setError('Invalid email or password.');
                break;
            case 'auth/email-already-in-use':
                setError('An account already exists with this email address.');
                break;
            case 'auth/popup-closed-by-user':
                setError('Sign-in process was cancelled.');
                break;
            default:
                setError('An error occurred. Please try again.');
        }
    } else {
        setError('An unknown error occurred.');
    }
    console.error("Authentication error:", err);
  }

  // --- Styles --- (No changes needed, but a new one is added)
  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    card: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
    title: { fontSize: '28px', fontWeight: 600, color: '#1F2937', marginBottom: '10px' },
    subtitle: { color: '#6B7280', marginBottom: '30px' },
    form: { width: '100%', display: 'flex', flexDirection: 'column' },
    inputContainer: { position: 'relative', marginBottom: '20px' },
    input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '16px', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#4F46E5', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', gap: '10px' },
    toggleButton: { marginTop: '20px', background: 'none', border: 'none', color: '#4F46E5', fontWeight: '600', cursor: 'pointer' },
    error: { color: '#EF4444', marginBottom: '15px', fontSize: '14px' },
    loader: { border: '4px solid #f3f3f3', borderTop: '4px solid #4F46E5', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' },
    divider: { display: 'flex', alignItems: 'center', color: '#9CA3AF', margin: '25px 0' },
    dividerLine: { flex: 1, height: '1px', backgroundColor: '#D1D5DB' },
    dividerText: { margin: '0 15px', fontSize: '14px' },
    googleButton: { backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB' } // New style for Google button
  };

  return (
    <div style={styles.container}>
       <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
        <p style={styles.subtitle}>{isLogin ? 'Log in to continue to your study planner.' : 'Get started with your personalized study plan.'}</p>
        <form onSubmit={handleEmailAuth} style={styles.form}>
          <div style={styles.inputContainer}><UserIcon /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} disabled={loading} /></div>
          <div style={styles.inputContainer}><LockIcon /><input type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} disabled={loading}/></div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>{loading && !isLogin ? <div style={styles.loader}></div> : (isLogin ? 'Login' : 'Sign Up')}</button>
        </form>
        <div style={styles.divider}><span style={styles.dividerLine}></span><span style={styles.dividerText}>OR</span><span style={styles.dividerLine}></span></div>
        <button onClick={handleGoogleSignIn} style={{...styles.button, ...styles.googleButton}} disabled={loading}>
            {loading ? <div style={styles.loader}></div> : <><GoogleIcon /> Sign in with Google</>}
        </button>
        <button onClick={() => setIsLogin(!isLogin)} style={styles.toggleButton} disabled={loading}>{isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}</button>
      </div>
    </div>
  );
};

export default AuthPage;
