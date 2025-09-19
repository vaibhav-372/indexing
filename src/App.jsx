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
import NotFound from './NotFound';

function Layout() {
  const location = useLocation();
  const hideNav = location.pathname !== '/data' && location.pathname !== '/game';

  return (
    <div className="min-h-screen bg-white">
      {/* Conditionally render navigation */}
      {!hideNav && (
        <nav className="bg-[#2EE8B3] p-4 shadow-md flex gap-4">
          <NavLink
            to="/data"
            className={({ isActive }) =>
              `px-4 py-2 rounded font-semibold hover:cursor-pointer ${
                isActive ? 'bg-white text-[#2EE8B3]' : 'text-white'
              }`
            }
          >
            Data
          </NavLink>
          <NavLink
            to="/game"
            className={({ isActive }) =>
              `px-4 py-2 rounded font-semibold hover:cursor-pointer ${
                isActive ? 'bg-white text-[#2EE8B3]' : 'text-white'
              }`
            }
          >
            Game
          </NavLink>
        </nav>
      )}

      {/* Content */}
      <div className="p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/game" replace />} />
          <Route path="/data" element={<Data />} />
          <Route path="/game" element={<Game />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
