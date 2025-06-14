import React, { useState } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous errors

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('User logged in successfully!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('User account created successfully!');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ margin: 'auto', width: '300px', textAlign: 'center' }}>
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: '10px' }}>
        Switch to {isLogin ? 'Sign Up' : 'Login'}
      </button>
    </div>
  );
};

export default AuthPage;