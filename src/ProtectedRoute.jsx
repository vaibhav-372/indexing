import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to login page with return location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}