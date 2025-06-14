// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
// This 'type' keyword fixes the verbatimModuleSyntax error for the User type.
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

// Define the shape of the context value
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// The provider component that wraps the app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribing function
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Set loading to false once we get the user status
    });

    // Unsubscribe from the listener when the component unmounts
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
