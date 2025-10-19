import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import type { RootState } from './store';
import { useEffect } from 'react';
import { loadUser } from './hooks/authActions';

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/home";
import EventsPage from "./pages/eventPage";
import EventDetailPage from "./pages/eventDetailPage";
import { AttendateManagement } from "./pages/attendateManagement";
import UsersManagementPage from "./pages/UsersManagementPage";
import ProtectedRoute from './components/ProtectedRoute';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authInitialized } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    // Kick off token-based user load once on app start
    store.dispatch(loadUser());
  }, []);
  if (!authInitialized) {
    return null; // or a loader
  }
  return <>{children}</>;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
            <Route path="/events/:id/attendance" element={<ProtectedRoute><AttendateManagement /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersManagementPage /></ProtectedRoute>} />

            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
