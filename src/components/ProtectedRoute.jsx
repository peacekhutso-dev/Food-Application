// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KanteenLoader from './KanteenLoader';

const ProtectedRoute = ({ children, allowGuest = false }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <KanteenLoader />;

  if (currentUser) return children;
  if (allowGuest) return children;
  return <Navigate to="/auth" replace />;
};

export default ProtectedRoute;