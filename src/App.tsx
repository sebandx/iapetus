// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
// Import the new CalendarView component
import CalendarView from './pages/CalendarView';

// --- Placeholder Components for Dashboard sections ---
const TodoList = () => <h2>To-do Tasks</h2>;
// The placeholder for CalendarView is no longer needed

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
              {/* Nested routes for the dashboard content */}
              <Route index element={<Navigate to="/tasks" replace />} />
              <Route path="tasks" element={<TodoList />} />
              {/* Use the real CalendarView component */}
              <Route path="calendar" element={<CalendarView />} />
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
