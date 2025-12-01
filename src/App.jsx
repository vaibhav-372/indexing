import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation
} from 'react-router-dom';
import Data from './Data';
import Game from './Game';
import Login from './Login';
import NotFound from './NotFound';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';

function Layout() {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const hideNav = location.pathname === '/login' || !isLoggedIn;

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Conditionally render navigation */}
      {!hideNav && (
        <nav className="bg-[#2EE8B3] p-4 shadow-md flex justify-between items-center">
          <div className="flex gap-4">
            <NavLink
              to="/data"
              className={({ isActive }) =>
                `px-4 py-2 rounded font-semibold hover:cursor-pointer ${isActive ? 'bg-white text-[#2EE8B3]' : 'text-white'
                }`
              }
            >
              Data
            </NavLink>
            <NavLink
              to="/game"
              className={({ isActive }) =>
                `px-4 py-2 rounded font-semibold hover:cursor-pointer ${isActive ? 'bg-white text-[#2EE8B3]' : 'text-white'
                }`
              }
            >
              Game
            </NavLink>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white">
              Welcome, {localStorage.getItem('username')}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-[#2EE8B3] rounded font-semibold hover:bg-gray-100 transition"
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      {/* Content */}
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/game" replace />
            </ProtectedRoute>
          } />
          <Route path="/data" element={
            <ProtectedRoute>
              <Data />
            </ProtectedRoute>
          } />
          <Route path="/game" element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}