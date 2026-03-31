import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Flights from './pages/Flights';
import Hotels from './pages/Hotels';
import CarRental from './pages/CarRental';
import Activities from './pages/Activities';
import Itinerary from './pages/Itinerary';
import Budget from './pages/Budget';
import Checklist from './pages/Checklist';
import Report from './pages/Report';
import Settings from './pages/Settings';
import CurrencyCalculator from './pages/CurrencyCalculator';
import Join from './pages/Join';
import SharedTrip from './pages/SharedTrip';
import { useAuthStore } from './store/authStore';

export default function App() {
  const { loadUsers, usersLoaded } = useAuthStore();

  useEffect(() => {
    loadUsers();
  }, []);

  if (!usersLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center" dir="rtl">
        <div className="text-white text-center space-y-3">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-blue-100 text-sm">טוען מערכת...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/shared-trip" element={<SharedTrip />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="flights" element={<Flights />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="car-rental" element={<CarRental />} />
          <Route path="activities" element={<Activities />} />
          <Route path="itinerary" element={<Itinerary />} />
          <Route path="budget" element={<Budget />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="report" element={<Report />} />
          <Route path="settings" element={<Settings />} />
          <Route path="currency" element={<CurrencyCalculator />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
