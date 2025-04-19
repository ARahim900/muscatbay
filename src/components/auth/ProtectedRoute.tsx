
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles = [] }) => {
  const { user, isLoading } = useAuth();
  
  // If auth is still loading, show a loading indicator
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If user is not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // If roles are specified, check if user has the required role
  if (roles.length > 0) {
    const userRoles = user.app_metadata?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }
  
  // User is authenticated and has required roles, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
