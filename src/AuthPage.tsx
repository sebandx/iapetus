import { useState } from 'react';
import { auth } from './firebase'; // This will now correctly import from firebase.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // FirebaseError is not a direct export, so we remove it.
} from 'firebase/auth';

// --- Define a type for our styles object ---
// This tells TypeScript what CSS properties are allowed and what their values can be.
const componentStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '10px',
  },
  subtitle: {
      color: '#6B7280',
      marginBottom: '30px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px', // Padding for icon
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4F46E5',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '48px',
  },
  toggleButton: {
    marginTop: '20px',
    background: 'none',
    border: 'none',
    color: '#4F46E5',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: '#EF4444',
    marginBottom: '15px',
    fontSize: '14px',
  },
  loader: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4F46E5',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    animation: 'spin 1s linear infinite'
  }
};


// --- SVG Icons (no changes needed here) ---
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


const AuthPage = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // --- Add a specific type for the form submission event ---
  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('User logged in successfully!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('User account created successfully!');
      }
    } catch (err) {
        // --- Safely check the error type ---
        // We check if the error is an object and has a 'code' property
        if (typeof err === 'object' && err !== null && 'code' in err) {
            const firebaseError = err as { code: string }; // Type assertion
            switch (firebaseError.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('Invalid email or password.');
                    break;
                case 'auth/email-already-in-use':
                    setError('An account already exists with this email address.');
                    break;
                default:
                    setError('An error occurred. Please try again.');
            }
        } else {
            setError('An unknown error occurred.');
        }
        console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={componentStyles.container}>
       <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={componentStyles.card}>
        <h2 style={componentStyles.title}>{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
        <p style={componentStyles.subtitle}>
          {isLogin ? 'Log in to continue to your study planner.' : 'Get started with your personalized study plan.'}
        </p>

        <form onSubmit={handleAuth} style={componentStyles.form}>
          <div style={componentStyles.inputContainer}>
            <UserIcon />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={componentStyles.input}
              disabled={loading}
            />
          </div>
          <div style={componentStyles.inputContainer}>
            <LockIcon />
            <input
              type="password"
              placeholder="Password"
              // --- Change minLength to use a number ---
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={componentStyles.input}
              disabled={loading}
            />
          </div>
          
          {error && <p style={componentStyles.error}>{error}</p>}
          
          <button type="submit" style={componentStyles.button} disabled={loading}>
            {loading ? <div style={componentStyles.loader}></div> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} style={componentStyles.toggleButton} disabled={loading}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;