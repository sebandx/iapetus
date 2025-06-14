// src/components/ProtectedRoute.tsx

// 'React' is no longer needed here for JSX.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  // If there's no user, redirect to the login page.
  // Otherwise, render the child routes.
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
