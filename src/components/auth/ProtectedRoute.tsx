
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Add console logs for debugging
  console.log("ProtectedRoute - Current path:", location.pathname);
  console.log("ProtectedRoute - User authenticated:", !!user);
  console.log("ProtectedRoute - Auth loading:", loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-muscat-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Show toast only when trying to access a protected route
    if (location.pathname !== '/auth') {
      toast.error('Please log in to access this page');
      console.log("ProtectedRoute - Redirecting to auth page from:", location.pathname);
    }
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  console.log("ProtectedRoute - Access granted to:", location.pathname);
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
