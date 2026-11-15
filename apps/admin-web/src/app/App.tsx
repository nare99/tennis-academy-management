import { Navigate, Route, Routes } from 'react-router-dom';

import RequireAdmin from '../components/auth/RequireAdmin';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import CourtsPage from '../features/courts/pages/CourtsPage';
import OperatingHoursPage from '../features/operating-hours/pages/OperatingHoursPage';
import AdminLayout from '../layouts/AdminLayout';
import AppProviders from './providers';

export default function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courts" element={<CourtsPage />} />
            <Route path="/operating-hours" element={<OperatingHoursPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </AppProviders>
  );
}
