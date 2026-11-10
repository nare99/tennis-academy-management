
import { Route, Routes } from 'react-router-dom';

import { Header } from '../components/layout/Header';
import { NotFoundPage } from '../components/layout/NotFoundPage';

import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';

import { HomePage } from '../features/courts/pages/HomePage';

import { BookingPage } from '../features/bookings/pages/BookingPage';
import { MyBookingsPage } from '../features/bookings/pages/MyBookingsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Header />
            <HomePage />
          </>
        }
      />

      <Route
        path="/login"
        element={
          <>
            <Header />
            <LoginPage />
          </>
        }
      />

      <Route
        path="/register"
        element={
          <>
            <Header />
            <RegisterPage />
          </>
        }
      />

      <Route
        path="/courts/:courtId/book"
        element={
          <>
            <Header />
            <BookingPage />
          </>
        }
      />

      <Route
        path="/my-bookings"
        element={
          <>
            <Header />
            <MyBookingsPage />
          </>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
