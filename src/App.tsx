// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
// Import the new, functional TodoList component
import TodoList from './pages/TodoList';
import Courses from './pages/Courses';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />}>
              {/* Default child route for the dashboard */}
              <Route index element={<Navigate to="/tasks" replace />} />
              {/* Use the real TodoList component */}
              <Route path="tasks" element={<TodoList />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="courses" element={<Courses />} />
            </Route>
          </Route>

           {/* Fallback route if no other route matches */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
